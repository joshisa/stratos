package proxy

import (
	"database/sql"
	"net/url"
	"regexp"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/authx"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/plugins"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/structs"
	"github.com/gorilla/sessions"
	"github.com/govau/cf-common/env"
)

type PortalProxy struct {
	Config                 PortalConfig
	DatabaseConnectionPool *sql.DB
	SessionStore           sessions.SessionStorer
	SessionStoreOptions    *sessions.Options
	Plugins                map[string]plugins.StratosPlugin
	PluginsStatus          map[string]bool
	Diagnostics            *structs.Diagnostics
	SessionCookieName      string
	EmptyCookieMatcher     *regexp.Regexp // Used to detect and remove empty Cookies sent by certain browsers
	AuthProviders          map[string]authx.AuthProvider
	env                    *env.VarSet
}

// ConsoleConfig is essential configuration settings
type ConsoleConfig struct {
	UAAEndpoint           *url.URL `json:"uaa_endpoint" configName:"UAA_ENDPOINT"`
	AuthorizationEndpoint *url.URL `json:"authorization_endpoint" configName:"AUTHORIZATION_ENDPOINT"`
	ConsoleAdminScope     string   `json:"console_admin_scope" configName:"CONSOLE_ADMIN_SCOPE"`
	ConsoleClient         string   `json:"console_client" configName:"CONSOLE_CLIENT"`
	ConsoleClientSecret   string   `json:"console_client_secret" configName:"CONSOLE_CLIENT_SECRET"`
	LocalUser             string   `json:"local_user"`
	LocalUserPassword     string   `json:"local_user_password"`
	LocalUserScope        string   `json:"local_user_scope"`
	AuthEndpointType      string   `json:"auth_endpoint_type" configName:"AUTH_ENDPOINT_TYPE"`
	SkipSSLValidation     bool     `json:"skip_ssl_validation" configName:"SKIP_SSL_VALIDATION"`
	UseSSO                bool     `json:"use_sso" configName:"SSO_LOGIN"`
}

type PortalConfig struct {
	HTTPClientTimeoutInSecs         int64    `configName:"HTTP_CLIENT_TIMEOUT_IN_SECS"`
	HTTPClientTimeoutMutatingInSecs int64    `configName:"HTTP_CLIENT_TIMEOUT_MUTATING_IN_SECS"`
	HTTPConnectionTimeoutInSecs     int64    `configName:"HTTP_CONNECTION_TIMEOUT_IN_SECS"`
	TLSAddress                      string   `configName:"CONSOLE_PROXY_TLS_ADDRESS"`
	TLSCert                         string   `configName:"CONSOLE_PROXY_CERT"`
	TLSCertKey                      string   `configName:"CONSOLE_PROXY_CERT_KEY"`
	TLSCertPath                     string   `configName:"CONSOLE_PROXY_CERT_PATH"`
	TLSCertKeyPath                  string   `configName:"CONSOLE_PROXY_CERT_KEY_PATH"`
	CFClient                        string   `configName:"CF_CLIENT"`
	CFClientSecret                  string   `configName:"CF_CLIENT_SECRET"`
	AllowedOrigins                  []string `configName:"ALLOWED_ORIGINS"`
	SessionStoreSecret              string   `configName:"SESSION_STORE_SECRET"`
	EncryptionKeyVolume             string   `configName:"ENCRYPTION_KEY_VOLUME"`
	EncryptionKeyFilename           string   `configName:"ENCRYPTION_KEY_FILENAME"`
	EncryptionKey                   string   `configName:"ENCRYPTION_KEY"`
	AutoRegisterCFUrl               string   `configName:"AUTO_REG_CF_URL"`
	AutoRegisterCFName              string   `configName:"AUTO_REG_CF_NAME"`
	SSOLogin                        bool     `configName:"SSO_LOGIN"`
	SSOOptions                      string   `configName:"SSO_OPTIONS"`
	AuthEndpointType                string   `configName:"AUTH_ENDPOINT_TYPE"`
	CookieDomain                    string   `configName:"COOKIE_DOMAIN"`
	LogLevel                        string   `configName:"LOG_LEVEL"`
	CFAdminIdentifier               string
	CloudFoundryInfo                *structs.CFInfo
	HTTPS                           bool
	EncryptionKeyInBytes            []byte
	ConsoleVersion                  string
	IsCloudFoundry                  bool
	LoginHooks                      []structs.LoginHook
	SessionStore                    sessions.SessionStorer
	ConsoleConfig                   *ConsoleConfig
	PluginConfig                    map[string]string
	DatabaseProviderName            string
	EnableTechPreview               bool `configName:"ENABLE_TECH_PREVIEW"`
}

// HttpSessionStore - Interface for a store that can manage HTTP Sessions
type HttpSessionStore interface {
	sessions.Store
	Close()
	StopCleanup(quit chan<- struct{}, done <-chan struct{})
	Cleanup(interval time.Duration) (chan<- struct{}, <-chan struct{})
}

// canPerformMigrations indicates if we can safely perform migrations
// This depends on the deployment mechanism and the database config
// e.g. if running in Cloud Foundry with a shared DB, then only the 0-index application instance
// can perform migrations
var canPerformMigrations = true

// SetCanPerformMigrations updates the state that records if we can perform Database migrations
func (p *PortalProxy) SetCanPerformMigrations(value bool) {
	canPerformMigrations = canPerformMigrations && value
}

// CanPerformMigrations returns if we can perform Database migrations
func (p *PortalProxy) CanPerformMigrations() bool {
	return canPerformMigrations
}
