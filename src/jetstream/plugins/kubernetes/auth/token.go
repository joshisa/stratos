package auth

import (
	"net/http"
	"strings"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"
)

const AuthConnectTypeKubeToken = "k8s-token"

// KubeTokenAuth uses a token (e.g. service account token)
type KubeTokenAuth struct {
	portalProxy interfaces.PortalProxy
}

// InitKubeTokenAuth
func InitKubeTokenAuth(portalProxy interfaces.PortalProxy) KubeAuthProvider {
	return &KubeTokenAuth{portalProxy}
}

func (c *KubeTokenAuth) GetName() string {
	return AuthConnectTypeKubeToken
}

func (c *KubeTokenAuth) AddAuthInfo(info *clientcmdapi.AuthInfo, tokenRec interfaces.TokenRecord) error {
	log.Debug("AddAuthInfo: KubeTokenAuth")
	// Just add the token in
	info.Token = tokenRec.AuthToken
	return nil
}

func (c *KubeTokenAuth) FetchToken(cnsiRecord interfaces.CNSIRecord, ec echo.Context) (*interfaces.TokenRecord, *interfaces.CNSIRecord, error) {
	log.Debug("FetchToken (KubeTokenAuth)")
	token := ec.FormValue("token")
	tokenRecord := NewKubeTokenAuthTokenRecord(c.portalProxy, token)
	return tokenRecord, &cnsiRecord, nil
}

func NewKubeTokenAuthTokenRecord(portalProxy interfaces.PortalProxy, token string) *interfaces.TokenRecord {
	tokenRecord := portalProxy.InitEndpointTokenRecord(getLargeExpiryTime(), token, "__NONE__", false)
	tokenRecord.AuthType = AuthConnectTypeKubeToken
	return &tokenRecord
}

func (c *KubeTokenAuth) doTokenFlowRequest(cnsiRequest *interfaces.CNSIRequest, req *http.Request) (*http.Response, error) {
	log.Debug("K8S Token auth: doTokenFlowRequest")

	authHandler := func(tokenRec interfaces.TokenRecord, cnsi interfaces.CNSIRecord) (*http.Response, error) {
		// Token auth has no token refresh or expiry - so much simpler than the OAuth flow
		req.Header.Set("Authorization", "bearer "+tokenRec.AuthToken)
		client := c.portalProxy.GetHttpClientForRequest(req, cnsi.SkipSSLValidation)
		return client.Do(req)
	}
	return c.portalProxy.DoAuthFlowRequest(cnsiRequest, req, authHandler)
}

func (c *KubeTokenAuth) RegisterJetstreamAuthType(portal interfaces.PortalProxy) {
	// Register auth type with Jetstream
	c.portalProxy.AddAuthProvider(c.GetName(), interfaces.AuthProvider{
		Handler:  c.doTokenFlowRequest,
		UserInfo: c.GetUserFromToken,
	})
}

func (c *KubeTokenAuth) GetUserFromToken(cnsiGUID string, tokenRecord *interfaces.TokenRecord) (*interfaces.ConnectedUser, bool) {
	log.Debug("GetUserFromToken (KubeTokenAuth)")

	// See if we can get token info - if we can, use it
	_, err := c.portalProxy.GetUserTokenInfo(tokenRecord.AuthToken)
	if err == nil {
		return c.portalProxy.GetCNSIUserFromOAuthToken(cnsiGUID, tokenRecord)
	}

	parts := strings.Split(tokenRecord.AuthToken, ":")
	if len(parts) != 2 {
		log.Errorf("Could not get user information from token: %s", tokenRecord.TokenGUID)
		return nil, false
	}

	return &interfaces.ConnectedUser{
		GUID:   parts[0],
		Name:   parts[0],
		Scopes: make([]string, 0),
	}, true
}
