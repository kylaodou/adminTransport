// services/plannings.js
class PlanningsService {
    constructor() {
        this.baseURL = 'https://transportapi-f1ec.onrender.com/api';
    }

    async registerPlanning(planningData) {
        try {
            // Récupérer les données de la compagnie connectée
            const companyData = authService.getCompanyData();
            console.log('Données de la compagnie:', companyData);
            
            if (!companyData || !companyData.id) {
                throw new Error('Données de la compagnie non trouvées. Veuillez vous reconnecter.');
            }

            // Préparer les données
            const requestData = {
                date: planningData.date,
                heure: planningData.heure,
                valide: planningData.valide,
                chauffeur_id: parseInt(planningData.chauffeur_id),
                bus_id: parseInt(planningData.bus_id),
                trajet_id: parseInt(planningData.trajet_id),
                compagnie_id: parseInt(companyData.id)
            };

            console.log('=== DEBUG REGISTERPLANNING ===');
            console.log('URL appelée:', `${this.baseURL}/plannings`);
            console.log('Données envoyées:', requestData);

            const response = await fetch(`${this.baseURL}/plannings`, {
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
            console.error('=== ERREUR REGISTERPLANNING ===');
            console.error('Message:', error.message);
            throw error;
        }
    }

    async getPlannings() {
        try {
            console.log('=== DEBUG GETPLANNINGS ===');
            console.log('URL appelée:', `${this.baseURL}/plannings`);
            
            const response = await authService.makeAuthenticatedRequest(`${this.baseURL}/plannings`);
            
            console.log('Statut réponse getPlannings:', response.status);
            const contentType = response.headers.get('content-type');
            console.log('Type de contenu getPlannings:', contentType);
            
            const responseText = await response.text();
            console.log('Réponse brute getPlannings:', responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Données plannings parsées:', data);
            } catch (parseError) {
                console.error('Erreur parsing getPlannings:', parseError);
                throw new Error('Réponse serveur invalide');
            }
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la récupération des plannings');
            }

            return data;
        } catch (error) {
            console.error('Erreur dans getPlannings:', error);
            throw error;
        }
    }

    async updatePlanning(planningId, planningData) {
        try {
            // Récupérer les données de la compagnie connectée
            const companyData = authService.getCompanyData();
            if (!companyData || !companyData.id) {
                throw new Error('Données de la compagnie non trouvées. Veuillez vous reconnecter.');
            }

            // Préparer les données
            const requestData = {
                date: planningData.date,
                heure: planningData.heure,
                valide: planningData.valide,
                chauffeur_id: parseInt(planningData.chauffeur_id),
                bus_id: parseInt(planningData.bus_id),
                trajet_id: parseInt(planningData.trajet_id),
                compagnie_id: parseInt(companyData.id)
            };

            console.log('=== DEBUG UPDATEPLANNING ===');
            console.log('URL appelée:', `${this.baseURL}/plannings/${planningId}`);
            console.log('Données envoyées:', requestData);

            const response = await fetch(`${this.baseURL}/plannings/${planningId}`, {
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
            console.error('=== ERREUR UPDATEPLANNING ===');
            console.error('Message:', error.message);
            throw error;
        }
    }

    async deletePlanning(planningId) {
        try {
            const response = await authService.makeAuthenticatedRequest(`${this.baseURL}/plannings/${planningId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erreur lors de la suppression du planning');
            }

            return { success: true };
        } catch (error) {
            throw error;
        }
    }

    async getPlanningById(planningId) {
        try {
            const response = await authService.makeAuthenticatedRequest(`${this.baseURL}/plannings/${planningId}`);
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la récupération du planning');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }
}

// Export du service
const planningsService = new PlanningsService();