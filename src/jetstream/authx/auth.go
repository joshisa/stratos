package authx

import (
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/structs"
	"github.com/labstack/echo"
)

type AuthService interface {
	

	// UAA Token
	GetUAATokenRecord(userGUID string) (TokenRecord, error)
	RefreshUAAToken(userGUID string) (TokenRecord, error)

	GetUsername(userid string) (string, error)
	RefreshUAALogin(username, password string, store bool) error
	GetUserTokenInfo(tok string) (u *JWTUserTokenInfo, err error)
	GetUAAUser(userGUID string) (*structs.ConnectedUser, error)

	// Auth
	ConnectOAuth2(c echo.Context, cnsiRecord structs.CNSIRecord) (*TokenRecord, error)
	InitEndpointTokenRecord(expiry int64, authTok string, refreshTok string, disconnect bool) TokenRecord

	DoLoginToCNSI(c echo.Context, cnsiGUID string, systemSharedToken bool) (*structs.LoginRes, error)
	DoLoginToCNSIwithConsoleUAAtoken(c echo.Context, theCNSIrecord structs.CNSIRecord) error

	AddAuthProvider(name string, provider AuthProvider)
	GetAuthProvider(name string) AuthProvider
	DoAuthFlowRequest(cnsiRequest *structs.CNSIRequest, req *http.Request, authHandler AuthHandlerFunc) (*http.Response, error)
	OAuthHandlerFunc(cnsiRequest *structs.CNSIRequest, req *http.Request, refreshOAuthTokenFunc RefreshOAuthTokenFunc) AuthHandlerFunc

	GetCNSITokenRecord(cnsiGUID string, userGUID string) (TokenRecord, bool)
	GetCNSITokenRecordWithDisconnected(cnsiGUID string, userGUID string) (TokenRecord, bool)
}
