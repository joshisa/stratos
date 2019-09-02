package interfaces

import (
	"database/sql"
	"net/http"
	"net/url"

	"github.com/gorilla/sessions"
	"github.com/govau/cf-common/env"
	"github.com/labstack/echo"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/auth"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

type PortalProxyAPI interface {
	GetHttpClient(skipSSLValidation bool) http.Client
	GetHttpClientForRequest(req *http.Request, skipSSLValidation bool) http.Client
	RegisterEndpoint(c echo.Context, fetchInfo interfaces.InfoFunc) error
	DoRegisterEndpoint(cnsiName string, apiEndpoint string, skipSSLValidation bool, clientId string, clientSecret string, ssoAllowed bool, subType string, fetchInfo InfoFunc) (CNSIRecord, error)
	GetEndpointTypeSpec(typeName string) (interfaces.EndpointPlugin, error)

	// Session
	GetSession(c echo.Context) (*sessions.Session, error)
	GetSessionValue(c echo.Context, key string) (interface{}, error)
	GetSessionInt64Value(c echo.Context, key string) (int64, error)
	GetSessionStringValue(c echo.Context, key string) (string, error)
	SaveSession(c echo.Context, session *sessions.Session) error

	RefreshOAuthToken(skipSSLValidation bool, cnsiGUID, userGUID, client, clientSecret, tokenEndpoint string) (t interfaces.TokenRecord, err error)

	// Expose internal portal proxy records to extensions
	GetCNSIRecord(guid string) (interfaces.CNSIRecord, error)
	GetCNSIRecordByEndpoint(endpoint string) (interfaces.CNSIRecord, error)
	GetCNSITokenRecord(cnsiGUID string, userGUID string) (interfaces.TokenRecord, bool)
	GetCNSITokenRecordWithDisconnected(cnsiGUID string, userGUID string) (interfaces.TokenRecord, bool)

	GetConfig() *interfaces.PortalConfig
	Env() *env.VarSet
	ListEndpointsByUser(userGUID string) ([]*interfaces.ConnectedEndpoint, error)
	ListEndpoints() ([]*interfaces.CNSIRecord, error)
	UpdateEndointMetadata(guid string, metadata string) error

	// Proxy API requests
	ProxyRequest(c echo.Context, uri *url.URL) (map[string]*interfaces.CNSIRequest, error)
	DoProxyRequest(requests []interfaces.ProxyRequestInfo) (map[string]*interfaces.CNSIRequest, error)
	DoProxySingleRequest(cnsiGUID, userGUID, method, requestUrl string, headers http.Header, body []byte) (*interfaces.CNSIRequest, error)
	SendProxiedResponse(c echo.Context, responses map[string]*interfaces.CNSIRequest) error

	// Database Connection
	GetDatabaseConnection() *sql.DB
	AddAuthProvider(name string, provider interfaces.AuthProvider)
	GetAuthProvider(name string) interfaces.AuthProvider
	DoAuthFlowRequest(cnsiRequest *interfaces.CNSIRequest, req *http.Request, authHandler interfaces.AuthHandlerFunc) (*http.Response, error)
	OAuthHandlerFunc(cnsiRequest *interfaces.CNSIRequest, req *http.Request, refreshOAuthTokenFunc interfaces.RefreshOAuthTokenFunc) interfaces.AuthHandlerFunc

	// Tokens - lower-level access
	SaveEndpointToken(cnsiGUID string, userGUID string, tokenRecord interfaces.TokenRecord) error
	DeleteEndpointToken(cnsiGUID string, userGUID string) error

	AddLoginHook(priority int, function interfaces.LoginHookFunc) error
	ExecuteLoginHooks(c echo.Context) error

	// Plugins
	GetPlugin(name string) interface{}

	// SetCanPerformMigrations updates the state that records if we can perform Database migrations
	SetCanPerformMigrations(bool)

	// CanPerformMigrations returns if we can perform Database migrations
	CanPerformMigrations() bool

	auth.Auth
}
