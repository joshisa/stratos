package authx

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	log "github.com/sirupsen/logrus"

	"github.com/labstack/echo"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/errors"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/proxy"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/tokens"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/stringutils"

	"golang.org/x/crypto/bcrypt"
)

// LoginHookFunc - function that can be hooked into a successful user login
type LoginHookFunc func(c echo.Context) error

// UAAAdminIdentifier - The identifier that UAA uses to convey administrative level perms
const UAAAdminIdentifier = "stratos.admin"

// CFAdminIdentifier - The scope that Cloud Foundry uses to convey administrative level perms
const CFAdminIdentifier = "cloud_controller.admin"

// SessionExpiresOnHeader Custom header for communicating the session expiry time to clients
const SessionExpiresOnHeader = "X-Cap-Session-Expires-On"

// ClientRequestDateHeader Custom header for getting date form client
const ClientRequestDateHeader = "X-Cap-Request-Date"

// XSRFTokenHeader - XSRF Token Header name
const XSRFTokenHeader = "X-Xsrf-Token"

// XSRFTokenCookie - XSRF Token Cookie name
const XSRFTokenCookie = "XSRF-TOKEN"

// XSRFTokenSessionName - XSRF Token Session name
const XSRFTokenSessionName = "xsrf_token"

//LogoutResponse is sent upon user logout.
//It contains a flag to indicate whether or not the user was signed in with SSO
type LogoutResponse struct {
	IsSSO bool `json:"isSSO"`
}

func (a *Auth) getUAAIdentityEndpoint() string {
	log.Debug("getUAAIdentityEndpoint")
	return fmt.Sprintf("%s/oauth/token", a.UAAEndpoint)
}

func (a *Auth) removeEmptyCookie(c echo.Context) {
	req := c.Request()
	originalCookie := req.Header.Get("Cookie")
	cleanCookie := p.EmptyCookieMatcher.ReplaceAllLiteralString(originalCookie, "")
	req.Header.Set("Cookie", cleanCookie)
}

// Get the user name for the specified user
func (a *Auth) GetUsername(userid string) (string, error) {
	tr, err := a.GetUAATokenRecord(userid)
	if err != nil {
		return "", err
	}

	u, userTokenErr := a.GetUserTokenInfo(tr.AuthToken)
	if userTokenErr != nil {
		return "", userTokenErr
	}

	return u.UserName, nil
}

// Login via UAA
func (a *Auth) initSSOlogin(c echo.Context) error {
	if !a.SSOLogin {
		err := errors.NewHTTPShadowError(
			http.StatusNotFound,
			"SSO Login is not enabled",
			"SSO Login is not enabled")
		return err
	}

	state := c.QueryParam("state")
	if len(state) == 0 {
		err := errors.NewHTTPShadowError(
			http.StatusUnauthorized,
			"SSO Login: State parameter missing",
			"SSO Login: State parameter missing")
		return err
	}

	redirectURL := fmt.Sprintf("%s/oauth/authorize?response_type=code&client_id=%s&redirect_uri=%s", a.AuthorizationEndpoint, a.ConsoleClient, url.QueryEscape(getSSORedirectURI(state, state, "")))
	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
	return nil
}

func getSSORedirectURI(base string, state string, endpointGUID string) string {
	baseURL, _ := url.Parse(base)
	baseURL.Path = ""
	baseURL.RawQuery = ""
	baseURLString := strings.TrimRight(baseURL.String(), "?")

	returnURL := fmt.Sprintf("%s/pp/v1/auth/sso_login_callback?state=%s", baseURLString, url.QueryEscape(state))
	if len(endpointGUID) > 0 {
		returnURL = fmt.Sprintf("%s&guid=%s", returnURL, endpointGUID)
	}
	return returnURL
}

// Logout of the UAA
func (a *Auth) ssoLogoutOfUAA(c echo.Context) error {
	if !a.SSOLogin {
		err := errors.NewHTTPShadowError(
			http.StatusNotFound,
			"SSO Login is not enabled",
			"SSO Login is not enabled")
		return err
	}

	state := c.QueryParam("state")
	if len(state) == 0 {
		err := errors.NewHTTPShadowError(
			http.StatusUnauthorized,
			"SSO Login: State parameter missing",
			"SSO Login: State parameter missing")
		return err
	}

	// Redirect to the UAA to logout of the UAA session as well (if confimainured to do so), otherwise redirect back to the UI login page
	var redirectURL string
	if a.hasSSOOption("logout") {
		redirectURL = fmt.Sprintf("%s/logout.do?client_id=%s&redirect=%s", p.Config.ConsoleConfig.UAAEndpoint, p.Config.ConsoleConfig.ConsoleClient, url.QueryEscape(getSSORedirectURI(state, "logout", "")))
	} else {
		redirectURL = "/login?SSO_Message=You+have+been+logged+out"
	}
	return c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

func (a *Auth) hasSSOOption(option string) bool {
	// Remove all spaces
	opts := stringutils.RemoveSpaces(p.Config.SSOOptions)

	// Split based on ','
	options := strings.Split(opts, ",")
	return stringutils.ArrayContainsString(options, option)
}

// Callback - invoked after the UAA login flow has completed and during logout
// We use a single callback so this can be whitelisted in the client
func (a *Auth) ssoLoginToUAA(c echo.Context) error {
	state := c.QueryParam("state")
	if len(state) == 0 {
		err := errors.NewHTTPShadowError(
			http.StatusUnauthorized,
			"SSO Login: State parameter missing",
			"SSO Login: State parameter missing")
		return err
	}

	// We use the same callback URL for both UAA and endpoint login
	// Check if it is an endpoint login and dens to the right handler
	endpointGUID := c.QueryParam("guid")
	if len(endpointGUID) > 0 {
		return a.ssoLoginToCNSI(c)
	}

	if state == "logout" {
		return c.Redirect(http.StatusTemporaryRedirect, "/login?SSO_Message=You+have+been+logged+out")
	}
	_, err := a.doLoginToUAA(c)
	if err != nil {
		// Send error as query string param
		msg := err.Error()
		if httpError, ok := err.(errors.ErrHTTPShadow); ok {
			msg = httpError.UserFacingError
		}
		if httpError, ok := err.(errors.ErrHTTPRequest); ok {
			msg = httpError.Response
		}
		state = fmt.Sprintf("%s/login?SSO_Message=%s", state, url.QueryEscape(msg))
	}

	return c.Redirect(http.StatusTemporaryRedirect, state)
}

func (a *Auth) loginToUAA(c echo.Context) error {
	log.Debug("loginToUAA")

	if AuthEndpointTypes[a.AuthEndpointType] != Remote {
		err := errors.NewHTTPShadowError(
			http.StatusNotFound,
			"UAA Login is not enabled",
			"UAA Login is not enabled")
		return err
	}

	resp, err := a.doLoginToUAA(c)
	if err != nil {
		return err
	}

	jsonString, err := json.Marshal(resp)
	if err != nil {
		return err
	}

	// Add XSRF Token
	p.ensureXSRFToken(c)

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)

	return nil
}

