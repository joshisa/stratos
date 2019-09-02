package authx

import (
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/cnsis"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/users"
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
	ConnectOAuth2(c echo.Context, cnsiRecord cnsis.CNSIRecord) (*TokenRecord, error)
	InitEndpointTokenRecord(expiry int64, authTok string, refreshTok string, disconnect bool) TokenRecord

	DoLoginToCNSI(c echo.Context, cnsiGUID string, systemSharedToken bool) (*LoginRes, error)
	DoLoginToCNSIwithConsoleUAAtoken(c echo.Context, theCNSIrecord cnsis.CNSIRecord) error
}
