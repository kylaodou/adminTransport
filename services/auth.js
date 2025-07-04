// services/auth.js
class AuthService {
    constructor() {
        this.baseURL = 'https://transportapi-f1ec.onrender.com/api';
    }

    async register(userData) {
        try {
            const response = await fetch(`${this.baseURL}/compagnies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nom: userData.compagnie,
                    email: userData.email,
                    localisation: userData.localisation || '',
                    telephone: userData.telephone,
                    password: userData.password
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de l\'inscription');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    async login(credentials) {
        try {
            const response = await fetch(`${this.baseURL}/compagnies/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    telephone: credentials.telephone,
                    password: credentials.password
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la connexion');
            }

            // Stocker les informations de connexion
            if (data.token) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('companyData', JSON.stringify(data.compagnie));
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('companyData');
    }

    isAuthenticated() {
        return localStorage.getItem('authToken') !== null;
    }

    getCompanyData() {
        const data = localStorage.getItem('companyData');
        return data ? JSON.parse(data) : null;
    }

    // Méthode pour faire des requêtes authentifiées
    async makeAuthenticatedRequest(url, options = {}) {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            throw new Error('Token d\'authentification manquant');
        }
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };
        
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        if (response.status === 401) {
            // Token expiré ou invalide
            this.logout();
            window.location.href = 'index.html';
            throw new Error('Session expirée');
        }
        
        return response;
    }
}

// Export du service
const authService = new AuthService();