// Use the appropriate login mechanism
func (a *Auth) stratosLoginHandler(c echo.Context) error {
	// Local login
	if AuthEndpointTypes[a.AuthEndpointType] == Local {
		return a.localLogin(c)
	}

	// UAA login
	return a.loginToUAA(c)
}

// Use the appropriate logout mechanism
func (a *Auth) stratosLogoutHandler(c echo.Context) error {
	return a.logout(c)
}

func (a *Auth) doLoginToUAA(c echo.Context) (*structs.LoginRes, error) {
	log.Debug("doLoginToUAA")
	uaaRes, u, err := p.login(c, a.SkipSSLValidation, a.ConsoleClient, a.ConsoleClientSecret, a.getUAAIdentityEndpoint())
	if err != nil {
		// Check the Error
		errMessage := "Access Denied"
		if httpError, ok := err.(errors.ErrHTTPRequest); ok {
			// Try and parse the Response into UAA error structure
			authError := &errors.UAAErrorResponse{}
			if err := json.Unmarshal([]byte(httpError.Response), authError); err == nil {
				errMessage = authError.ErrorDescription
			}
		}

		err = errors.NewHTTPShadowError(
			http.StatusUnauthorized,
			errMessage,
			"UAA Login failed: %s: %v", errMessage, err)
		return nil, err
	}

	sessionValues := make(map[string]interface{})
	sessionValues["user_id"] = u.UserGUID
	sessionValues["exp"] = u.TokenExpiry

	// Ensure that login disregards cookies from the request
	req := c.Request()
	req.Header.Set("Cookie", "")
	if err = a.setSessionValues(c, sessionValues); err != nil {
		return nil, err
	}

	err = a.handleSessionExpiryHeader(c)
	if err != nil {
		return nil, err
	}

	_, err = a.saveAuthToken(*u, uaaRes.AccessToken, uaaRes.RefreshToken)
	if err != nil {
		return nil, err
	}

	err = p.ExecuteLoginHooks(c)
	if err != nil {
		log.Warnf("Login hooks failed: %v", err)
	}

	uaaAdmin := strings.Contains(uaaRes.Scope, a.ConsoleAdminScope)
	resp := &structs.LoginRes{
		Account:     u.UserName,
		TokenExpiry: u.TokenExpiry,
		APIEndpoint: nil,
		Admin:       uaaAdmin,
	}
	return resp, nil
}

func (a *Auth) localLogin(c echo.Context) error {
	log.Debug("localLogin")

	if AuthEndpointTypes[a.AuthEndpointType] != Local {
		err := errors.NewHTTPShadowError(
			http.StatusNotFound,
			"Local Login is not enabled",
			"Local Login is not enabled")
		return err
	}

	//Perform the login and fetch session values if successful
	userGUID, username, err := a.doLocalLogin(c)
	if err != nil {
		//Login failed, return response.
		errMessage := err.Error()
		err := errors.NewHTTPShadowError(
			http.StatusUnauthorized,
			errMessage,
			"Login failed: %s: %v", errMessage, err)
		return err
	}

	var expiry int64
	expiry = math.MaxInt64

	sessionValues := make(map[string]interface{})
	sessionValues["user_id"] = userGUID
	sessionValues["exp"] = expiry

	// Ensure that login disregards cookies from the request
	req := c.Request()
	req.Header.Set("Cookie", "")
	if err = p.setSessionValues(c, sessionValues); err != nil {
		return err
	}

	//Makes sure the client gets the right session expiry time
	if err = p.handleSessionExpiryHeader(c); err != nil {
		return err
	}

	resp := &structs.LoginRes{
		Account:     username,
		TokenExpiry: expiry,
		APIEndpoint: nil,
		Admin:       true,
	}

	if jsonString, err := json.Marshal(resp); err == nil {
		// Add XSRF Token
		p.ensureXSRFToken(c)
		c.Response().Header().Set("Content-Type", "application/json")
		c.Response().Write(jsonString)
	}

	return err
}

func (a *Auth) doLocalLogin(c echo.Context) (string, string, error) {
	log.Debug("doLocalLogin")

	username := c.FormValue("username")
	password := c.FormValue("password")

	if len(username) == 0 || len(password) == 0 {
		return "", username, errors.New("Needs usernameand password")
	}

	localUsersRepo, err := localusers.NewPgsqlLocalUsersRepository(a.DatabaseConnectionPool)
	if err != nil {
		log.Errorf("Database error getting repo for Local users: %v", err)
		return "", username, err
	}

	var scopeOK bool
	var hash []byte
	var authError error
	var localUserScope string

	// Get the GUID for the specified user
	guid, err := localUsersRepo.FindUserGUID(username)
	if err != nil {
		return guid, username, fmt.Errorf("Can not find user")
	}

	//Attempt to find the password has for the given user
	if hash, authError = localUsersRepo.FindPasswordHash(guid); authError != nil {
		authError = fmt.Errorf("User not found.")
		//Check the password hash
	} else if authError = CheckPasswordHash(password, hash); authError != nil {
		authError = fmt.Errorf("Access Denied - Invalid username/password credentials")
	} else {
		//Ensure the local user has some kind of admin role configured and we check for it here
		localUserScope, authError = localUsersRepo.FindUserScope(guid)
		scopeOK = strings.Contains(localUserScope, a.LocalUserScope)
		if (authError != nil) || (!scopeOK) {
			authError = fmt.Errorf("Access Denied - User scope invalid")
		} else {
			//Update the last login time here if login was successful
			loginTime := time.Now()
			if updateLoginTimeErr := localUsersRepo.UpdateLastLoginTime(guid, loginTime); updateLoginTimeErr != nil {
				log.Error(updateLoginTimeErr)
				log.Errorf("Failed to update last login time for user: %s", guid)
			}
		}
	}
	return guid, username, authError
}

