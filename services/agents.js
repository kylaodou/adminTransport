// services/agents.js
class AgentsService {
    constructor() {
        this.baseURL = 'https://transportapi-f1ec.onrender.com/api';
    }

    async registerAgent(agentData) {
        try {
            // Récupérer les données de la compagnie connectée
            const companyData = authService.getCompanyData();
            console.log('Données de la compagnie:', companyData);
            
            if (!companyData || !companyData.id) {
                throw new Error('Données de la compagnie non trouvées. Veuillez vous reconnecter.');
            }

            // Préparer les données exactement comme dans Postman
            const requestData = {
                nom: agentData.nom,
                prenom: agentData.prenom,
                telephone: parseInt(agentData.telephone), // Convertir en nombre
                password: agentData.password,
                compagnie_id: parseInt(companyData.id) // S'assurer que c'est un nombre
            };

            console.log('=== DEBUG REGISTERAGENT ===');
            console.log('URL appelée:', `${this.baseURL}/agents`); // Changé ici
            console.log('Données envoyées:', requestData);

            // Faire la requête SANS token comme dans Postman
            const response = await fetch(`${this.baseURL}/agents`, { // URL corrigée
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                    // PAS de token Authorization
                },
                body: JSON.stringify(requestData)
            });

            console.log('=== RÉPONSE ===');
            console.log('Status:', response.status);
            console.log('Status Text:', response.statusText);
            console.log('Headers:', Object.fromEntries(response.headers.entries()));

            // Lire la réponse comme texte d'abord
            const responseText = await response.text();
            console.log('Réponse brute:', responseText);

            // Essayer de parser en JSON
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
            console.error('=== ERREUR REGISTERAGENT ===');
            console.error('Type:', typeof error);
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
            throw error;
        }
    }

    async getAgents() {
        try {
            console.log('=== DEBUG GETAGENTS ===');
            console.log('URL appelée:', `${this.baseURL}/agents`);
            
            // Si GET /agents nécessite aussi un token, utilisez makeAuthenticatedRequest
            // Sinon, utilisez fetch simple comme pour register
            const response = await authService.makeAuthenticatedRequest(`${this.baseURL}/agents`);
            
            console.log('Statut réponse getAgents:', response.status);
            const contentType = response.headers.get('content-type');
            console.log('Type de contenu getAgents:', contentType);
            
            const responseText = await response.text();
            console.log('Réponse brute getAgents:', responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Données agents parsées:', data);
            } catch (parseError) {
                console.error('Erreur parsing getAgents:', parseError);
                throw new Error('Réponse serveur invalide');
            }
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la récupération des agents');
            }

            return data;
        } catch (error) {
            console.error('Erreur dans getAgents:', error);
            throw error;
        }
    }

    async updateAgent(agentId, agentData) {
        try {
            // Récupérer les données de la compagnie connectée
            const companyData = authService.getCompanyData();
            if (!companyData || !companyData.id) {
                throw new Error('Données de la compagnie non trouvées. Veuillez vous reconnecter.');
            }

            // Préparer les données exactement comme dans Postman
            const requestData = {
                nom: agentData.nom,
                prenom: agentData.prenom,
                telephone: parseInt(agentData.telephone),
                compagnie_id: parseInt(companyData.id)
            };

            // Ajouter le mot de passe seulement s'il est fourni
            if (agentData.password && agentData.password.trim()) {
                requestData.password = agentData.password;
            }

            console.log('=== DEBUG UPDATEAGENT ===');
            console.log('URL appelée:', `${this.baseURL}/agents/${agentId}`);
            console.log('Données envoyées:', requestData);

            // Faire la requête SANS token comme pour register
            const response = await fetch(`${this.baseURL}/agents/${agentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                    // PAS de token Authorization
                },
                body: JSON.stringify(requestData)
            });

            console.log('=== RÉPONSE UPDATE ===');
            console.log('Status:', response.status);
            console.log('Status Text:', response.statusText);

            // Lire la réponse comme texte d'abord
            const responseText = await response.text();
            console.log('Réponse brute update:', responseText);

            // Essayer de parser en JSON
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
            console.error('=== ERREUR UPDATEAGENT ===');
            console.error('Message:', error.message);
            throw error;
        }
    }

    async deleteAgent(agentId) {
        try {
            const response = await authService.makeAuthenticatedRequest(`${this.baseURL}/agents/${agentId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erreur lors de la suppression de l\'agent');
            }

            return { success: true };
        } catch (error) {
            throw error;
        }
    }

    async getAgentById(agentId) {
        try {
            const response = await authService.makeAuthenticatedRequest(`${this.baseURL}/agents/${agentId}`);
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la récupération de l\'agent');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }
}

// Export du service
const agentsService = new AgentsService();