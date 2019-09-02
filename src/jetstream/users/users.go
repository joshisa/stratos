package users

// ConnectedUser - details about the user connected to a specific service or UAA
type ConnectedUser struct {
	GUID   string   `json:"guid"`
	Name   string   `json:"name"`
	Admin  bool     `json:"admin"`
	Scopes []string `json:"scopes"`
}