//HashPassword accepts a plaintext password string and generates a salted hash
func HashPassword(password string) ([]byte, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return bytes, err
}

//CheckPasswordHash accepts a bcrypt salted hash and plaintext password.
//It verifies the password against the salted hash
func CheckPasswordHash(password string, hash []byte) error {
	err := bcrypt.CompareHashAndPassword(hash, []byte(password))
	return err
}

// Start SSO flow for an Endpoint
func (a *Auth) ssoLoginToCNSI(c echo.Context) error {
	log.Debug("ssoLoginToCNSI")
	endpointGUID := c.QueryParam("guid")
	if len(endpointGUID) == 0 {
		return errors.NewHTTPShadowError(
			http.StatusBadRequest,
			"Missing target endpoint",
			"Need Endpoint GUID passed as form param")
	}

	_, err := p.GetSessionStringValue(c, "user_id")
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "Could not find correct session value")
	}

	state := c.QueryParam("state")
	if len(state) == 0 {
		err := errors.NewHTTPShadowError(
			http.StatusUnauthorized,
			"SSO Login: State parameter missing",
			"SSO Login: State parameter missing")
		return err
	}

	cnsiRecord, err := p.GetCNSIRecord(endpointGUID)
	if err != nil {
		return errors.NewHTTPShadowError(
			http.StatusBadRequest,
			"Requested endpoint not registered",
			"No Endpoint registered with GUID %s: %s", endpointGUID, err)
	}

	// Check if this is first time in the flow, or via the callback
	code := c.QueryParam("code")

	if len(code) == 0 {
		// First time around
		// Use the standard SSO Login Callback endpoint, so this can be whitelisted for Stratos and Endpoint login
		returnURL := getSSORedirectURI(state, state, endpointGUID)
		redirectURL := fmt.Sprintf("%s/oauth/authorize?response_type=code&client_id=%s&redirect_uri=%s",
			cnsiRecord.AuthorizationEndpoint, cnsiRecord.ClientId, url.QueryEscape(returnURL))
		c.Redirect(http.StatusTemporaryRedirect, redirectURL)
		return nil
	}

	// Callback
	_, err = a.DoLoginToCNSI(c, endpointGUID, false)
	status := "ok"
	if err != nil {
		status = "fail"
	}

	// Take the user back to Stratos on the endpoints page
	redirect := fmt.Sprintf("/endpoints?cnsi_guid=%s&status=%s", endpointGUID, status)
	c.Redirect(http.StatusTemporaryRedirect, redirect)
	return nil
}

// Connect to the given Endpoint
// Note, an admin user can connect an endpoint as a system endpoint to share it with others
func (a *Auth) loginToCNSI(c echo.Context) error {
	log.Debug("loginToCNSI")
	cnsiGUID := c.FormValue("cnsi_guid")
	var systemSharedToken = false

	if len(cnsiGUID) == 0 {
		return errors.NewHTTPShadowError(
			http.StatusBadRequest,
			"Missing target endpoint",
			"Need Endpoint GUID passed as form param")
	}

	systemSharedValue := c.FormValue("system_shared")
	if len(systemSharedValue) > 0 {
		systemSharedToken = systemSharedValue == "true"
	}

	resp, err := a.DoLoginToCNSI(c, cnsiGUID, systemSharedToken)
	if err != nil {
		return err
	}

	jsonString, err := json.Marshal(resp)
	if err != nil {
		return err
	}

	c.Response().Header().Set("Content-Type", "application/json")
	c.Response().Write(jsonString)
	return nil
}

