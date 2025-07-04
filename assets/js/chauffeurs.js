// assets/js/chauffeurs.js
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier l'authentification
    if (!authService.isAuthenticated()) {
        window.location.href = '../index.html';
        return;
    }

    // Variables globales
    let allChauffeurs = [];
    let currentChauffeurToDelete = null;
    let currentChauffeurToView = null;

    // Fonction pour afficher les messages
    function showMessage(message, type = 'success') {
        const existingMessages = document.querySelectorAll('.success-message, .error-message');
        existingMessages.forEach(msg => msg.remove());

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
        await loadChauffeurs();
    }

    function setupEventListeners() {
        // Formulaire d'ajout de chauffeur
        const addForm = document.getElementById('addChauffeurForm');
        if (addForm) {
            addForm.addEventListener('submit', handleAddChauffeur);
        }

        // Formulaire de modification de chauffeur
        const editForm = document.getElementById('editChauffeurForm');
        if (editForm) {
            editForm.addEventListener('submit', handleEditChauffeur);
        }

        // Gestion des modales (clic extérieur)
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeModal(modal.id);
                }
            });
        });
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

    async function loadChauffeurs() {
        console.log('Chargement des chauffeurs...');
        showLoading(true);
        
        try {
            console.log('Appel API pour récupérer les chauffeurs...');
            const response = await chauffeursService.getChauffeurs();
            console.log('Réponse API chauffeurs:', response);
            
            allChauffeurs = Array.isArray(response) ? response : (response.chauffeurs || response.data || []);
            console.log('Chauffeurs traités:', allChauffeurs);
            
            updateStats();
            displayChauffeurs(allChauffeurs);
            
        } catch (error) {
            console.error('Erreur lors du chargement des chauffeurs:', error);
            
            let errorMessage = 'Erreur lors du chargement des chauffeurs: ' + error.message;
            
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
        document.getElementById('totalChauffeurs').textContent = allChauffeurs.length;
        document.getElementById('activeChauffeurs').textContent = allChauffeurs.length; // Tous actifs pour le moment
        document.getElementById('newChauffeursMonth').textContent = 0; // Pas de date de création
    }

    function displayChauffeurs(chauffeurs) {
        const container = document.getElementById('chauffeursContainer');
        
        if (chauffeurs.length === 0) {
            displayEmptyState();
            return;
        }

        const chauffeursGrid = document.createElement('div');
        chauffeursGrid.className = 'chauffeurs-grid';
        
        chauffeurs.forEach(chauffeur => {
            const chauffeurCard = createChauffeurCard(chauffeur);
            chauffeursGrid.appendChild(chauffeurCard);
        });
        
        container.innerHTML = '';
        container.appendChild(chauffeursGrid);
    }

    function createChauffeurCard(chauffeur) {
        const card = document.createElement('div');
        card.className = 'chauffeur-card';
        
        // Créer l'avatar avec initiales
        const initials = getInitials(chauffeur.nom, chauffeur.prenom);
        
        card.innerHTML = `
            <div class="chauffeur-avatar">${initials}</div>
            <div class="chauffeur-name">${chauffeur.prenom} ${chauffeur.nom}</div>
            <div class="chauffeur-info">
                <i class="fas fa-phone" style="margin-right: 8px;"></i>
                ${chauffeur.telephone}
            </div>
            <div class="chauffeur-id">ID: #${chauffeur.id}</div>
            <div class="chauffeur-actions">
                <button class="btn btn-primary" onclick="viewChauffeur(${chauffeur.id})" title="Voir les détails">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-secondary" onclick="editChauffeur(${chauffeur.id})" title="Modifier">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn" style="background-color: #ff4757; color: white;" onclick="deleteChauffeur(${chauffeur.id})" title="Supprimer">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return card;
    }

    function getInitials(nom, prenom) {
        const firstInitial = (prenom && prenom.length > 0) ? prenom[0].toUpperCase() : '';
        const lastInitial = (nom && nom.length > 0) ? nom[0].toUpperCase() : '';
        return firstInitial + lastInitial || 'C';
    }

    function displayEmptyState() {
        const container = document.getElementById('chauffeursContainer');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>Aucun chauffeur trouvé</h3>
                <p>Commencez par ajouter votre premier chauffeur à la compagnie.</p>
                <button class="btn btn-primary" onclick="openModal('addChauffeurModal')">
                    <i class="fas fa-plus"></i>
                    Ajouter un chauffeur
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
            }
        }
    }

    // Gestion des chauffeurs
    async function handleAddChauffeur(e) {
        e.preventDefault();
        
        console.log('Début de l\'ajout de chauffeur...');
        
        const formData = new FormData(e.target);
        const chauffeurData = {
            nom: formData.get('nom').trim(),
            prenom: formData.get('prenom').trim(),
            telephone: formData.get('telephone').trim()
        };

        console.log('Données du formulaire:', chauffeurData);

        // Validation côté client
        if (!validateChauffeurData(chauffeurData)) {
            return;
        }

        const submitButton = e.target.querySelector('button[type="submit"]');
        const stopLoading = showButtonLoading(submitButton);

        try {
            console.log('Envoi des données à l\'API...');
            const result = await chauffeursService.registerChauffeur(chauffeurData);
            console.log('Chauffeur créé avec succès:', result);
            
            closeModal('addChauffeurModal');
            showMessage('Chauffeur ajouté avec succès !', 'success');
            await loadChauffeurs();
            
        } catch (error) {
            console.error('Erreur lors de l\'ajout:', error);
            
            let errorMessage = 'Erreur lors de l\'ajout du chauffeur.';
            
            if (error.message.includes('telephone')) {
                errorMessage = 'Ce numéro de téléphone est déjà utilisé.';
            } else if (error.message.includes('Données de la compagnie non trouvées')) { 'Cet email est déjà utilisé.';
            } else if (error.message.includes('telephone')) {
                errorMessage = 'Ce numéro de téléphone est déjà utilisé.';
            } else if (error.message.includes('Données de la compagnie non trouvées')) {
                errorMessage = 'Session expirée. Veuillez vous reconnecter.';
                setTimeout(() => {
                    authService.logout();
                    window.location.href = '../index.html';
                }, 2000);
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showMessage(errorMessage, 'error');
        } finally {
            stopLoading();
        }
    }

    async function handleEditChauffeur(e) {
        e.preventDefault();
        
        console.log('Début de la modification de chauffeur...');
        
        const formData = new FormData(e.target);
        const chauffeurId = formData.get('chauffeurId');
        const chauffeurData = {
            nom: formData.get('nom').trim(),
            prenom: formData.get('prenom').trim(),
            telephone: formData.get('telephone').trim()
        };

        console.log('Données de modification:', chauffeurData);

        // Validation côté client
        if (!validateChauffeurData(chauffeurData)) {
            return;
        }

        const submitButton = e.target.querySelector('button[type="submit"]');
        const stopLoading = showButtonLoading(submitButton);

        try {
            console.log('Envoi des modifications à l\'API...');
            const result = await chauffeursService.updateChauffeur(chauffeurId, chauffeurData);
            console.log('Chauffeur modifié avec succès:', result);
            
            closeModal('editChauffeurModal');
            showMessage('Chauffeur modifié avec succès !', 'success');
            await loadChauffeurs();
            
        } catch (error) {
            console.error('Erreur lors de la modification:', error);
            
            let errorMessage = 'Erreur lors de la modification du chauffeur.';
            
            if (error.message.includes('telephone')) {
                errorMessage = 'Ce numéro de téléphone est déjà utilisé.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showMessage(errorMessage, 'error');
        } finally {
            stopLoading();
        }
    }

    function validateChauffeurData(data) {
        let isValid = true;

        // Vérifier les champs requis
        if (!data.nom || !data.prenom || !data.telephone) {
            showMessage('Tous les champs obligatoires doivent être remplis.', 'error');
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

    // Fonctions pour les actions sur les chauffeurs
    function viewChauffeur(chauffeurId) {
        const chauffeur = allChauffeurs.find(c => c.id === chauffeurId);
        if (!chauffeur) {
            showMessage('Chauffeur non trouvé.', 'error');
            return;
        }

        currentChauffeurToView = chauffeur;

        // Remplir les informations dans la modale
        document.getElementById('viewChauffeurAvatar').textContent = getInitials(chauffeur.nom, chauffeur.prenom);
        document.getElementById('viewChauffeurName').textContent = `${chauffeur.prenom} ${chauffeur.nom}`;
        document.getElementById('viewChauffeurId').textContent = `ID: #${chauffeur.id}`;
        document.getElementById('viewChauffeurPhone').textContent = chauffeur.telephone;
        document.getElementById('viewChauffeurCompagnieId').textContent = chauffeur.compagnie_id;

        openModal('viewChauffeurModal');
    }

    function editChauffeur(chauffeurId) {
        const chauffeur = allChauffeurs.find(c => c.id === chauffeurId);
        if (!chauffeur) {
            showMessage('Chauffeur non trouvé.', 'error');
            return;
        }

        // Remplir le formulaire de modification
        document.getElementById('editChauffeurId').value = chauffeur.id;
        document.getElementById('editChauffeurNom').value = chauffeur.nom;
        document.getElementById('editChauffeurPrenom').value = chauffeur.prenom;
        document.getElementById('editChauffeurTelephone').value = chauffeur.telephone;

        openModal('editChauffeurModal');
    }

    function editChauffeurFromView() {
        if (currentChauffeurToView) {
            closeModal('viewChauffeurModal');
            editChauffeur(currentChauffeurToView.id);
        }
    }

    function deleteChauffeur(chauffeurId) {
        const chauffeur = allChauffeurs.find(c => c.id === chauffeurId);
        if (!chauffeur) {
            showMessage('Chauffeur non trouvé.', 'error');
            return;
        }

        currentChauffeurToDelete = chauffeur;
        document.getElementById('deleteChauffeurName').textContent = `${chauffeur.prenom} ${chauffeur.nom}`;
        openModal('deleteChauffeurModal');
    }

    async function confirmDeleteChauffeur() {
        if (!currentChauffeurToDelete) return;

        try {
            await chauffeursService.deleteChauffeur(currentChauffeurToDelete.id);
            
            showMessage(`Chauffeur ${currentChauffeurToDelete.prenom} ${currentChauffeurToDelete.nom} supprimé avec succès !`, 'success');
            closeModal('deleteChauffeurModal');
            
            // Recharger la liste des chauffeurs
            await loadChauffeurs();
            
        } catch (error) {
            showMessage('Erreur lors de la suppression: ' + error.message, 'error');
        } finally {
            currentChauffeurToDelete = null;
        }
    }

    // Fonctions de filtrage et tri
    function filterChauffeurs() {
        const searchTerm = document.getElementById('searchChauffeur').value.toLowerCase().trim();
        
        if (!searchTerm) {
            displayChauffeurs(allChauffeurs);
            return;
        }

        const filteredChauffeurs = allChauffeurs.filter(chauffeur => {
            return chauffeur.nom.toLowerCase().includes(searchTerm) ||
                   chauffeur.prenom.toLowerCase().includes(searchTerm) ||
                   chauffeur.telephone.includes(searchTerm) ||
                   chauffeur.id.toString().includes(searchTerm);
        });

        displayChauffeurs(filteredChauffeurs);
    }

    function sortChauffeurs() {
        const sortBy = document.getElementById('sortBy').value;
        
        const sortedChauffeurs = [...allChauffeurs].sort((a, b) => {
            switch (sortBy) {
                case 'nom':
                    return a.nom.localeCompare(b.nom);
                case 'prenom':
                    return a.prenom.localeCompare(b.prenom);
                case 'telephone':
                    return a.telephone.localeCompare(b.telephone);
                default:
                    return 0;
            }
        });

        displayChauffeurs(sortedChauffeurs);
    }

    function exportChauffeurs() {
        if (allChauffeurs.length === 0) {
            showMessage('Aucun chauffeur à exporter.', 'error');
            return;
        }

        // Créer un CSV
        const headers = ['ID', 'Nom', 'Prénom', 'Téléphone'];
        const csvContent = [
            headers.join(','),
            ...allChauffeurs.map(chauffeur => [
                chauffeur.id,
                `"${chauffeur.nom}"`,
                `"${chauffeur.prenom}"`,
                chauffeur.telephone
            ].join(','))
        ].join('\n');

        // Télécharger le fichier
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `chauffeurs_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        showMessage('Export réussi !', 'success');
    }

    // Exposer les fonctions globalement
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.loadChauffeurs = loadChauffeurs;
    window.viewChauffeur = viewChauffeur;
    window.editChauffeur = editChauffeur;
    window.editChauffeurFromView = editChauffeurFromView;
    window.deleteChauffeur = deleteChauffeur;
    window.confirmDeleteChauffeur = confirmDeleteChauffeur;
    window.filterChauffeurs = filterChauffeurs;
    window.sortChauffeurs = sortChauffeurs;
    window.exportChauffeurs = exportChauffeurs;
});