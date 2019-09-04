package interfaces

import (
	"github.com/govau/cf-common/env"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/proxy"
)

// StratosPlugin is the interface for a Jetstream plugin
type StratosPlugin interface {
	Init() error
	GetMiddlewarePlugin() (MiddlewarePlugin, error)
	GetEndpointPlugin() (EndpointPlugin, error)
	GetRoutePlugin() (RoutePlugin, error)
}

// JetstreamConfigInit is the function signature for the config plugin init function
type JetstreamConfigInit func(*env.VarSet, *proxy.PortalConfig)

// JetstreamConfigPlugins is the array of config plugins
var JetstreamConfigPlugins []JetstreamConfigInit

// RegisterJetstreamConfigPlugin registers a new config plugin
func RegisterJetstreamConfigPlugin(plugin JetstreamConfigInit) {
	JetstreamConfigPlugins = append(JetstreamConfigPlugins, plugin)
}

// i is the interface for a Jetstream plugin
type EndpointNotificationPlugin interface {
	OnEndpointNotification(EndpointAction, *cnsis.CNSIRecord)
}

type MiddlewarePlugin interface {
	EchoMiddleware(middleware echo.HandlerFunc) echo.HandlerFunc
	SessionEchoMiddleware(middleware echo.HandlerFunc) echo.HandlerFunc
}

type EndpointPlugin interface {
	Info(apiEndpoint string, skipSSLValidation bool) (CNSIRecord, interface{}, error)
	GetType() string
	Register(echoContext echo.Context) error
	Connect(echoContext echo.Context, cnsiRecord CNSIRecord, userId string) (*TokenRecord, bool, error)
	Validate(userGUID string, cnsiRecord CNSIRecord, tokenRecord TokenRecord) error
	UpdateMetadata(info *Info, userGUID string, echoContext echo.Context)
}

type RoutePlugin interface {
	AddSessionGroupRoutes(echoContext *echo.Group)
	AddAdminGroupRoutes(echoContext *echo.Group)
}