func (a *Auth) DoLoginToCNSI(c echo.Context, cnsiGUID string, systemSharedToken bool) (*structs.LoginRes, error) {

	cnsiRecord, err := p.GetCNSIRecord(cnsiGUID)
	if err != nil {
		return nil, errors.NewHTTPShadowError(
			http.StatusBadRequest,
			"Requested endpoint not registered",
			"No Endpoint registered with GUID %s: %s", cnsiGUID, err)
	}

	// Get the User ID since we save the CNSI token against the Console user guid, not the CNSI user guid so that we can look it up easily
	userID, err := p.GetSessionStringValue(c, "user_id")
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "Could not find correct session value")
	}

	// Register as a system endpoint?
	if systemSharedToken {
		// User needs to be an admin
		user, err := a.GetUAAUser(userID)
		if err != nil {
			return nil, echo.NewHTTPError(http.StatusUnauthorized, "Can not connect System Shared endpoint - could not check user")
		}

		if !user.Admin {
			return nil, echo.NewHTTPError(http.StatusUnauthorized, "Can not connect System Shared endpoint - user is not an administrator")
		}

		// We are all good to go - change the userID, so we record this token against the system-shared user and not this specific user
		// This is how we identify system-shared endpoint tokens
		userID = tokens.SystemSharedUserGuid
	}

	// Ask the endpoint type to connect
	for _, plugin := range a.Plugins {
		endpointPlugin, err := plugin.GetEndpointPlugin()
		if err != nil {
			// Plugin doesn't implement an Endpoint Plugin interface, skip
			continue
		}

		endpointType := endpointPlugin.GetType()
		if cnsiRecord.CNSIType == endpointType {
			tokenRecord, isAdmin, err := endpointPlugin.Connect(c, cnsiRecord, userID)
			if err != nil {
				if shadowError, ok := err.(errors.ErrHTTPShadow); ok {
					return nil, shadowError
				}
				return nil, errors.NewHTTPShadowError(
					http.StatusBadRequest,
					"Could not connect to the endpoint",
					"Could not connect to the endpoint: %s", err)
			}

			err = p.setCNSITokenRecord(cnsiGUID, userID, *tokenRecord)
			if err != nil {
				return nil, errors.NewHTTPShadowError(
					http.StatusBadRequest,
					"Failed to save Token for endpoint",
					"Error occurred: %s", err)
			}

			// Validate the connection - some endpoints may want to validate that the connected endpoint
			err = endpointPlugin.Validate(userID, cnsiRecord, *tokenRecord)
			if err != nil {
				// Clear the token
				a.ClearCNSIToken(cnsiRecord, userID)
				return nil, errors.NewHTTPShadowError(
					http.StatusBadRequest,
					"Could not connect to the endpoint",
					"Could not connect to the endpoint: %s", err)
			}

			resp := &structs.LoginRes{
				Account:     userID,
				TokenExpiry: tokenRecord.TokenExpiry,
				APIEndpoint: cnsiRecord.APIEndpoint,
				Admin:       isAdmin,
			}

			cnsiUser, ok := a.GetCNSIUserFromToken(cnsiGUID, tokenRecord)
			if ok {
				// If this is a system shared endpoint, then remove some metadata that should be send back to other users
				santizeInfoForSystemSharedTokenUser(cnsiUser, systemSharedToken)
				resp.User = cnsiUser
			} else {
				// Need to record a user
				resp.User = &structs.ConnectedUser{
					GUID:   "Unknown",
					Name:   "Unknown",
					Scopes: []string{"read"},
					Admin:  true,
				}
			}

			return resp, nil
		}
	}

	return nil, errors.NewHTTPShadowError(
		http.StatusBadRequest,
		"Endpoint connection not supported",
		"Endpoint connection not supported")
}

func (a *Auth) DoLoginToCNSIwithConsoleUAAtoken(c echo.Context, theCNSIrecord structs.CNSIRecord) error {
	userID, err := p.GetSessionStringValue(c, "user_id")
	if err != nil {
		return errors.New("could not find correct session value")
	}
	uaaToken, err := a.GetUAATokenRecord(userID)
	if err == nil { // Found the user's UAA token
		u, err := p.GetUserTokenInfo(uaaToken.AuthToken)
		if err != nil {
			return errors.New("could not parse current user UAA token")
		}
		cfEndpointSpec, _ := p.GetEndpointTypeSpec("cf")
		cnsiInfo, _, err := cfEndpointSpec.Info(theCNSIrecord.APIEndpoint.String(), true)
		if err != nil {
			log.Fatal("Could not get the info for Cloud Foundry", err)
			return err
		}

		uaaURL, err := url.Parse(cnsiInfo.TokenEndpoint)
		if err != nil {
			return fmt.Errorf("invalid authorization endpoint URL %s %s", cnsiInfo.TokenEndpoint, err)
		}

		if uaaURL.String() == p.GetConfig().ConsoleConfig.UAAEndpoint.String() { // CNSI UAA server matches Console UAA server
			uaaToken.LinkedGUID = uaaToken.TokenGUID
			err = p.setCNSITokenRecord(theCNSIrecord.GUID, u.UserGUID, uaaToken)

			// Update the endpoint to indicate that SSO Login is okay
			repo, dbErr := cnsis.NewPostgresCNSIRepository(p.DatabaseConnectionPool)
			if dbErr == nil {
				repo.Update(theCNSIrecord.GUID, true)
			}
			// Return error from the login
			return err
		}
		return fmt.Errorf("the auto-registered endpoint UAA server does not match console UAA server")
	}
	log.Warn("Could not find current user UAA token")
	return err
}

func santizeInfoForSystemSharedTokenUser(cnsiUser *structs.ConnectedUser, isSysystemShared bool) {
	if isSysystemShared {
		cnsiUser.GUID = tokens.SystemSharedUserGuid
		cnsiUser.Scopes = make([]string, 0)
		cnsiUser.Name = "system_shared"
	}
}

func (a *Auth) ConnectOAuth2(c echo.Context, cnsiRecord structs.CNSIRecord) (*TokenRecord, error) {
	uaaRes, u, _, err := a.FetchOAuth2Token(cnsiRecord, c)
	if err != nil {
		return nil, err
	}
	tokenRecord := a.InitEndpointTokenRecord(u.TokenExpiry, uaaRes.AccessToken, uaaRes.RefreshToken, false)
	return &tokenRecord, nil
}

func (a *Auth) fetchHTTPBasicToken(cnsiRecord structs.CNSIRecord, c echo.Context) (*UAAResponse, *JWTUserTokenInfo, *structs.CNSIRecord, error) {

	uaaRes, u, err := a.loginHTTPBasic(c)

	if err != nil {
		return nil, nil, nil, errors.NewHTTPShadowError(
			http.StatusUnauthorized,
			"Login failed",
			"Login failed: %v", err)
	}
	return uaaRes, u, &cnsiRecord, nil
}

func (a *Auth) FetchOAuth2Token(cnsiRecord structs.CNSIRecord, c echo.Context) (*UAAResponse, *JWTUserTokenInfo, *structs.CNSIRecord, error) {
	endpoint := cnsiRecord.AuthorizationEndpoint

	tokenEndpoint := fmt.Sprintf("%s/oauth/token", endpoint)

	uaaRes, u, err := p.login(c, cnsiRecord.SkipSSLValidation, cnsiRecord.ClientId, cnsiRecord.ClientSecret, tokenEndpoint)

	if err != nil {
		if httpError, ok := err.(errors.ErrHTTPRequest); ok {
			// Try and parse the Response into UAA error structure (p.login only handles UAA requests)
			errMessage := ""
			authError := &UAAErrorResponse{}
			if err := json.Unmarshal([]byte(httpError.Response), authError); err == nil {
				errMessage = fmt.Sprintf(": %s", authError.ErrorDescription)
			}
			return nil, nil, nil, errors.NewHTTPShadowError(
				httpError.Status,
				fmt.Sprintf("Could not connect to the endpoint%s", errMessage),
				"Could not connect to the endpoint: %s", err)
		}

		return nil, nil, nil, errors.NewHTTPShadowError(
			http.StatusBadRequest,
			"Login failed",
			"Login failed: %v", err)
	}
	return uaaRes, u, &cnsiRecord, nil
}

