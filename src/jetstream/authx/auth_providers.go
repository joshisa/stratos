package authx

import (
	// log "github.com/sirupsen/logrus"
)

// AddAuthProvider adds a new auth provider
func (p *portalProxy) AddAuthProvider(name string, provider AuthProvider) {
	p.AuthProviders[name] = provider
}

func (p *portalProxy) GetAuthProvider(name string) AuthProvider {
	return p.AuthProviders[name]
}
