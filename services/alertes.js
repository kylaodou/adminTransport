// services/alertes.js
class AlertesService {
    constructor() {
        this.baseURL = 'https://transportapi-f1ec.onrender.com/api';
    }

    async registerAlerte(alerteData) {
        try {
            // Récupérer les données de la compagnie connectée
            const companyData = authService.getCompanyData();
            console.log('Données de la compagnie:', companyData);
            
            if (!companyData || !companyData.id) {
                throw new Error('Données de la compagnie non trouvées. Veuillez vous reconnecter.');
            }

            // Préparer les données avec les bonnes valeurs ENUM
            const requestData = {
                bus_id: parseInt(alerteData.bus_id),
                type: alerteData.type, // panne, entretien, info
                description: alerteData.description,
                statut: alerteData.statut, // ouverte, en_cours, resolue
                date_signalement: alerteData.date_signalement || new Date().toISOString().split('T')[0]
            };

            console.log('=== DEBUG REGISTERALERTE ===');
            console.log('URL appelée:', `${this.baseURL}/alertes`);
            console.log('Données envoyées:', requestData);

            const response = await fetch(`${this.baseURL}/alertes`, {
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
            console.error('=== ERREUR REGISTERALERTE ===');
            console.error('Message:', error.message);
            throw error;
        }
    }

    async getAlertes() {
        try {
            console.log('=== DEBUG GETALERTES ===');
            console.log('URL appelée:', `${this.baseURL}/alertes`);
            
            const response = await authService.makeAuthenticatedRequest(`${this.baseURL}/alertes`);
            
            console.log('Statut réponse getAlertes:', response.status);
            const contentType = response.headers.get('content-type');
            console.log('Type de contenu getAlertes:', contentType);
            
            const responseText = await response.text();
            console.log('Réponse brute getAlertes:', responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Données alertes parsées:', data);
            } catch (parseError) {
                console.error('Erreur parsing getAlertes:', parseError);
                throw new Error('Réponse serveur invalide');
            }
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la récupération des alertes');
            }

            return data;
        } catch (error) {
            console.error('Erreur dans getAlertes:', error);
            throw error;
        }
    }

    async getAlertesByBus(busId) {
        try {
            console.log('=== DEBUG GETALERTESBYBUS ===');
            console.log('URL appelée:', `${this.baseURL}/alertes/${busId}`);
            
            const response = await authService.makeAuthenticatedRequest(`${this.baseURL}/alertes/${busId}`);
            
            console.log('Statut réponse getAlertesByBus:', response.status);
            const contentType = response.headers.get('content-type');
            console.log('Type de contenu getAlertesByBus:', contentType);
            
            const responseText = await response.text();
            console.log('Réponse brute getAlertesByBus:', responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Données alertes par bus parsées:', data);
            } catch (parseError) {
                console.error('Erreur parsing getAlertesByBus:', parseError);
                throw new Error('Réponse serveur invalide');
            }
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la récupération des alertes du bus');
            }

            return data;
        } catch (error) {
            console.error('Erreur dans getAlertesByBus:', error);
            throw error;
        }
    }

    async updateAlerte(alerteId, alerteData) {
        try {
            // Récupérer les données de la compagnie connectée
            const companyData = authService.getCompanyData();
            if (!companyData || !companyData.id) {
                throw new Error('Données de la compagnie non trouvées. Veuillez vous reconnecter.');
            }

            // Préparer les données avec les bonnes valeurs ENUM
            const requestData = {
                bus_id: parseInt(alerteData.bus_id),
                type: alerteData.type, // panne, entretien, info
                description: alerteData.description,
                statut: alerteData.statut, // ouverte, en_cours, resolue
                date_signalement: alerteData.date_signalement
            };

            console.log('=== DEBUG UPDATEALERTE ===');
            console.log('URL appelée:', `${this.baseURL}/alertes/${alerteId}`);
            console.log('Données envoyées:', requestData);

            const response = await fetch(`${this.baseURL}/alertes/${alerteId}`, {
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
            console.error('=== ERREUR UPDATEALERTE ===');
            console.error('Message:', error.message);
            throw error;
        }
    }

    async deleteAlerte(alerteId) {
        try {
            const response = await authService.makeAuthenticatedRequest(`${this.baseURL}/alertes/${alerteId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erreur lors de la suppression de l\'alerte');
            }

            return { success: true };
        } catch (error) {
            throw error;
        }
    }

    async getAlerteById(alerteId) {
        try {
            const response = await authService.makeAuthenticatedRequest(`${this.baseURL}/alertes/${alerteId}`);
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la récupération de l\'alerte');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    // Méthodes utilitaires mises à jour pour les nouvelles valeurs ENUM
    getStatutBadgeClass(statut) {
        switch(statut) {
            case 'ouverte':
                return 'badge-danger';
            case 'en_cours':
                return 'badge-warning';
            case 'resolue':
                return 'badge-success';
            default:
                return 'badge-secondary';
        }
    }

    getStatutIcon(statut) {
        switch(statut) {
            case 'ouverte':
                return 'fas fa-exclamation-circle';
            case 'en_cours':
                return 'fas fa-spinner';
            case 'resolue':
                return 'fas fa-check-circle';
            default:
                return 'fas fa-bell';
        }
    }

    getTypeIcon(type) {
        switch(type) {
            case 'panne':
                return 'fas fa-times-circle';
            case 'entretien':
                return 'fas fa-tools';
            case 'info':
                return 'fas fa-info-circle';
            default:
                return 'fas fa-exclamation';
        }
    }

    getPriorityLevel(type) {
        switch(type) {
            case 'panne':
                return 'urgent';
            case 'entretien':
                return 'moyen';
            case 'info':
                return 'faible';
            default:
                return 'moyen';
        }
    }

    getStatutLabel(statut) {
        switch(statut) {
            case 'ouverte':
                return 'Ouverte';
            case 'en_cours':
                return 'En cours';
            case 'resolue':
                return 'Résolue';
            default:
                return statut;
        }
    }

    getTypeLabel(type) {
        switch(type) {
            case 'panne':
                return 'Panne';
            case 'entretien':
                return 'Entretien';
            case 'info':
                return 'Information';
            default:
                return type;
        }
    }
}

// Export du service
const alertesService = new AlertesService();