func (a *Auth) logoutOfCNSI(c echo.Context) error {
	log.Debug("logoutOfCNSI")

	cnsiGUID := c.FormValue("cnsi_guid")

	if len(cnsiGUID) == 0 {
		return errors.NewHTTPShadowError(
			http.StatusBadRequest,
			"Missing target endpoint",
			"Need CNSI GUID passed as form param")
	}

	userGUID, err := p.GetSessionStringValue(c, "user_id")
	if err != nil {
		return fmt.Errorf("Could not find correct session value: %s", err)
	}

	cnsiRecord, err := p.GetCNSIRecord(cnsiGUID)
	if err != nil {
		return fmt.Errorf("Unable to load CNSI record: %s", err)
	}

	// Get the existing token to see if it is connected as a system shared endpoint
	tr, ok := p.GetCNSITokenRecord(cnsiGUID, userGUID)
	if ok && tr.SystemShared {
		// User needs to be an admin
		user, err := a.GetUAAUser(userGUID)
		if err != nil {
			return echo.NewHTTPError(http.StatusUnauthorized, "Can not disconnect System Shared endpoint - could not check user")
		}

		if !user.Admin {
			return echo.NewHTTPError(http.StatusUnauthorized, "Can not disconnect System Shared endpoint - user is not an administrator")
		}
		userGUID = tokens.SystemSharedUserGuid
	}

	// Clear the token
	return a.ClearCNSIToken(cnsiRecord, userGUID)
}

// Clear the CNSI token
func (a *Auth) ClearCNSIToken(cnsiRecord structs.CNSIRecord, userGUID string) error {
	// If cnsi is cf AND cf is auto-register only clear the entry
	a.AutoRegisterCFUrl = strings.TrimRight(p.Config.AutoRegisterCFUrl, "/")
	if cnsiRecord.CNSIType == "cf" && p.GetConfig().AutoRegisterCFUrl == cnsiRecord.APIEndpoint.String() {
		log.Debug("Setting token record as disconnected")

		tokenRecord := a.InitEndpointTokenRecord(0, "cleared_token", "cleared_token", true)
		if err := a.setCNSITokenRecord(cnsiRecord.GUID, userGUID, tokenRecord); err != nil {
			return fmt.Errorf("Unable to clear token: %s", err)
		}
	} else {
		log.Debug("Deleting Token")
		if err := a.deleteCNSIToken(cnsiRecord.GUID, userGUID); err != nil {
			return fmt.Errorf("Unable to delete token: %s", err)
		}
	}

	return nil
}

func (a *Auth) RefreshUAALogin(username, password string, store bool) error {
	log.Debug("RefreshUAALogin")
	uaaRes, err := a.getUAATokenWithCreds(a.SkipSSLValidation, username, password, a.ConsoleClient, a.ConsoleClientSecret, a.getUAAIdentityEndpoint())
	if err != nil {
		return err
	}

	u, err := a.GetUserTokenInfo(uaaRes.AccessToken)
	if err != nil {
		return err
	}

	if store {
		_, err = a.saveAuthToken(*u, uaaRes.AccessToken, uaaRes.RefreshToken)
		if err != nil {
			return err
		}
	}

	return nil
}

func (a *Auth) login(c echo.Context, skipSSLValidation bool, client string, clientSecret string, endpoint string) (uaaRes *UAAResponse, u *JWTUserTokenInfo, err error) {
	log.Debug("login")
	if c.Request().Method == http.MethodGet {
		code := c.QueryParam("code")
		state := c.QueryParam("state")
		// If this is login for a CNSI, then the redirect URL is slightly different
		cnsiGUID := c.QueryParam("guid")
		uaaRes, err = p.getUAATokenWithAuthorizationCode(skipSSLValidation, code, client, clientSecret, endpoint, state, cnsiGUID)
	} else {
		username := c.FormValue("username")
		password := c.FormValue("password")

		if len(username) == 0 || len(password) == 0 {
			return uaaRes, u, errors.New("Needs username and password")
		}
		uaaRes, err = a.getUAATokenWithCreds(skipSSLValidation, username, password, client, clientSecret, endpoint)
	}
	if err != nil {
		return uaaRes, u, err
	}

	u, err = a.GetUserTokenInfo(uaaRes.AccessToken)
	if err != nil {
		return uaaRes, u, err
	}

	return uaaRes, u, nil
}

func (a *Auth) loginHTTPBasic(c echo.Context) (uaaRes *UAAResponse, u *JWTUserTokenInfo, err error) {
	log.Debug("login")
	username := c.FormValue("username")
	password := c.FormValue("password")

	if len(username) == 0 || len(password) == 0 {
		return uaaRes, u, errors.New("Needs username and password")
	}

	authString := fmt.Sprintf("%s:%s", username, password)
	base64EncodedAuthString := base64.StdEncoding.EncodeToString([]byte(authString))

	uaaRes.AccessToken = fmt.Sprintf("Basic %s", base64EncodedAuthString)
	return uaaRes, u, nil
}

func (a *Auth) logout(c echo.Context) error {
	log.Debug("logout")

	p.removeEmptyCookie(c)

	// Remove the XSRF Token from the session
	p.unsetSessionValue(c, XSRFTokenSessionName)

	err := p.clearSession(c)
	if err != nil {
		log.Errorf("Unable to clear session: %v", err)
	}

	// Send JSON document
	resp := &LogoutResponse{
		IsSSO: p.Config.SSOLogin,
	}

	return c.JSON(http.StatusOK, resp)
}

