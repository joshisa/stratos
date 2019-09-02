package authx

import (
	"database/sql"
	"net/url"
	"regexp"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/users"
)

const (
	// AuthTypeOAuth2 means OAuth2
	AuthTypeOAuth2 = "OAuth2"
	// AuthTypeOIDC means no OIDC
	AuthTypeOIDC = "OIDC"
	// AuthTypeHttpBasic means HTTP Basic auth
	AuthTypeHttpBasic = "HttpBasic"
	// AuthTypeAKS means AKS
	AuthTypeAKS = "AKS"
)

const (
	// AuthConnectTypeCreds means authenticate with username/password credentials
	AuthConnectTypeCreds = "creds"
	// AuthConnectTypeNone means no authentication
	AuthConnectTypeNone = "none"
)

//AuthEndpointType - Restrict the possible values of the configured
type AuthEndpointType string

const (
	//Remote - String representation of remote auth endpoint type
	Remote AuthEndpointType = "remote"
	//Local - String representation of remote auth endpoint type
	Local AuthEndpointType = "local"
)

//AuthEndpointTypes - Allows lookup of internal string representation by the
//value of the AUTH_ENDPOINT_TYPE env variable
var AuthEndpointTypes = map[string]AuthEndpointType{
	"remote": Remote,
	"local":  Local,
}

type Auth struct {
	AuthEndpointType       AuthEndpointType
	AuthEndpointURL        *url.URL
	UAAEndpoint            *url.URL
	SkipSSLValidation      bool
	ConsoleClientSecret    string
	ConsoleAdminScope      string
	AutoRegisterCFURL      string
	SSOLogin               bool
	EncryptionKeyInBytes   []byte
	CFAdminIdentifier      string
	DatabaseConnectionPool *sql.DB
	Plugins                map[string]interfaces.StratosPlugin
	EmptyCookieMatcher     *regexp.Regexp // Used to detect and remove empty Cookies sent by certain browsers
	AuthProviders          map[string]AuthProvider
}

// Structure for optional metadata for an OAuth2 Token
type OAuth2Metadata struct {
	ClientID     string
	ClientSecret string
	IssuerURL    string
}

type JWTUserTokenInfo struct {
	UserGUID    string   `json:"user_id"`
	UserName    string   `json:"user_name"`
	TokenExpiry int64    `json:"exp"`
	Scope       []string `json:"scope"`
}

type AuthProvider struct {
	//Handler  AuthFlowHandlerFunc
	UserInfo GetUserInfoFromToken
}

type GetUserInfoFromToken func(cnsiGUID string, cfTokenRecord *TokenRecord) (*users.ConnectedUser, bool)

type RefreshOAuthTokenFunc func(skipSSLValidation bool, cnsiGUID, userGUID, client, clientSecret, tokenEndpoint string) (t TokenRecord, err error)

//type AuthFlowHandlerFunc func(cnsiRequest *CNSIRequest, req *http.Request) (*http.Response, error)

// TokenRecord repsrents and endpoint or uaa token
type TokenRecord struct {
	TokenGUID      string
	AuthToken      string
	RefreshToken   string
	TokenExpiry    int64
	Disconnected   bool
	AuthType       string
	Metadata       string
	SystemShared   bool
	LinkedGUID     string // Indicates the GUID of the token that this token is linked to (if any)
	Certificate    string
	CertificateKey string
}

// Token record for an endpoint (includes the Endpoint GUID)
type EndpointTokenRecord struct {
	*TokenRecord
	EndpointGUID    string
	EndpointType    string
	APIEndpint      string
	LoggingEndpoint string
}
