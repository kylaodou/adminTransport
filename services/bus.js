// services/bus.js
class BusService {
    constructor() {
        this.baseURL = 'https://transportapi-f1ec.onrender.com/api';
    }

    async registerBus(busData) {
        try {
            // Récupérer les données de la compagnie connectée
            const companyData = authService.getCompanyData();
            console.log('Données de la compagnie:', companyData);
            
            if (!companyData || !companyData.id) {
                throw new Error('Données de la compagnie non trouvées. Veuillez vous reconnecter.');
            }

            // Préparer les données
            const requestData = {
                matricule: busData.matricule,
                capacite: parseInt(busData.capacite),
                description: busData.description,
                service: busData.service,
                compagnie_id: parseInt(companyData.id)
            };

            console.log('=== DEBUG REGISTERBUS ===');
            console.log('URL appelée:', `${this.baseURL}/buses`);
            console.log('Données envoyées:', requestData);

            const response = await fetch(`${this.baseURL}/buses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            console.log('=== RÉPONSE ===');
            console.log('Status:', response.status);
            console.log('Status Text:', response.statusText);

            const responseText = await response.text();
            console.log('Réponse brute:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Réponse parsée:', data);
            } catch (parseError) {
                console.error('Impossible de parser JSON:', parseError);
                console.error('Contenu reçu:', responseText);
                throw new Error(`Erreur serveur: ${response.status} - ${responseText}`);
            }
            
            if (!response.ok) {
                console.error('Erreur API:', data);
                throw new Error(data.error || data.message || `Erreur ${response.status}: ${JSON.stringify(data)}`);
            }

            return data;
        } catch (error) {
            console.error('=== ERREUR REGISTERBUS ===');
            console.error('Message:', error.message);
            throw error;
        }
    }

    async getBus() {
        try {
            console.log('=== DEBUG GETBUS ===');
            console.log('URL appelée:', `${this.baseURL}/buses`);
            
            const response = await authService.makeAuthenticatedRequest(`${this.baseURL}/buses`);
            
            console.log('Statut réponse getBus:', response.status);
            const contentType = response.headers.get('content-type');
            console.log('Type de contenu getBus:', contentType);
            
            const responseText = await response.text();
            console.log('Réponse brute getBus:', responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Données bus parsées:', data);
            } catch (parseError) {
                console.error('Erreur parsing getBus:', parseError);
                throw new Error('Réponse serveur invalide');
            }
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la récupération des bus');
            }

            return data;
        } catch (error) {
            console.error('Erreur dans getBus:', error);
            throw error;
        }
    }

    async updateBus(busId, busData) {
        try {
            // Récupérer les données de la compagnie connectée
            const companyData = authService.getCompanyData();
            if (!companyData || !companyData.id) {
                throw new Error('Données de la compagnie non trouvées. Veuillez vous reconnecter.');
            }

            // Préparer les données
            const requestData = {
                matricule: busData.matricule,
                capacite: parseInt(busData.capacite),
                description: busData.description,
                service: busData.service,
                compagnie_id: parseInt(companyData.id)
            };

            console.log('=== DEBUG UPDATEBUS ===');
            console.log('URL appelée:', `${this.baseURL}/buses/${busId}`);
            console.log('Données envoyées:', requestData);

            const response = await fetch(`${this.baseURL}/buses/${busId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            console.log('=== RÉPONSE UPDATE ===');
            console.log('Status:', response.status);
            console.log('Status Text:', response.statusText);

            const responseText = await response.text();
            console.log('Réponse brute update:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Réponse parsée update:', data);
            } catch (parseError) {
                console.error('Impossible de parser JSON update:', parseError);
                console.error('Contenu reçu:', responseText);
                throw new Error(`Erreur serveur: ${response.status} - ${responseText}`);
            }
            
            if (!response.ok) {
                console.error('Erreur API update:', data);
                throw new Error(data.error || data.message || `Erreur ${response.status}: ${JSON.stringify(data)}`);
            }

            return data;
        } catch (error) {
            console.error('=== ERREUR UPDATEBUS ===');
            console.error('Message:', error.message);
            throw error;
        }
    }

    async deleteBus(busId) {
        try {
            const response = await authService.makeAuthenticatedRequest(`${this.baseURL}/buses/${busId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erreur lors de la suppression du bus');
            }

            return { success: true };
        } catch (error) {
            throw error;
        }
    }

    async getBusById(busId) {
        try {
            const response = await authService.makeAuthenticatedRequest(`${this.baseURL}/buses/${busId}`);
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la récupération du bus');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }
}

// Export du service
const busService = new BusService();