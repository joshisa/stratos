package interfaces

import (
	"net/http"
	"net/url"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/authx"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/users"
	"github.com/gorilla/sessions"
	"github.com/labstack/echo"
)

type AuthHandlerFunc func(tokenRec authx.TokenRecord, cnsi CNSIRecord) (*http.Response, error)

type GetUserInfoFromToken func(cnsiGUID string, cfTokenRecord *authx.TokenRecord) (*users.ConnectedUser, bool)

type AuthFlowHandlerFunc func(cnsiRequest *CNSIRequest, req *http.Request) (*http.Response, error)

type V2Info struct {
	AuthorizationEndpoint    string `json:"authorization_endpoint"`
	TokenEndpoint            string `json:"token_endpoint"`
	DopplerLoggingEndpoint   string `json:"doppler_logging_endpoint"`
	AppSSHEndpoint           string `json:"app_ssh_endpoint"`
	AppSSHHostKeyFingerprint string `json:"app_ssh_host_key_fingerprint"`
	AppSSHOauthCLient        string `json:"app_ssh_oauth_client"`
}

type InfoFunc func(apiEndpoint string, skipSSLValidation bool) (CNSIRecord, interface{}, error)

//TODO this could be moved back to cnsis subpackage, and extensions could import it?


// ConnectedEndpoint
type ConnectedEndpoint struct {
	GUID                   string   `json:"guid"`
	Name                   string   `json:"name"`
	CNSIType               string   `json:"cnsi_type"`
	APIEndpoint            *url.URL `json:"api_endpoint"`
	Account                string   `json:"account"`
	TokenExpiry            int64    `json:"token_expiry"`
	DopplerLoggingEndpoint string   `json:"-"`
	AuthorizationEndpoint  string   `json:"-"`
	SkipSSLValidation      bool     `json:"skip_ssl_validation"`
	TokenMetadata          string   `json:"-"`
	SubType                string   `json:"sub_type"`
	EndpointMetadata       string   `json:"metadata"`
}

type CFInfo struct {
	EndpointGUID string
	SpaceGUID    string
	AppGUID      string
}

type VCapApplicationData struct {
	API           string `json:"cf_api"`
	ApplicationID string `json:"application_id"`
	SpaceID       string `json:"space_id"`
}

type LoginRes struct {
	Account     string               `json:"account"`
	TokenExpiry int64                `json:"token_expiry"`
	APIEndpoint *url.URL             `json:"api_endpoint"`
	Admin       bool                 `json:"admin"`
	User        *users.ConnectedUser `json:"user"`
}

type LocalLoginRes struct {
	User *users.ConnectedUser `json:"user"`
}

type LoginHookFunc func(c echo.Context) error
type LoginHook struct {
	Priority int
	Function LoginHookFunc
}

type ProxyRequestInfo struct {
	EndpointGUID string
	URI          *url.URL
	UserGUID     string
	ResultGUID   string
	Headers      http.Header
	Body         []byte
	Method       string
}

type SessionStorer interface {
	Get(r *http.Request, name string) (*sessions.Session, error)
	Save(r *http.Request, w http.ResponseWriter, session *sessions.Session) error
}

// Diagnostics - Diagnostic metadata
type Diagnostics struct {
	DeploymentType   string                  `json:"deploymentType"`
	GitClientVersion string                  `json:"gitClientVersion"`
	DBMigrations     []*GooseDBVersionRecord `json:"databaseMigrations"`
	DatabaseBackend  string                  `json:"databaseBackend"`
	HelmName         string                  `json:"helmName,omitempty"`
	HelmRevision     string                  `json:"helmRevision,omitempty"`
	HelmChartVersion string                  `json:"helmChartVersion,omitempty"`
	HelmLastModified string                  `json:"helmLastModified,omitempty"`
}

// GooseDBVersionRecord - the version record in the database that Goose reads/writes
type GooseDBVersionRecord struct {
	ID        int64  `json:"id"`
	VersionID int64  `json:"version_id"`
	IsApplied bool   `json:"is_applied"`
	Timestamp string `json:"timestamp"`
}

// Info - this represents user specific info
type Info struct {
	Versions      *Versions                             `json:"version"`
	User          *users.ConnectedUser                  `json:"user"`
	Endpoints     map[string]map[string]*EndpointDetail `json:"endpoints"`
	CloudFoundry  *CFInfo                               `json:"cloud-foundry,omitempty"`
	Plugins       map[string]bool                       `json:"plugins"`
	PluginConfig  map[string]string                     `json:"plugin-config,omitempty"`
	Diagnostics   *Diagnostics                          `json:"diagnostics,omitempty"`
	Configuration struct {
		TechPreview bool `json:"enableTechPreview"`
	} `json:"config"`
}

// EndpointDetail extends CNSI Record and adds the user
type EndpointDetail struct {
	*CNSIRecord
	EndpointMetadata  interface{}          `json:"endpoint_metadata,omitempty"`
	User              *users.ConnectedUser `json:"user"`
	Metadata          map[string]string    `json:"metadata,omitempty"`
	TokenMetadata     string               `json:"-"`
	SystemSharedToken bool                 `json:"system_shared_token"`
}

// Versions - response returned to caller from a getVersions action
type Versions struct {
	ProxyVersion    string `json:"proxy_version"`
	DatabaseVersion int64  `json:"database_version"`
}

// IsSetupComplete indicates if we have enough config
func (consoleConfig *ConsoleConfig) IsSetupComplete() bool {
	if consoleConfig.UAAEndpoint == nil {
		return false
	}

	return len(consoleConfig.UAAEndpoint.String()) > 0 && len(consoleConfig.ConsoleAdminScope) > 0
}

// CNSIRequest
type CNSIRequest struct {
	GUID     string `json:"-"`
	UserGUID string `json:"-"`

	Method      string      `json:"-"`
	Body        []byte      `json:"-"`
	Header      http.Header `json:"-"`
	URL         *url.URL    `json:"-"`
	StatusCode  int         `json:"statusCode"`
	Status      string      `json:"status"`
	PassThrough bool        `json:"-"`

	Response     []byte `json:"-"`
	Error        error  `json:"-"`
	ResponseGUID string `json:"-"`
}
