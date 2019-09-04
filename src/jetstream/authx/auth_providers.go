package authx

import (
	// log "github.com/sirupsen/logrus"
)

// AddAuthProvider adds a new auth provider
func (a *Auth) AddAuthProvider(name string, provider AuthProvider) {
	a.AuthProviders[name] = provider
}

func (a *Auth) GetAuthProvider(name string) AuthProvider {
	return a.AuthProviders[name]
}
