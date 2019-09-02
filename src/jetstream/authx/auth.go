package auth

import "github.com/labstack/echo"

type Auth interface {
	GetCNSIUser(cnsiGUID string, userGUID string) (*ConnectedUser, bool)

	// UAA Token
	GetUAATokenRecord(userGUID string) (TokenRecord, error)
	RefreshUAAToken(userGUID string) (TokenRecord, error)

	GetUsername(userid string) (string, error)
	RefreshUAALogin(username, password string, store bool) error
	GetUserTokenInfo(tok string) (u *JWTUserTokenInfo, err error)
	GetUAAUser(userGUID string) (*ConnectedUser, error)

	// Auth
	ConnectOAuth2(c echo.Context, cnsiRecord CNSIRecord) (*TokenRecord, error)
	InitEndpointTokenRecord(expiry int64, authTok string, refreshTok string, disconnect bool) TokenRecord

	DoLoginToCNSI(c echo.Context, cnsiGUID string, systemSharedToken bool) (*LoginRes, error)
	DoLoginToCNSIwithConsoleUAAtoken(c echo.Context, theCNSIrecord CNSIRecord) error
}
