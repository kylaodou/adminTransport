// services/trajets.js
class TrajetsService {
    constructor() {
        this.baseURL = 'https://transportapi-f1ec.onrender.com/api';
    }

    async registerTrajet(trajetData) {
        try {
            // Récupérer les données de la compagnie connectée
            const companyData = authService.getCompanyData();
            console.log('Données de la compagnie:', companyData);
            
            if (!companyData || !companyData.id) {
                throw new Error('Données de la compagnie non trouvées. Veuillez vous reconnecter.');
            }

            // Préparer les données
            const requestData = {
                nom: trajetData.nom,
                point_depart: trajetData.point_depart,
                point_arrivee: trajetData.point_arrivee,
                duree_estime: parseInt(trajetData.duree_estime),
                prix: parseInt(trajetData.prix),
                compagnie_id: parseInt(companyData.id)
            };

            console.log('=== DEBUG REGISTERTRAJET ===');
            console.log('URL appelée:', `${this.baseURL}/trajets`);
            console.log('Données envoyées:', requestData);

            const response = await fetch(`${this.baseURL}/trajets`, {
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
            console.error('=== ERREUR REGISTERTRAJET ===');
            console.error('Message:', error.message);
            throw error;
        }
    }

    async getTrajets() {
        try {
            console.log('=== DEBUG GETTRAJETS ===');
            console.log('URL appelée:', `${this.baseURL}/trajets`);
            
            const response = await authService.makeAuthenticatedRequest(`${this.baseURL}/trajets`);
            
            console.log('Statut réponse getTrajets:', response.status);
            const contentType = response.headers.get('content-type');
            console.log('Type de contenu getTrajets:', contentType);
            
            const responseText = await response.text();
            console.log('Réponse brute getTrajets:', responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Données trajets parsées:', data);
            } catch (parseError) {
                console.error('Erreur parsing getTrajets:', parseError);
                throw new Error('Réponse serveur invalide');
            }
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la récupération des trajets');
            }

            return data;
        } catch (error) {
            console.error('Erreur dans getTrajets:', error);
            throw error;
        }
    }

    async updateTrajet(trajetId, trajetData) {
        try {
            // Récupérer les données de la compagnie connectée
            const companyData = authService.getCompanyData();
            if (!companyData || !companyData.id) {
                throw new Error('Données de la compagnie non trouvées. Veuillez vous reconnecter.');
            }

            // Préparer les données
            const requestData = {
                nom: trajetData.nom,
                point_depart: trajetData.point_depart,
                point_arrivee: trajetData.point_arrivee,
                duree_estime: parseInt(trajetData.duree_estime),
                prix: parseInt(trajetData.prix),
                compagnie_id: parseInt(companyData.id)
            };

            console.log('=== DEBUG UPDATETRAJET ===');
            console.log('URL appelée:', `${this.baseURL}/trajets/${trajetId}`);
            console.log('Données envoyées:', requestData);

            const response = await fetch(`${this.baseURL}/trajets/${trajetId}`, {
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
            console.error('=== ERREUR UPDATETRAJET ===');
            console.error('Message:', error.message);
            throw error;
        }
    }

    async deleteTrajet(trajetId) {
        try {
            const response = await authService.makeAuthenticatedRequest(`${this.baseURL}/trajets/${trajetId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erreur lors de la suppression du trajet');
            }

            return { success: true };
        } catch (error) {
            throw error;
        }
    }

    async getTrajetById(trajetId) {
        try {
            const response = await authService.makeAuthenticatedRequest(`${this.baseURL}/trajets/${trajetId}`);
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la récupération du trajet');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }
}

// Export du service
const trajetsService = new TrajetsService();