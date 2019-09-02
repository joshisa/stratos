package interfaces

import (
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/authx"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/cnsis"
	"github.com/labstack/echo"
)

type EndpointPlugin interface {
	Info(apiEndpoint string, skipSSLValidation bool) (cnsis.CNSIRecord, interface{}, error)
	GetType() string
	Register(echoContext echo.Context) error
	Connect(echoContext echo.Context, cnsiRecord cnsis.CNSIRecord, userId string) (*authx.TokenRecord, bool, error)
	Validate(userGUID string, cnsiRecord cnsis.CNSIRecord, tokenRecord authx.TokenRecord) error
	UpdateMetadata(info *Info, userGUID string, echoContext echo.Context)
}

type RoutePlugin interface {
	AddSessionGroupRoutes(echoContext *echo.Group)
	AddAdminGroupRoutes(echoContext *echo.Group)
}

type EndpointAction int

const (
	EndpointRegisterAction EndpointAction = iota
	EndpointUnregisterAction
)
