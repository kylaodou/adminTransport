 // assets/js/bus.js
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier l'authentification
    if (!authService.isAuthenticated()) {
        window.location.href = '../index.html';
        return;
    }

    // Variables globales
    let allBus = [];
    let currentBusToDelete = null;
    let currentBusToView = null;

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
        await loadBus();
    }

    function setupEventListeners() {
        // Formulaire d'ajout de bus
        const addForm = document.getElementById('addBusForm');
        if (addForm) {
            addForm.addEventListener('submit', handleAddBus);
        }

        // Formulaire de modification de bus
        const editForm = document.getElementById('editBusForm');
        if (editForm) {
            editForm.addEventListener('submit', handleEditBus);
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

    async function loadBus() {
        console.log('Chargement des bus...');
        showLoading(true);
        
        try {
            console.log('Appel API pour récupérer les bus...');
            const response = await busService.getBus();
            console.log('Réponse API bus:', response);
            
            allBus = Array.isArray(response) ? response : (response.bus || response.data || []);
            console.log('Bus traités:', allBus);
            
            updateStats();
            displayBus(allBus);
            
        } catch (error) {
            console.error('Erreur lors du chargement des bus:', error);
            
            let errorMessage = 'Erreur lors du chargement des bus: ' + error.message;
            
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
        document.getElementById('totalBus').textContent = allBus.length;
        
        const busInService = allBus.filter(bus => bus.service === true).length;
        document.getElementById('busInService').textContent = busInService;
        
        const totalCapacity = allBus.reduce((sum, bus) => sum + (parseInt(bus.capacite) || 0), 0);
        document.getElementById('totalCapacity').textContent = totalCapacity;
    }

    function displayBus(buses) {
        const container = document.getElementById('busContainer');
        
        if (buses.length === 0) {
            displayEmptyState();
            return;
        }

        const busGrid = document.createElement('div');
        busGrid.className = 'bus-grid';
        
        buses.forEach(bus => {
            const busCard = createBusCard(bus);
            busGrid.appendChild(busCard);
        });
        
        container.innerHTML = '';
        container.appendChild(busGrid);
    }

    function createBusCard(bus) {
        const card = document.createElement('div');
        card.className = 'bus-card';
        
        // Déterminer le statut selon le boolean
        const serviceStatus = bus.service ? 'Disponible' : 'Indisponible';
        const serviceColor = bus.service ? '#28a745' : '#dc3545';
        
        card.innerHTML = `
            <div class="bus-icon">
                <i class="fas fa-bus"></i>
            </div>
            <div class="bus-matricule">${bus.matricule}</div>
            <div class="bus-info">
                <i class="fas fa-users" style="margin-right: 8px;"></i>
                Capacité: ${bus.capacite} places
            </div>
            <div class="bus-info">
                <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
                ${bus.description || 'Aucune description'}
            </div>
            <div class="bus-service" style="background-color: ${serviceColor}; color: white;">
                ${serviceStatus}
            </div>
            <div class="bus-actions">
                <button class="btn btn-primary" onclick="viewBus(${bus.id})" title="Voir les détails">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-secondary" onclick="editBus(${bus.id})" title="Modifier">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn" style="background-color: #ff4757; color: white;" onclick="deleteBus(${bus.id})" title="Supprimer">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return card;
    }

    function displayEmptyState() {
        const container = document.getElementById('busContainer');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bus"></i>
                <h3>Aucun bus trouvé</h3>
                <p>Commencez par ajouter votre premier bus à la flotte.</p>
                <button class="btn btn-primary" onclick="openModal('addBusModal')">
                    <i class="fas fa-plus"></i>
                    Ajouter un bus
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
        console.log('Ouverture modal:', modalId);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            console.log('Modal ouverte:', modalId);
        } else {
            console.error('Modal non trouvée:', modalId);
        }
    }

    function closeModal(modalId) {
        console.log('Fermeture modal:', modalId);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
            
            // Réinitialiser les formulaires
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
            }
            
            console.log('Modal fermée:', modalId);
        }
    }

    // Gestion des bus
    async function handleAddBus(e) {
        e.preventDefault();
        
        console.log('Début de l\'ajout de bus...');
        
        const formData = new FormData(e.target);
        const busData = {
            matricule: formData.get('matricule').trim(),
            capacite: formData.get('capacite'),
            description: formData.get('description').trim(),
            service: document.getElementById('busService').checked // Boolean au lieu de string
        };

        console.log('Données du formulaire:', busData);

        // Validation côté client
        if (!validateBusData(busData)) {
            return;
        }

        const submitButton = e.target.querySelector('button[type="submit"]');
        const stopLoading = showButtonLoading(submitButton);

        try {
            console.log('Envoi des données à l\'API...');
            const result = await busService.registerBus(busData);
            console.log('Bus créé avec succès:', result);
            
            closeModal('addBusModal');
            showMessage('Bus ajouté avec succès !', 'success');
            await loadBus();
            
        } catch (error) {
            console.error('Erreur lors de l\'ajout:', error);
            
            let errorMessage = 'Erreur lors de l\'ajout du bus.';
            
            if (error.message.includes('matricule')) {
                errorMessage = 'Ce matricule est déjà utilisé.';
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

    async function handleEditBus(e) {
        e.preventDefault();
        
        console.log('Début de la modification de bus...');
        
        const formData = new FormData(e.target);
        const busId = formData.get('busId');
        const busData = {
            matricule: formData.get('matricule').trim(),
            capacite: formData.get('capacite'),
            description: formData.get('description').trim(),
            service: document.getElementById('editBusService').checked // Boolean au lieu de string
        };

        console.log('Données de modification:', busData);

        // Validation côté client
        if (!validateBusData(busData)) {
            return;
        }

        const submitButton = e.target.querySelector('button[type="submit"]');
        const stopLoading = showButtonLoading(submitButton);

        try {
            console.log('Envoi des modifications à l\'API...');
            const result = await busService.updateBus(busId, busData);
            console.log('Bus modifié avec succès:', result);
            
            closeModal('editBusModal');
            showMessage('Bus modifié avec succès !', 'success');
            await loadBus();
            
        } catch (error) {
            console.error('Erreur lors de la modification:', error);
            
            let errorMessage = 'Erreur lors de la modification du bus.';
            
            if (error.message.includes('matricule')) {
                errorMessage = 'Ce matricule est déjà utilisé.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showMessage(errorMessage, 'error');
        } finally {
            stopLoading();
        }
    }

    function validateBusData(data) {
        let isValid = true;

        // Vérifier les champs requis
        if (!data.matricule || !data.capacite || data.service === undefined) {
            showMessage('Tous les champs obligatoires doivent être remplis.', 'error');
            isValid = false;
        }

        // Vérifier la capacité
        const capacite = parseInt(data.capacite);
        if (isNaN(capacite) || capacite < 1 || capacite > 100) {
            showMessage('La capacité doit être entre 1 et 100 places.', 'error');
            isValid = false;
        }

        // Vérifier le format du matricule
        if (data.matricule && data.matricule.length < 3) {
            showMessage('Le matricule doit contenir au moins 3 caractères.', 'error');
            isValid = false;
        }

        return isValid;
    }

    // Fonction pour générer les sièges selon la capacité
    function generateSeatsLayout(capacity) {
        const container = document.getElementById('seatsContainer');
        if (!container) return;
        
        container.innerHTML = '';

        if (capacity <= 0) return;

        // Configuration selon la capacité
        let seatsPerRow = 2;
        if (capacity > 20) seatsPerRow = 4;
        else if (capacity > 10) seatsPerRow = 3;

        const rows = Math.ceil(capacity / seatsPerRow);
        let seatNumber = 1;

        for (let row = 0; row < rows; row++) {
            const seatRow = document.createElement('div');
            seatRow.className = 'seat-row';

            const seatsInThisRow = Math.min(seatsPerRow, capacity - (row * seatsPerRow));
            
            for (let seat = 0; seat < seatsInThisRow; seat++) {
                const seatElement = document.createElement('div');
                seatElement.className = 'seat';
                seatElement.textContent = seatNumber;
                seatElement.title = `Place ${seatNumber}`;
                
                seatRow.appendChild(seatElement);
                seatNumber++;

                // Ajouter une allée au milieu pour les bus plus grands
                if (seatsPerRow === 4 && seat === 1) {
                    const aisle = document.createElement('div');
                    aisle.className = 'aisle';
                    seatRow.appendChild(aisle);
                }
            }

            container.appendChild(seatRow);
        }
    }

    // Fonctions pour les actions sur les bus
    function viewBus(busId) {
        const bus = allBus.find(b => b.id === busId);
        if (!bus) {
            showMessage('Bus non trouvé.', 'error');
            return;
        }

        currentBusToView = bus;

        // Déterminer le statut d'affichage
        const serviceStatus = bus.service ? 'Disponible' : 'Indisponible';

        // Remplir les informations dans la modale
        document.getElementById('viewBusMatricule').textContent = bus.matricule;
        document.getElementById('viewBusMatriculeText').textContent = bus.matricule;
        document.getElementById('viewBusCapacite').textContent = bus.capacite;
        document.getElementById('viewBusService').textContent = serviceStatus;
        document.getElementById('viewBusDescription').textContent = bus.description || 'Aucune description';
        document.getElementById('viewBusId').textContent = bus.id;
        document.getElementById('viewBusCompagnieId').textContent = bus.compagnie_id;

        // Générer les sièges selon la capacité
        generateSeatsLayout(parseInt(bus.capacite));

        openModal('viewBusModal');
    }

    function editBus(busId) {
        const bus = allBus.find(b => b.id === busId);
        if (!bus) {
            showMessage('Bus non trouvé.', 'error');
            return;
        }

        // Remplir le formulaire de modification
        document.getElementById('editBusId').value = bus.id;
        document.getElementById('editBusMatricule').value = bus.matricule;
        document.getElementById('editBusCapacite').value = bus.capacite;
        document.getElementById('editBusService').checked = bus.service; // Boolean
        document.getElementById('editBusDescription').value = bus.description || '';

        // Mettre à jour le label du toggle
        const editBusServiceLabel = document.getElementById('editBusServiceLabel');
        if (editBusServiceLabel) {
            if (bus.service) {
                editBusServiceLabel.textContent = 'Disponible';
                editBusServiceLabel.style.color = 'var(--primary-orange)';
            } else {
                editBusServiceLabel.textContent = 'Indisponible';
                editBusServiceLabel.style.color = '#dc3545';
            }
        }

        openModal('editBusModal');
    }

    function editBusFromView() {
        if (currentBusToView) {
            closeModal('viewBusModal');
            editBus(currentBusToView.id);
        }
    }

    function deleteBus(busId) {
        const bus = allBus.find(b => b.id === busId);
        if (!bus) {
            showMessage('Bus non trouvé.', 'error');
            return;
        }

        currentBusToDelete = bus;
        document.getElementById('deleteBusMatricule').textContent = bus.matricule;
        openModal('deleteBusModal');
    }

    async function confirmDeleteBus() {
        if (!currentBusToDelete) return;

        try {
            await busService.deleteBus(currentBusToDelete.id);
            
            showMessage(`Bus ${currentBusToDelete.matricule} supprimé avec succès !`, 'success');
            closeModal('deleteBusModal');
            
            // Recharger la liste des bus
            await loadBus();
            
        } catch (error) {
            showMessage('Erreur lors de la suppression: ' + error.message, 'error');
        } finally {
            currentBusToDelete = null;
        }
    }

    // Fonctions de filtrage
    function filterBus() {
        const searchTerm = document.getElementById('searchBus').value.toLowerCase().trim();
        
        let filteredBus = allBus;

        // Filtrer par terme de recherche
        if (searchTerm) {
            filteredBus = filteredBus.filter(bus => {
                const serviceStatus = bus.service ? 'disponible' : 'indisponible';
                return bus.matricule.toLowerCase().includes(searchTerm) ||
                       (bus.description && bus.description.toLowerCase().includes(searchTerm)) ||
                       serviceStatus.includes(searchTerm) ||
                       bus.id.toString().includes(searchTerm);
            });
        }

        displayBus(filteredBus);
    }

    function exportBus() {
        if (allBus.length === 0) {
            showMessage('Aucun bus à exporter.', 'error');
            return;
        }

        // Créer un CSV
        const headers = ['ID', 'Matricule', 'Capacité', 'Service', 'Description'];
        const csvContent = [
            headers.join(','),
            ...allBus.map(bus => [
                bus.id,
                `"${bus.matricule}"`,
                bus.capacite,
                `"${bus.service ? 'Disponible' : 'Indisponible'}"`,
                `"${bus.description || ''}"`
            ].join(','))
        ].join('\n');

        // Télécharger le fichier
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `bus_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        showMessage('Export réussi !', 'success');
    }

    // Exposer les fonctions globalement
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.loadBus = loadBus;
    window.viewBus = viewBus;
    window.editBus = editBus;
    window.editBusFromView = editBusFromView;
    window.deleteBus = deleteBus;
    window.confirmDeleteBus = confirmDeleteBus;
    window.filterBus = filterBus;
    window.exportBus = exportBus;
});