func (p *proxy.PortalProxy) getUAATokenWithAuthorizationCode(skipSSLValidation bool, code, client, clientSecret, authEndpoint string, state string, cnsiGUID string) (*UAAResponse, error) {
	log.Debug("getUAATokenWithAuthorizationCode")

	body := url.Values{}
	body.Set("grant_type", "authorization_code")
	body.Set("code", code)
	body.Set("client_id", client)
	body.Set("client_secret", clientSecret)
	body.Set("redirect_uri", getSSORedirectURI(state, state, cnsiGUID))

	return p.getUAAToken(body, skipSSLValidation, client, clientSecret, authEndpoint)
}

func (p *proxy.PortalProxy) getUAATokenWithCreds(skipSSLValidation bool, username, password, client, clientSecret, authEndpoint string) (*UAAResponse, error) {
	log.Debug("getUAATokenWithCreds")

	body := url.Values{}
	body.Set("grant_type", "password")
	body.Set("username", username)
	body.Set("password", password)
	body.Set("response_type", "token")

	return p.getUAAToken(body, skipSSLValidation, client, clientSecret, authEndpoint)
}

func (p *proxy.PortalProxy) getUAATokenWithRefreshToken(skipSSLValidation bool, refreshToken, client, clientSecret, authEndpoint string, scopes string) (*UAAResponse, error) {
	log.Debug("getUAATokenWithRefreshToken")

	body := url.Values{}
	body.Set("grant_type", "refresh_token")
	body.Set("refresh_token", refreshToken)
	body.Set("response_type", "token")

	if len(scopes) > 0 {
		body.Set("scope", scopes)
	}

	return p.getUAAToken(body, skipSSLValidation, client, clientSecret, authEndpoint)
}

func (p *proxy.PortalProxy) getUAAToken(body url.Values, skipSSLValidation bool, client, clientSecret, authEndpoint string) (*UAAResponse, error) {
	log.WithField("authEndpoint", authEndpoint).Debug("getUAAToken")
	req, err := http.NewRequest("POST", authEndpoint, strings.NewReader(body.Encode()))
	if err != nil {
		msg := "Failed to create request for UAA: %v"
		log.Errorf(msg, err)
		return nil, fmt.Errorf(msg, err)
	}

	req.SetBasicAuth(client, clientSecret)
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationForm)

	var h = p.GetHttpClientForRequest(req, skipSSLValidation)
	res, err := h.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		log.Errorf("Error performing http request - response: %v, error: %v", res, err)
		return nil, errors.LogHTTPError(res, err)
	}

	defer res.Body.Close()

	var response UAAResponse

	dec := json.NewDecoder(res.Body)
	if err = dec.Decode(&response); err != nil {
		log.Errorf("Error decoding response: %v", err)
		return nil, fmt.Errorf("getUAAToken Decode: %s", err)
	}

	return &response, nil
}

func (p *proxy.PortalProxy) saveAuthToken(u JWTUserTokenInfo, authTok string, refreshTok string) (TokenRecord, error) {
	log.Debug("saveAuthToken")

	key := u.UserGUID
	tokenRecord := TokenRecord{
		AuthToken:    authTok,
		RefreshToken: refreshTok,
		TokenExpiry:  u.TokenExpiry,
		AuthType:     AuthTypeOAuth2,
	}

	err := p.setUAATokenRecord(key, tokenRecord)
	if err != nil {
		return tokenRecord, err
	}

	return tokenRecord, nil
}

// Helper to initialzie a token record using the specified parameters
func (p *proxy.PortalProxy) InitEndpointTokenRecord(expiry int64, authTok string, refreshTok string, disconnect bool) TokenRecord {
	tokenRecord := TokenRecord{
		AuthToken:    authTok,
		RefreshToken: refreshTok,
		TokenExpiry:  expiry,
		Disconnected: disconnect,
		AuthType:     AuthTypeOAuth2,
	}

	return tokenRecord
}

func (p *proxy.PortalProxy) deleteCNSIToken(cnsiID string, userGUID string) error {
	log.Debug("deleteCNSIToken")

	err := p.unsetCNSITokenRecord(cnsiID, userGUID)
	if err != nil {
		log.Errorf("%v", err)
		return err
	}

	return nil
}

func (a *Auth) GetUAATokenRecord(userGUID string) (TokenRecord, error) {
	log.Debug("GetUAATokenRecord")

	tokenRepo, err := tokens.NewPgsqlTokenRepository(a.DatabaseConnectionPool)
	if err != nil {
		log.Errorf("Database error getting repo for UAA token: %v", err)
		return TokenRecord{}, err
	}

	tr, err := tokenRepo.FindAuthToken(userGUID, a.EncryptionKeyInBytes)
	if err != nil {
		log.Errorf("Database error finding UAA token: %v", err)
		return TokenRecord{}, err
	}

	return tr, nil
}

func (a *Auth) setUAATokenRecord(key string, t TokenRecord) error {
	log.Debug("setUAATokenRecord")

	tokenRepo, err := tokens.NewPgsqlTokenRepository(a.DatabaseConnectionPool)
	if err != nil {
		return fmt.Errorf("Database error getting repo for UAA token: %v", err)
	}

	err = tokenRepo.SaveAuthToken(key, t, a.EncryptionKeyInBytes)
	if err != nil {
		return fmt.Errorf("Database error saving UAA token: %v", err)
	}

	return nil
}

