package interfaces

import (
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/authx"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/structs"
	"github.com/labstack/echo"
)

type EndpointPlugin interface {
	Info(apiEndpoint string, skipSSLValidation bool) (structs.CNSIRecord, interface{}, error)
	GetType() string
	Register(echoContext echo.Context) error
	Connect(echoContext echo.Context, cnsiRecord structs.CNSIRecord, userId string) (*authx.TokenRecord, bool, error)
	Validate(userGUID string, cnsiRecord structs.CNSIRecord, tokenRecord authx.TokenRecord) error
	UpdateMetadata(info *structs.Info, userGUID string, echoContext echo.Context)
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
