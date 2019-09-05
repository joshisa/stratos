package authx

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/structs"
)

func (a *Auth) OAuthHandlerFunc(cnsiRequest *structs.CNSIRequest, req *http.Request, refreshOAuthTokenFunc RefreshOAuthTokenFunc) AuthHandlerFunc {

	return func(tokenRec TokenRecord, cnsi structs.CNSIRecord) (*http.Response, error) {

		got401 := false

		for {
			expTime := time.Unix(tokenRec.TokenExpiry, 0)
			if got401 || expTime.Before(time.Now()) {
				refreshedTokenRec, err := refreshOAuthTokenFunc(cnsi.SkipSSLValidation, cnsiRequest.GUID, cnsiRequest.UserGUID, cnsi.ClientId, cnsi.ClientSecret, cnsi.TokenEndpoint)
				if err != nil {
					log.Info(err)
					return nil, fmt.Errorf("Couldn't refresh token for CNSI with GUID %s", cnsiRequest.GUID)
				}
				tokenRec = refreshedTokenRec
			}
			req.Header.Set("Authorization", "bearer "+tokenRec.AuthToken)

			var client http.Client
			client = p.GetHttpClientForRequest(req, cnsi.SkipSSLValidation)
			res, err := client.Do(req)
			if err != nil {
				return nil, fmt.Errorf("Request failed: %v", err)
			}

			if res.StatusCode != 401 {
				return res, nil
			}

			if got401 {
				return res, errors.New("Failed to authorize")
			}
			got401 = true
		}
	}
}

func (a *Auth) doOauthFlowRequest(cnsiRequest *structs.CNSIRequest, req *http.Request) (*http.Response, error) {
	log.Debug("doOauthFlowRequest")
	authHandler := a.OAuthHandlerFunc(cnsiRequest, req, p.RefreshOAuthToken)
	return a.DoAuthFlowRequest(cnsiRequest, req, authHandler)

}

func (p *portalProxy) getCNSIRequestRecords(r *structs.CNSIRequest) (t TokenRecord, c structs.CNSIRecord, err error) {
	log.Debug("getCNSIRequestRecords")
	// look up token
	t, ok := p.auth.GetCNSITokenRecord(r.GUID, r.UserGUID)
	if !ok {
		return t, c, fmt.Errorf("Could not find token for csni:user %s:%s", r.GUID, r.UserGUID)
	}

	c, err = p.GetCNSIRecord(r.GUID)
	if err != nil {
		return t, c, fmt.Errorf("Info could not be found for CNSI with GUID %s: %s", r.GUID, err)
	}

	return t, c, nil
}

func (p *Auth) RefreshOAuthToken(skipSSLValidation bool, cnsiGUID, userGUID, client, clientSecret, tokenEndpoint string) (t TokenRecord, err error) {
	log.Debug("refreshToken")
	userToken, ok := a.GetCNSITokenRecordWithDisconnected(cnsiGUID, userGUID)
	if !ok {
		return t, fmt.Errorf("Info could not be found for user with GUID %s", userGUID)
	}

	tokenEndpointWithPath := fmt.Sprintf("%s/oauth/token", tokenEndpoint)

	uaaRes, err := a.getUAATokenWithRefreshToken(skipSSLValidation, userToken.RefreshToken, client, clientSecret, tokenEndpointWithPath, "")
	if err != nil {
		return t, fmt.Errorf("Token refresh request failed: %v", err)
	}

	u, err := a.GetUserTokenInfo(uaaRes.AccessToken)
	if err != nil {
		return t, fmt.Errorf("Could not get user token info from access token")
	}

	u.UserGUID = userGUID

	tokenRecord := a.InitEndpointTokenRecord(u.TokenExpiry, uaaRes.AccessToken, uaaRes.RefreshToken, userToken.Disconnected)
	tokenRecord.TokenGUID = userToken.TokenGUID
	err = a.updateTokenAuth(userGUID, tokenRecord)
	if err != nil {
		return t, fmt.Errorf("Couldn't update token: %v", err)
	}

	return tokenRecord, nil
}
