package authx

import (
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/users"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/structs"
	"github.com/labstack/echo"
)

type AuthService interface {
	GetCNSIUser(cnsiGUID string, userGUID string) (*users.ConnectedUser, bool)

	// UAA Token
	GetUAATokenRecord(userGUID string) (TokenRecord, error)
	RefreshUAAToken(userGUID string) (TokenRecord, error)

	GetUsername(userid string) (string, error)
	RefreshUAALogin(username, password string, store bool) error
	GetUserTokenInfo(tok string) (u *JWTUserTokenInfo, err error)
	GetUAAUser(userGUID string) (*users.ConnectedUser, error)

	// Auth
	ConnectOAuth2(c echo.Context, cnsiRecord structs.CNSIRecord) (*TokenRecord, error)
	InitEndpointTokenRecord(expiry int64, authTok string, refreshTok string, disconnect bool) TokenRecord

	DoLoginToCNSI(c echo.Context, cnsiGUID string, systemSharedToken bool) (*structs.LoginRes, error)
	DoLoginToCNSIwithConsoleUAAtoken(c echo.Context, theCNSIrecord structs.CNSIRecord) error
}
