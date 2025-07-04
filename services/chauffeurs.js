// services/chauffeurs.js
class ChauffeursService {
    constructor() {
        this.baseURL = 'https://transportapi-f1ec.onrender.com/api';
    }

    async registerChauffeur(chauffeurData) {
        try {
            // Récupérer les données de la compagnie connectée
            const companyData = authService.getCompanyData();
            console.log('Données de la compagnie:', companyData);
            
            if (!companyData || !companyData.id) {
                throw new Error('Données de la compagnie non trouvées. Veuillez vous reconnecter.');
            }

            // Préparer les données
            const requestData = {
                nom: chauffeurData.nom,
                prenom: chauffeurData.prenom,
                telephone: chauffeurData.telephone,
                compagnie_id: parseInt(companyData.id)
            };

            console.log('=== DEBUG REGISTERCHAUFFEUR ===');
            console.log('URL appelée:', `${this.baseURL}/chauffeurs`);
            console.log('Données envoyées:', requestData);

            const response = await fetch(`${this.baseURL}/chauffeurs`, {
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
            console.error('=== ERREUR REGISTERCHAUFFEUR ===');
            console.error('Message:', error.message);
            throw error;
        }
    }

    async getChauffeurs() {
        try {
            console.log('=== DEBUG GETCHAUFFEURS ===');
            console.log('URL appelée:', `${this.baseURL}/chauffeurs`);
            
            const response = await authService.makeAuthenticatedRequest(`${this.baseURL}/chauffeurs`);
            
            console.log('Statut réponse getChauffeurs:', response.status);
            const contentType = response.headers.get('content-type');
            console.log('Type de contenu getChauffeurs:', contentType);
            
            const responseText = await response.text();
            console.log('Réponse brute getChauffeurs:', responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Données chauffeurs parsées:', data);
            } catch (parseError) {
                console.error('Erreur parsing getChauffeurs:', parseError);
                throw new Error('Réponse serveur invalide');
            }
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la récupération des chauffeurs');
            }

            return data;
        } catch (error) {
            console.error('Erreur dans getChauffeurs:', error);
            throw error;
        }
    }

    async updateChauffeur(chauffeurId, chauffeurData) {
        try {
            // Récupérer les données de la compagnie connectée
            const companyData = authService.getCompanyData();
            if (!companyData || !companyData.id) {
                throw new Error('Données de la compagnie non trouvées. Veuillez vous reconnecter.');
            }

            // Préparer les données
            const requestData = {
                nom: chauffeurData.nom,
                prenom: chauffeurData.prenom,
                telephone: chauffeurData.telephone,
                compagnie_id: parseInt(companyData.id)
            };

            console.log('=== DEBUG UPDATECHAUFFEUR ===');
            console.log('URL appelée:', `${this.baseURL}/chauffeurs/${chauffeurId}`);
            console.log('Données envoyées:', requestData);

            const response = await fetch(`${this.baseURL}/chauffeurs/${chauffeurId}`, {
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
            console.error('=== ERREUR UPDATECHAUFFEUR ===');
            console.error('Message:', error.message);
            throw error;
        }
    }

    async deleteChauffeur(chauffeurId) {
        try {
            const response = await authService.makeAuthenticatedRequest(`${this.baseURL}/chauffeurs/${chauffeurId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erreur lors de la suppression du chauffeur');
            }

            return { success: true };
        } catch (error) {
            throw error;
        }
    }

    async getChauffeurById(chauffeurId) {
        try {
            const response = await authService.makeAuthenticatedRequest(`${this.baseURL}/chauffeurs/${chauffeurId}`);
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la récupération du chauffeur');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }
}

// Export du service
const chauffeursService = new ChauffeursService();