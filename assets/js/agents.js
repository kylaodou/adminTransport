// assets/js/agents.js
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier l'authentification
    if (!authService.isAuthenticated()) {
        window.location.href = '../index.html';
        return;
    }

    // Variables globales
    let allAgents = [];
    let currentAgentToDelete = null;
    let currentAgentToView = null;

    // Fonction pour afficher les messages
    function showMessage(message, type = 'success') {
        // Supprimer les messages existants
        const existingMessages = document.querySelectorAll('.success-message, .error-message');
        existingMessages.forEach(msg => msg.remove());

        // Créer le message
        const messageDiv = document.createElement('div');
        messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 12px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideInRight 0.5s ease;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        `;

        if (type === 'success') {
            messageDiv.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
            messageDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        } else {
            messageDiv.style.background = 'linear-gradient(135deg, #ff4757, #ff3838)';
            messageDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        }

        document.body.appendChild(messageDiv);

        // Supprimer automatiquement après 4 secondes
        setTimeout(() => {
            messageDiv.style.animation = 'slideOutRight 0.5s ease';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 500);
        }, 4000);
    }

    // Fonction pour afficher le loading sur un bouton
    function showButtonLoading(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
        button.disabled = true;
        
        return () => {
            button.innerHTML = originalText;
            button.disabled = false;
        };
    }

    // Initialisation
    init();

    async function init() {
        setupEventListeners();
        setupLogoutHandler();
        await loadAgents();
    }

    function setupEventListeners() {
        // Formulaire d'ajout d'agent
        const addForm = document.getElementById('addAgentForm');
        if (addForm) {
            addForm.addEventListener('submit', handleAddAgent);
        }

        // Formulaire de modification d'agent
        const editForm = document.getElementById('editAgentForm');
        if (editForm) {
            editForm.addEventListener('submit', handleEditAgent);
        }

        // Gestion des modales (clic extérieur)
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeModal(modal.id);
                }
            });
        });

        // Validation en temps réel
        // uiService.addFormValidation(addForm);
        // uiService.addFormValidation(editForm);
    }

    function setupLogoutHandler() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                    authService.logout();
                    window.location.href = '../index.html';
                }
            });
        }
    }

    async function loadAgents() {
        console.log('Chargement des agents...');
        showLoading(true);
        
        try {
            console.log('Appel API pour récupérer les agents...');
            const response = await agentsService.getAgents();
            console.log('Réponse API agents:', response);
            
            // L'API peut retourner soit un tableau directement, soit un objet avec une propriété agents
            allAgents = Array.isArray(response) ? response : (response.agents || response.data || []);
            console.log('Agents traités:', allAgents);
            
            updateStats();
            displayAgents(allAgents);
            
        } catch (error) {
            console.error('Erreur lors du chargement des agents:', error);
            
            let errorMessage = 'Erreur lors du chargement des agents: ' + error.message;
            
            if (error.message.includes('réponse invalide')) {
                errorMessage = 'Erreur de communication avec le serveur. Vérifiez que l\'API est accessible.';
            } else if (error.message.includes('Session expirée')) {
                errorMessage = 'Session expirée. Redirection vers la connexion...';
                setTimeout(() => {
                    authService.logout();
                    window.location.href = '../index.html';
                }, 2000);
            }
            
            showMessage(errorMessage, 'error');
            displayEmptyState();
        } finally {
            showLoading(false);
        }
    }

    function updateStats() {
        document.getElementById('totalAgents').textContent = allAgents.length;
        document.getElementById('activeAgents').textContent = allAgents.length; // Tous actifs pour le moment
        
        // Calculer les nouveaux agents du mois (simulation)
        const currentMonth = new Date().getMonth();
        const newThisMonth = allAgents.filter(agent => {
            if (agent.created_at) {
                const agentMonth = new Date(agent.created_at).getMonth();
                return agentMonth === currentMonth;
            }
            return false;
        }).length;
        
        document.getElementById('newAgentsMonth').textContent = newThisMonth;
    }

    function displayAgents(agents) {
        const container = document.getElementById('agentsContainer');
        
        if (agents.length === 0) {
            displayEmptyState();
            return;
        }

        const agentsGrid = document.createElement('div');
        agentsGrid.className = 'agents-grid';
        
        agents.forEach(agent => {
            const agentCard = createAgentCard(agent);
            agentsGrid.appendChild(agentCard);
        });
        
        container.innerHTML = '';
        container.appendChild(agentsGrid);
    }

    function createAgentCard(agent) {
        const card = document.createElement('div');
        card.className = 'agent-card';
        
        // Créer l'avatar avec initiales
        const initials = getInitials(agent.nom, agent.prenom);
        
        // Formater la date
        const dateCreated = agent.created_at ? 
            new Date(agent.created_at).toLocaleDateString('fr-FR') : 
            'Non spécifiée';
        
        card.innerHTML = `
            <div class="agent-avatar">${initials}</div>
            <div class="agent-name">${agent.prenom} ${agent.nom}</div>
            <div class="agent-phone">
                <i class="fas fa-phone" style="margin-right: 8px;"></i>
                ${agent.telephone}
            </div>
            <div class="agent-id">ID: #${agent.id}</div>
            <div style="margin-bottom: 12px; font-size: 12px; color: var(--dark-gray);">
                <i class="fas fa-calendar"></i> Ajouté le ${dateCreated}
            </div>
            <div class="agent-actions">
                <button class="btn btn-primary" onclick="viewAgent(${agent.id})" title="Voir les détails">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-secondary" onclick="editAgent(${agent.id})" title="Modifier">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn" style="background-color: #ff4757; color: white;" onclick="deleteAgent(${agent.id})" title="Supprimer">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return card;
    }

    function getInitials(nom, prenom) {
        const firstInitial = (prenom && prenom.length > 0) ? prenom[0].toUpperCase() : '';
        const lastInitial = (nom && nom.length > 0) ? nom[0].toUpperCase() : '';
        return firstInitial + lastInitial || 'A';
    }

    function displayEmptyState() {
        const container = document.getElementById('agentsContainer');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>Aucun agent trouvé</h3>
                <p>Commencez par ajouter votre premier agent à la compagnie.</p>
                <button class="btn btn-primary" onclick="openModal('addAgentModal')">
                    <i class="fas fa-plus"></i>
                    Ajouter un agent
                </button>
            </div>
        `;
    }

    function showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = show ? 'flex' : 'none';
        }
    }

    // Gestion des modales
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
            
            // Réinitialiser les formulaires
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
                // Supprimer les messages d'erreur
                // uiService.removeMessages();
            }
        }
    }

    // Gestion des agents
    async function handleAddAgent(e) {
        e.preventDefault();
        
        console.log('Début de l\'ajout d\'agent...');
        
        const formData = new FormData(e.target);
        const agentData = {
            nom: formData.get('nom').trim(),
            prenom: formData.get('prenom').trim(),
            telephone: formData.get('telephone').trim(),
            password: formData.get('password')
        };

        console.log('Données du formulaire:', agentData);

        // Validation côté client
        if (!validateAgentData(agentData)) {
            return;
        }

        const submitButton = e.target.querySelector('button[type="submit"]');
        const stopLoading = showButtonLoading(submitButton);

        try {
            console.log('Envoi des données à l\'API...');
            const result = await agentsService.registerAgent(agentData);
            console.log('Agent créé avec succès:', result);
            
            // Fermer le modal AVANT d'afficher le message
            closeModal('addAgentModal');
            
            // Afficher le message de succès
            showMessage('Agent ajouté avec succès !', 'success');
            
            // Recharger la liste des agents
            await loadAgents();
            
        } catch (error) {
            console.error('Erreur lors de l\'ajout:', error);
            
            let errorMessage = 'Erreur lors de l\'ajout de l\'agent.';
            
            if (error.message.includes('Téléphone invalide')) {
                errorMessage = 'Le numéro de téléphone n\'est pas valide.';
            } else if (error.message.includes('telephone')) {
                errorMessage = 'Ce numéro de téléphone est déjà utilisé.';
            } else if (error.message.includes('Données de la compagnie non trouvées')) {
                errorMessage = 'Session expirée. Veuillez vous reconnecter.';
                // Rediriger vers la connexion après 2 secondes
                setTimeout(() => {
                    authService.logout();
                    window.location.href = '../index.html';
                }, 2000);
            } else if (error.message.includes('réponse invalide')) {
                errorMessage = 'Erreur de communication avec le serveur. Vérifiez votre connexion.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showMessage(errorMessage, 'error');
        } finally {
            stopLoading();
        }
    }

    async function handleEditAgent(e) {
        e.preventDefault();
        
        console.log('Début de la modification d\'agent...');
        
        const formData = new FormData(e.target);
        const agentId = formData.get('agentId');
        const agentData = {
            nom: formData.get('nom').trim(),
            prenom: formData.get('prenom').trim(),
            telephone: formData.get('telephone').trim()
        };

        // Ajouter le mot de passe seulement s'il est fourni
        const password = formData.get('password');
        if (password && password.trim()) {
            agentData.password = password;
        }

        console.log('Données de modification:', agentData);

        // Validation côté client
        if (!validateAgentData(agentData, true)) {
            return;
        }

        const submitButton = e.target.querySelector('button[type="submit"]');
        const stopLoading = showButtonLoading(submitButton);

        try {
            console.log('Envoi des modifications à l\'API...');
            const result = await agentsService.updateAgent(agentId, agentData);
            console.log('Agent modifié avec succès:', result);
            
            // Fermer le modal AVANT d'afficher le message
            closeModal('editAgentModal');
            
            // Afficher le message de succès
            showMessage('Agent modifié avec succès !', 'success');
            
            // Recharger la liste des agents
            await loadAgents();
            
        } catch (error) {
            console.error('Erreur lors de la modification:', error);
            
            let errorMessage = 'Erreur lors de la modification de l\'agent.';
            
            if (error.message.includes('Téléphone invalide')) {
                errorMessage = 'Le numéro de téléphone n\'est pas valide.';
            } else if (error.message.includes('telephone')) {
                errorMessage = 'Ce numéro de téléphone est déjà utilisé.';
            } else if (error.message.includes('Données de la compagnie non trouvées')) {
                errorMessage = 'Session expirée. Veuillez vous reconnecter.';
                setTimeout(() => {
                    authService.logout();
                    window.location.href = '../index.html';
                }, 2000);
            } else if (error.message.includes('réponse invalide')) {
                errorMessage = 'Erreur de communication avec le serveur.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showMessage(errorMessage, 'error');
        } finally {
            stopLoading();
        }
    }

    function validateAgentData(data, isEdit = false) {
        let isValid = true;

        // Vérifier les champs requis
        if (!data.nom || !data.prenom || !data.telephone) {
            showMessage('Tous les champs obligatoires doivent être remplis.', 'error');
            isValid = false;
        }

        // Vérifier le mot de passe (requis pour création, optionnel pour modification)
        if (!isEdit && !data.password) {
            showMessage('Le mot de passe est requis.', 'error');
            isValid = false;
        }

        if (data.password && data.password.length < 6) {
            showMessage('Le mot de passe doit contenir au moins 6 caractères.', 'error');
            isValid = false;
        }

        // Vérifier le format du téléphone - doit être numérique
        if (data.telephone) {
            const phoneNumber = data.telephone.toString().replace(/[\s\-\.]/g, '');
            if (!/^\d{8,15}$/.test(phoneNumber)) {
                showMessage('Le téléphone doit contenir uniquement des chiffres (8-15 chiffres).', 'error');
                isValid = false;
            }
        }

        return isValid;
    }

    // Fonctions pour les actions sur les agents
    function viewAgent(agentId) {
        const agent = allAgents.find(a => a.id === agentId);
        if (!agent) {
            uiService.showMessage('Agent non trouvé.', 'error');
            return;
        }

        currentAgentToView = agent;

        // Remplir les informations dans la modale
        document.getElementById('viewAgentAvatar').textContent = getInitials(agent.nom, agent.prenom);
        document.getElementById('viewAgentName').textContent = `${agent.prenom} ${agent.nom}`;
        document.getElementById('viewAgentId').textContent = `ID: #${agent.id}`;
        document.getElementById('viewAgentPhone').textContent = agent.telephone;
        
        const dateCreated = agent.created_at ? 
            new Date(agent.created_at).toLocaleDateString('fr-FR') : 
            'Non spécifiée';
        document.getElementById('viewAgentDate').textContent = dateCreated;

        openModal('viewAgentModal');
    }

    function editAgent(agentId) {
        const agent = allAgents.find(a => a.id === agentId);
        if (!agent) {
            uiService.showMessage('Agent non trouvé.', 'error');
            return;
        }

        // Remplir le formulaire de modification
        document.getElementById('editAgentId').value = agent.id;
        document.getElementById('editAgentNom').value = agent.nom;
        document.getElementById('editAgentPrenom').value = agent.prenom;
        document.getElementById('editAgentTelephone').value = agent.telephone;
        document.getElementById('editAgentPassword').value = '';

        openModal('editAgentModal');
    }

    function editAgentFromView() {
        if (currentAgentToView) {
            closeModal('viewAgentModal');
            editAgent(currentAgentToView.id);
        }
    }

    function deleteAgent(agentId) {
        const agent = allAgents.find(a => a.id === agentId);
        if (!agent) {
            showMessage('Agent non trouvé.', 'error');
            return;
        }

        currentAgentToDelete = agent;
        document.getElementById('deleteAgentName').textContent = `${agent.prenom} ${agent.nom}`;
        openModal('deleteAgentModal');
    }

    async function confirmDeleteAgent() {
        if (!currentAgentToDelete) return;

        try {
            await agentsService.deleteAgent(currentAgentToDelete.id);
            
            showMessage(`Agent ${currentAgentToDelete.prenom} ${currentAgentToDelete.nom} supprimé avec succès !`, 'success');
            closeModal('deleteAgentModal');
            
            // Recharger la liste des agents
            await loadAgents();
            
        } catch (error) {
            showMessage('Erreur lors de la suppression: ' + error.message, 'error');
        } finally {
            currentAgentToDelete = null;
        }
    }

    // Fonctions de filtrage et tri
    function filterAgents() {
        const searchTerm = document.getElementById('searchAgent').value.toLowerCase().trim();
        
        if (!searchTerm) {
            displayAgents(allAgents);
            return;
        }

        const filteredAgents = allAgents.filter(agent => {
            return agent.nom.toLowerCase().includes(searchTerm) ||
                   agent.prenom.toLowerCase().includes(searchTerm) ||
                   agent.telephone.includes(searchTerm) ||
                   agent.id.toString().includes(searchTerm);
        });

        displayAgents(filteredAgents);
    }

    function sortAgents() {
        const sortBy = document.getElementById('sortBy').value;
        
        const sortedAgents = [...allAgents].sort((a, b) => {
            switch (sortBy) {
                case 'nom':
                    return a.nom.localeCompare(b.nom);
                case 'prenom':
                    return a.prenom.localeCompare(b.prenom);
                case 'created_at':
                    return new Date(b.created_at) - new Date(a.created_at);
                default:
                    return 0;
            }
        });

        displayAgents(sortedAgents);
    }

    function exportAgents() {
        if (allAgents.length === 0) {
            showMessage('Aucun agent à exporter.', 'error');
            return;
        }

        // Créer un CSV
        const headers = ['ID', 'Nom', 'Prénom', 'Téléphone'];
        const csvContent = [
            headers.join(','),
            ...allAgents.map(agent => [
                agent.id,
                agent.nom,
                agent.prenom,
                agent.telephone
            ].join(','))
        ].join('\n');

        // Télécharger le fichier
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `agents_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        showMessage('Export réussi !', 'success');
    }

    // Exposer les fonctions globalement
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.loadAgents = loadAgents;
    window.viewAgent = viewAgent;
    window.editAgent = editAgent;
    window.editAgentFromView = editAgentFromView;
    window.deleteAgent = deleteAgent;
    window.confirmDeleteAgent = confirmDeleteAgent;
    window.filterAgents = filterAgents;
    window.sortAgents = sortAgents;
    window.exportAgents = exportAgents;
});