func (a *Auth) verifySession(c echo.Context) error {
	log.Debug("verifySession")

	sessionExpireTime, err := p.GetSessionInt64Value(c, "exp")
	if err != nil {
		msg := "Could not find session date"
		log.Error(msg)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	sessionUser, err := p.GetSessionStringValue(c, "user_id")
	if err != nil {
		msg := "Could not find user_id in Session"
		log.Error(msg)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	if AuthEndpointTypes[a.AuthEndpointType] == Local {
		err = a.verifySessionLocal(c, sessionUser, sessionExpireTime)
	} else {
		err = a.verifySessionUAA(c, sessionUser, sessionExpireTime)
	}

	// Could not verify session
	if err != nil {
		log.Error(err)
		return echo.NewHTTPError(http.StatusForbidden, "Could not verify user")
	}

	err = p.handleSessionExpiryHeader(c)
	if err != nil {
		return err
	}

	info, err := p.getInfo(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// Add XSRF Token
	p.ensureXSRFToken(c)

	err = c.JSON(http.StatusOK, info)
	if err != nil {
		return err
	}

	return nil
}

func (p *proxy.PortalProxy) verifySessionUAA(c echo.Context, sessionUser string, sessionExpireTime int64) error {
	tr, err := p.GetUAATokenRecord(sessionUser)
	if err != nil {
		msg := fmt.Sprintf("Unable to find UAA Token: %s", err)
		log.Error(msg, err)
		return echo.NewHTTPError(http.StatusForbidden, msg)
	}

	// Check if UAA token has expired
	if time.Now().After(time.Unix(sessionExpireTime, 0)) {

		// UAA Token has expired, refresh the token, if that fails, fail the request
		uaaRes, tokenErr := p.getUAATokenWithRefreshToken(p.Config.ConsoleConfig.SkipSSLValidation, tr.RefreshToken, p.Config.ConsoleConfig.ConsoleClient, p.Config.ConsoleConfig.ConsoleClientSecret, p.getUAAIdentityEndpoint(), "")
		if tokenErr != nil {
			msg := "Could not refresh UAA token"
			log.Error(msg, tokenErr)
			return echo.NewHTTPError(http.StatusForbidden, msg)
		}

		u, userTokenErr := p.GetUserTokenInfo(uaaRes.AccessToken)
		if userTokenErr != nil {
			return userTokenErr
		}

		if _, err = p.saveAuthToken(*u, uaaRes.AccessToken, uaaRes.RefreshToken); err != nil {
			return err
		}
		sessionValues := make(map[string]interface{})
		sessionValues["user_id"] = u.UserGUID
		sessionValues["exp"] = u.TokenExpiry

		if err = p.setSessionValues(c, sessionValues); err != nil {
			return err
		}
	} else {
		// Still need to extend the expires_on of the Session
		if err = p.setSessionValues(c, nil); err != nil {
			return err
		}
	}

	return nil
}

func (p *proxy.PortalProxy) verifySessionLocal(c echo.Context, sessionUser string, sessionExpireTime int64) error {
	localUsersRepo, err := localusers.NewPgsqlLocalUsersRepository(p.DatabaseConnectionPool)
	if err != nil {
		log.Errorf("Database error getting repo for Local users: %v", err)
		return err
	}

	_, err = localUsersRepo.FindPasswordHash(sessionUser)
	return err
}

// Create a token for XSRF if needed, store it in the session and add the response header for the front-end to pick up
func (p *proxy.PortalProxy) ensureXSRFToken(c echo.Context) {
	token, err := p.GetSessionStringValue(c, XSRFTokenSessionName)
	if err != nil || len(token) == 0 {
		// Need a new token
		tokenBytes, err := generateRandomBytes(32)
		if err == nil {
			token = base64.StdEncoding.EncodeToString(tokenBytes)
		} else {
			token = ""
		}
		sessionValues := make(map[string]interface{})
		sessionValues[XSRFTokenSessionName] = token
		p.setSessionValues(c, sessionValues)
	}

	if len(token) > 0 {
		c.Response().Header().Set(XSRFTokenHeader, token)
	}
}

// See: https://github.com/gorilla/csrf/blob/a8abe8abf66db8f4a9750d76ba95b4021a354757/helpers.go
// generateRandomBytes returns securely generated random bytes.
// It will return an error if the system's secure random number generator fails to function correctly.
func generateRandomBytes(n int) ([]byte, error) {
	b := make([]byte, n)
	_, err := rand.Read(b)
	// err == nil only if len(b) == n
	if err != nil {
		return nil, err
	}

	return b, nil

}

func (p *proxy.PortalProxy) handleSessionExpiryHeader(c echo.Context) error {

	// Explicitly tell the client when this session will expire. This is needed because browsers actively hide
	// the Set-Cookie header and session cookie expires_on from client side javascript
	expOn, err := p.GetSessionValue(c, "expires_on")
	if err != nil {
		msg := "Could not get session expiry"
		log.Error(msg+" - ", err)
		return echo.NewHTTPError(http.StatusInternalServerError, msg)
	}
	c.Response().Header().Set(SessionExpiresOnHeader, strconv.FormatInt(expOn.(time.Time).Unix(), 10))

	expiry := expOn.(time.Time)
	expiryDuration := expiry.Sub(time.Now())

	// Subtract time now to get the duration add this to the time provided by the client
	clientDate := c.Request().Header.Get(ClientRequestDateHeader)
	if len(clientDate) > 0 {
		clientDateInt, err := strconv.ParseInt(clientDate, 10, 64)
		if err == nil {
			clientDateInt += int64(expiryDuration.Seconds())
			c.Response().Header().Set(SessionExpiresOnHeader, strconv.FormatInt(clientDateInt, 10))
		}
	}

	return nil
}

func (p *proxy.PortalProxy) GetStratosUser(userGUID string) (*users.ConnectedUser, error) {
	log.Debug("GetStratosUser")

	// If configured for local users, use that instead
	// This needs to be refactored
	if AuthEndpointTypes[p.Config.ConsoleConfig.AuthEndpointType] == Local {
		return p.getLocalUser(userGUID)
	}

	return p.GetUAAUser(userGUID)
}

func (p *proxy.PortalProxy) GetUAAUser(userGUID string) (*users.ConnectedUser, error) {
	log.Debug("getUAAUser")

	// get the uaa token record
	uaaTokenRecord, err := p.GetUAATokenRecord(userGUID)
	if err != nil {
		msg := "Unable to retrieve UAA token record."
		log.Error(msg)
		return nil, fmt.Errorf(msg)
	}

	// get the scope out of the JWT token data
	userTokenInfo, err := p.GetUserTokenInfo(uaaTokenRecord.AuthToken)
	if err != nil {
		msg := "Unable to find scope information in the UAA Auth Token: %s"
		log.Errorf(msg, err)
		return nil, fmt.Errorf(msg, err)
	}

	// is the user a UAA admin?
	uaaAdmin := strings.Contains(strings.Join(userTokenInfo.Scope, ""), p.Config.ConsoleConfig.ConsoleAdminScope)

	// add the uaa entry to the output
	uaaEntry := &users.ConnectedUser{
		GUID:   userGUID,
		Name:   userTokenInfo.UserName,
		Admin:  uaaAdmin,
		Scopes: userTokenInfo.Scope,
	}

	return uaaEntry, nil
}

func (p *proxy.PortalProxy) getLocalUser(userGUID string) (*users.ConnectedUser, error) {
	localUsersRepo, err := localusers.NewPgsqlLocalUsersRepository(p.DatabaseConnectionPool)
	if err != nil {
		log.Errorf("Database error getting repo for Local users: %v", err)
		return nil, err
	}

	user, err := localUsersRepo.FindUser(userGUID)
	if err != nil {
		return nil, err
	}

	var scopes []string
	uaaAdmin := (user.Scope == p.Config.ConsoleConfig.ConsoleAdminScope)
	uaaEntry := &users.ConnectedUser{
		GUID:   userGUID,
		Name:   user.Username,
		Admin:  uaaAdmin,
		Scopes: scopes,
	}

	return uaaEntry, nil
}

func (p *proxy.PortalProxy) GetCNSIUser(cnsiGUID string, userGUID string) (*structs.ConnectedUser, bool) {
	user, _, ok := p.auth.GetCNSIUserAndToken(cnsiGUID, userGUID)
	return user, ok
}

func (a *Auth) GetCNSIUserAndToken(cnsiGUID string, userGUID string) (*structs.ConnectedUser, *TokenRecord, bool) {
	log.Debug("GetCNSIUserAndToken")

	// get the uaa token record
	cfTokenRecord, ok := p.GetCNSITokenRecord(cnsiGUID, userGUID)
	if !ok {
		msg := "Unable to retrieve CNSI token record."
		log.Debug(msg)
		return nil, nil, false
	}

	cnsiUser, ok := a.GetCNSIUserFromToken(cnsiGUID, &cfTokenRecord)

	// If this is a system shared endpoint, then remove some metadata that should not be send back to other users
	santizeInfoForSystemSharedTokenUser(cnsiUser, cfTokenRecord.SystemShared)

	return cnsiUser, &cfTokenRecord, ok
}

func (a *Auth) GetCNSIUserFromToken(cnsiGUID string, cfTokenRecord *TokenRecord) (*structs.ConnectedUser, bool) {
	log.Debug("GetCNSIUserFromToken")

	// Custom handler for the Auth type available?
	authProvider := a.GetAuthProvider(cfTokenRecord.AuthType)
	if authProvider.UserInfo != nil {
		return authProvider.UserInfo(cnsiGUID, cfTokenRecord)
	}

	// Default
	return a.GetCNSIUserFromOAuthToken(cnsiGUID, cfTokenRecord)
}

func (p *proxy.PortalProxy) GetCNSIUserFromBasicToken(cnsiGUID string, cfTokenRecord *TokenRecord) (*structs.ConnectedUser, bool) {
	return &structs.ConnectedUser{
		GUID: cfTokenRecord.RefreshToken,
		Name: cfTokenRecord.RefreshToken,
	}, true
}

func (p *proxy.PortalProxy) GetCNSIUserFromOAuthToken(cnsiGUID string, cfTokenRecord *TokenRecord) (*structs.ConnectedUser, bool) {
	var cnsiUser *structs.ConnectedUser
	var scope = []string{}

	// get the scope out of the JWT token data
	userTokenInfo, err := p.GetUserTokenInfo(cfTokenRecord.AuthToken)
	if err != nil {
		msg := "Unable to find scope information in the CNSI UAA Auth Token: %s"
		log.Errorf(msg, err)
		return nil, false
	}

	// add the uaa entry to the output
	cnsiUser = &structs.ConnectedUser{
		GUID:   userTokenInfo.UserGUID,
		Name:   userTokenInfo.UserName,
		Scopes: userTokenInfo.Scope,
	}
	scope = userTokenInfo.Scope

	// is the user an CF admin?
	cnsiRecord, err := p.GetCNSIRecord(cnsiGUID)
	if err != nil {
		msg := "Unable to load CNSI record: %s"
		log.Errorf(msg, err)
		return nil, false
	}
	// TODO should be an extension point
	if cnsiRecord.CNSIType == "cf" {
		cnsiAdmin := strings.Contains(strings.Join(scope, ""), p.Config.CFAdminIdentifier)
		cnsiUser.Admin = cnsiAdmin
	}

	return cnsiUser, true
}

func (a *Auth) DoAuthFlowRequest(cnsiRequest *structs.CNSIRequest, req *http.Request, authHandler AuthHandlerFunc) (*http.Response, error) {

	// get a cnsi token record and a cnsi record
	tokenRec, cnsi, err := a.getCNSIRequestRecords(cnsiRequest)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve Endpoint records: %v", err)
	}
	return authHandler(tokenRec, cnsi)
}

// Refresh the UAA Token for the user
func (a *Auth) RefreshUAAToken(userGUID string) (t TokenRecord, err error) {
	log.Debug("RefreshUAAToken")

	userToken, err := a.GetUAATokenRecord(userGUID)
	if err != nil {
		return t, fmt.Errorf("UAA Token info could not be found for user with GUID %s", userGUID)
	}

	uaaRes, err := a.getUAATokenWithRefreshToken(a.SkipSSLValidation, userToken.RefreshToken,
		a.ConsoleClient, a.ConsoleClientSecret, a.getUAAIdentityEndpoint(), "")
	if err != nil {
		return t, fmt.Errorf("UAA Token refresh request failed: %v", err)
	}

	u, err := a.GetUserTokenInfo(uaaRes.AccessToken)
	if err != nil {
		return t, fmt.Errorf("Could not get user token info from access token")
	}

	u.UserGUID = userGUID

	t, err = a.saveAuthToken(*u, uaaRes.AccessToken, uaaRes.RefreshToken)
	if err != nil {
		return t, fmt.Errorf("Couldn't save new UAA token: %v", err)
	}

	return t, nil
}
