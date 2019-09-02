package cnsis

import (
	"net/url"
)

// Repository is an application of the repository pattern for storing CNSI Records
type Repository interface {
	List(encryptionKey []byte) ([]*CNSIRecord, error)
	ListByUser(userGUID string) ([]*ConnectedEndpoint, error)
	Find(guid string, encryptionKey []byte) (CNSIRecord, error)
	FindByAPIEndpoint(endpoint string, encryptionKey []byte) (CNSIRecord, error)
	Delete(guid string) error
	Save(guid string, cnsiRecord CNSIRecord, encryptionKey []byte) error
	Update(guid string, ssoAllowed bool) error
	UpdateMetadata(guid string, metadata string) error
}

type Endpoint interface {
	Init()
}

type CNSIRecord struct {
	GUID                   string   `json:"guid"`
	Name                   string   `json:"name"`
	CNSIType               string   `json:"cnsi_type"`
	APIEndpoint            *url.URL `json:"api_endpoint"`
	AuthorizationEndpoint  string   `json:"authorization_endpoint"`
	TokenEndpoint          string   `json:"token_endpoint"`
	DopplerLoggingEndpoint string   `json:"doppler_logging_endpoint"`
	SkipSSLValidation      bool     `json:"skip_ssl_validation"`
	ClientId               string   `json:"client_id"`
	ClientSecret           string   `json:"-"`
	SSOAllowed             bool     `json:"sso_allowed"`
	SubType                string   `json:"sub_type"`
	Metadata               string   `json:"metadata"`
}

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
