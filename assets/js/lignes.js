// assets/js/lignes.js
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier l'authentification
    if (!authService.isAuthenticated()) {
        window.location.href = '../index.html';
        return;
    }

    // Variables globales
    let allTrajets = [];
    let allPlannings = [];
    let allChauffeurs = [];
    let allBus = [];
    let currentTrajetToDelete = null;
    let currentPlanningToDelete = null;

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
        if (!button) {
            console.warn('Bouton non trouvé pour showButtonLoading');
            return () => {}; // Retourner une fonction vide si le bouton n'existe pas
        }
        
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
        button.disabled = true;
        
        return () => {
            if (button) {
                button.innerHTML = originalText;
                button.disabled = false;
            }
        };
    }

    // Fonction pour attendre que les éléments soient disponibles
    function waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    }

    // Initialisation
    init();

    async function init() {
        try {
            // Attendre que les éléments essentiels soient disponibles
            await waitForElement('#trajetsContainer');
            await waitForElement('#planningsTableBody');
            
            // Vérifier que les éléments statistiques existent
            const statsElements = [
                'totalTrajets',
                'totalPlannings', 
                'planningsToday',
                'totalDistance'
            ];
            
            for (const elementId of statsElements) {
                const element = document.getElementById(elementId);
                if (!element) {
                    console.warn(`Élément statistique manquant: ${elementId}`);
                    // Créer l'élément s'il n'existe pas
                    const span = document.createElement('span');
                    span.id = elementId;
                    span.textContent = '0';
                    document.body.appendChild(span);
                }
            }
            
            setupEventListeners();
            setupLogoutHandler();
            await loadAllData();
            
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            showMessage('Erreur lors de l\'initialisation de la page', 'error');
        }
    }

    function setupEventListeners() {
        // Formulaires - Vérifier l'existence avant d'ajouter les listeners
        const newTrajetForm = document.getElementById('newTrajetForm');
        if (newTrajetForm) {
            newTrajetForm.addEventListener('submit', handleAddTrajet);
        }

        const editTrajetForm = document.getElementById('editTrajetForm');
        if (editTrajetForm) {
            editTrajetForm.addEventListener('submit', handleEditTrajet);
        }

        const newScheduleForm = document.getElementById('newScheduleForm');
        if (newScheduleForm) {
            newScheduleForm.addEventListener('submit', handleAddPlanning);
        }

        const editPlanningForm = document.getElementById('editPlanningForm');
        if (editPlanningForm) {
            editPlanningForm.addEventListener('submit', handleEditPlanning);
        }

        // Gestion des modales (clic extérieur)
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeModal(modal.id);
                }
            });
        });

        // Date d'aujourd'hui par défaut
        const scheduleDateInput = document.getElementById('scheduleDate');
        if (scheduleDateInput) {
            const today = new Date().toISOString().split('T')[0];
            scheduleDateInput.value = today;
        }
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

    async function loadAllData() {
        try {
            // Charger les données en parallèle
            const results = await Promise.allSettled([
                loadTrajets(),
                loadPlannings(),
                loadChauffeurs(),
                loadBus()
            ]);
            
            // Vérifier s'il y a eu des erreurs
            const errors = results.filter(result => result.status === 'rejected');
            if (errors.length > 0) {
                console.warn('Certaines données n\'ont pas pu être chargées:', errors);
            }
            
            updateStats();
            populateSelectOptions();
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            showMessage('Erreur lors du chargement des données', 'error');
        }
    }

    async function loadTrajets() {
        console.log('Chargement des trajets...');
        showTrajetsLoading(true);
        
        try {
            const response = await trajetsService.getTrajets();
            allTrajets = Array.isArray(response) ? response : (response.trajets || response.data || []);
            console.log('Trajets chargés:', allTrajets);
            displayTrajets(allTrajets);
        } catch (error) {
            console.error('Erreur lors du chargement des trajets:', error);
            showMessage('Erreur lors du chargement des trajets: ' + error.message, 'error');
            displayEmptyTrajets();
        } finally {
            showTrajetsLoading(false);
        }
    }

    async function loadPlannings() {
        console.log('Chargement des plannings...');
        showPlanningsLoading(true);
        
        try {
            const response = await planningsService.getPlannings();
            allPlannings = Array.isArray(response) ? response : (response.plannings || response.data || []);
            console.log('Plannings chargés:', allPlannings);
            displayPlannings(allPlannings);
        } catch (error) {
            console.error('Erreur lors du chargement des plannings:', error);
            showMessage('Erreur lors du chargement des plannings: ' + error.message, 'error');
            displayEmptyPlannings();
        } finally {
            showPlanningsLoading(false);
        }
    }

    async function loadChauffeurs() {
        try {
            const response = await chauffeursService.getChauffeurs();
            allChauffeurs = Array.isArray(response) ? response : (response.chauffeurs || response.data || []);
            console.log('Chauffeurs chargés:', allChauffeurs);
        } catch (error) {
            console.error('Erreur lors du chargement des chauffeurs:', error);
            allChauffeurs = [];
        }
    }

    async function loadBus() {
        try {
            const response = await busService.getBus();
            allBus = Array.isArray(response) ? response : (response.bus || response.data || []);
            console.log('Bus chargés:', allBus);
        } catch (error) {
            console.error('Erreur lors du chargement des bus:', error);
            allBus = [];
        }
    }

    function updateStats() {
        const totalTrajetsEl = document.getElementById('totalTrajets');
        const totalPlanningsEl = document.getElementById('totalPlannings');
        const planningsTodayEl = document.getElementById('planningsToday');
        const totalDistanceEl = document.getElementById('totalDistance');

        if (totalTrajetsEl) totalTrajetsEl.textContent = allTrajets.length;
        if (totalPlanningsEl) totalPlanningsEl.textContent = allPlannings.length;
        
        // Plannings d'aujourd'hui
        const today = new Date().toISOString().split('T')[0];
        const planningsToday = allPlannings.filter(p => p.date === today).length;
        if (planningsTodayEl) planningsTodayEl.textContent = planningsToday;
        
        // Distance totale estimée
        const totalDistance = allTrajets.reduce((sum, trajet) => {
            return sum + Math.round((trajet.duree_estime || 0) * 0.8); // Estimation: 0.8 km/min
        }, 0);
        if (totalDistanceEl) totalDistanceEl.textContent = totalDistance;
    }

    function populateSelectOptions() {
        // Remplir les options de trajets
        const trajetSelects = document.querySelectorAll('#scheduleTrajet, #editScheduleTrajet');
        trajetSelects.forEach(select => {
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="">Sélectionner un trajet</option>';
                allTrajets.forEach(trajet => {
                    const option = document.createElement('option');
                    option.value = trajet.id;
                    option.textContent = trajet.nom;
                    if (trajet.id.toString() === currentValue) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });
            }
        });

        // Remplir les options de chauffeurs
        const chauffeurSelects = document.querySelectorAll('#scheduleChauffeur, #editScheduleChauffeur');
        chauffeurSelects.forEach(select => {
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="">Sélectionner un chauffeur</option>';
                allChauffeurs.forEach(chauffeur => {
                    const option = document.createElement('option');
                    option.value = chauffeur.id;
                    option.textContent = `${chauffeur.prenom} ${chauffeur.nom}`;
                    if (chauffeur.id.toString() === currentValue) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });
            }
        });

        // Remplir les options de bus
        const busSelects = document.querySelectorAll('#scheduleBus, #editScheduleBus');
        busSelects.forEach(select => {
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="">Sélectionner un bus</option>';
                allBus.forEach(bus => {
                    const option = document.createElement('option');
                    option.value = bus.id;
                    option.textContent = bus.matricule;
                    if (bus.id.toString() === currentValue) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });
            }
        });
    }

    function displayTrajets(trajets) {
        const container = document.getElementById('trajetsContainer');
        
        if (!container) {
            console.error('Container trajetsContainer non trouvé');
            return;
        }
        
        if (trajets.length === 0) {
            displayEmptyTrajets();
            return;
        }

        // Créer la grille s'il n'y en a pas
        let grid = document.getElementById('trajetsGrid');
        if (!grid) {
            grid = document.createElement('div');
            grid.id = 'trajetsGrid';
            grid.className = 'grid grid-2';
            container.innerHTML = '';
            container.appendChild(grid);
        } else {
            grid.innerHTML = '';
        }
        
        trajets.forEach(trajet => {
            const trajetCard = createTrajetCard(trajet);
            grid.appendChild(trajetCard);
        });
    }

    function createTrajetCard(trajet) {
        const card = document.createElement('div');
        card.className = 'route-card';
        
        // Formater la durée
        const heures = Math.floor(trajet.duree_estime / 60);
        const minutes = trajet.duree_estime % 60;
        const dureeFormatee = `${heures}h ${minutes}min`;
        
        card.innerHTML = `
            <div class="route-header">
                <div class="route-name">${trajet.nom}</div>
                <div class="route-price">${parseInt(trajet.prix).toLocaleString()} FCFA</div>
            </div>
            <div class="route-details">
                <div class="route-detail">
                    <strong>Départ</strong>
                    <span>${trajet.point_depart}</span>
                </div>
                <div class="route-detail">
                    <strong>Arrivée</strong>
                    <span>${trajet.point_arrivee}</span>
                </div>
                <div class="route-detail">
                    <strong>Durée</strong>
                    <span>${dureeFormatee}</span>
                </div>
            </div>
            <div class="route-actions">
                <button class="btn btn-secondary" style="padding: 8px;" onclick="viewTrajetDetails(${trajet.id})" title="Voir détails">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-secondary" style="padding: 8px;" onclick="editTrajet(${trajet.id})" title="Modifier">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" style="padding: 8px;" onclick="deleteTrajet(${trajet.id})" title="Supprimer">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return card;
    }

    function displayEmptyTrajets() {
        const container = document.getElementById('trajetsContainer');
        if (!container) {
            console.error('Container trajetsContainer non trouvé');
            return;
        }
        
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-route"></i>
                <h3>Aucun trajet trouvé</h3>
                <p>Commencez par créer votre premier trajet.</p>
                <button class="btn btn-primary" onclick="openModal('newTrajetModal')">
                    <i class="fas fa-plus"></i>
                    Créer un trajet
                </button>
            </div>
        `;
    }

    function displayPlannings(plannings) {
        const tbody = document.getElementById('planningsTableBody');
        
        if (!tbody) {
            console.error('Element planningsTableBody non trouvé');
            return;
        }
        
        if (plannings.length === 0) {
            displayEmptyPlannings();
            return;
        }

        tbody.innerHTML = '';
        
        plannings.forEach(planning => {
            const row = createPlanningRow(planning);
            tbody.appendChild(row);
        });
    }

    function createPlanningRow(planning) {
        const row = document.createElement('tr');
        
        // Trouver les données associées
        const trajet = allTrajets.find(t => t.id === planning.trajet_id);
        const chauffeur = allChauffeurs.find(c => c.id === planning.chauffeur_id);
        const bus = allBus.find(b => b.id === planning.bus_id);
        
        // Formater la date
        const dateFormatee = new Date(planning.date).toLocaleDateString('fr-FR');
        
        row.innerHTML = `
            <td>${dateFormatee}</td>
            <td><strong>${planning.heure}</strong></td>
            <td>${trajet ? trajet.nom : 'Trajet inconnu'}</td>
            <td>${chauffeur ? `${chauffeur.prenom} ${chauffeur.nom}` : 'Chauffeur inconnu'}</td>
            <td>${bus ? bus.id : 'Bus inconnu'}</td>
            <td><span class="badge badge-${planning.valide ? 'success' : 'warning'}">${planning.valide ? 'Validé' : 'En attente'}</span></td>
            <td>
                <div class="flex gap-8px">
                    <button class="btn btn-secondary" style="padding: 8px;" onclick="viewPlanningDetails(${planning.id})" title="Voir détails">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-secondary" style="padding: 8px;" onclick="editPlanning(${planning.id})" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" style="padding: 8px;" onclick="deletePlanning(${planning.id})" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        return row;
    }

    function displayEmptyPlannings() {
        const tbody = document.getElementById('planningsTableBody');
        if (!tbody) {
            console.error('Element planningsTableBody non trouvé');
            return;
        }
        
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--dark-gray); padding: 40px;">
                    <i class="fas fa-calendar-alt" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                    Aucun planning trouvé
                    <br>
                    <button class="btn btn-primary" onclick="openModal('newScheduleModal')" style="margin-top: 16px;">
                        <i class="fas fa-plus"></i>
                        Créer un planning
                    </button>
                </td>
            </tr>
        `;
    }

    function showTrajetsLoading(show) {
        const spinner = document.getElementById('trajetsLoadingSpinner');
        const container = document.getElementById('trajetsContainer');
        if (spinner) {
            spinner.style.display = show ? 'flex' : 'none';
        }
        if (container) {
            container.style.display = show ? 'none' : 'block';
        }
    }

    function showPlanningsLoading(show) {
        const spinner = document.getElementById('planningsLoadingSpinner');
        const container = document.getElementById('planningsContainer');
        if (spinner) {
            spinner.style.display = show ? 'flex' : 'none';
        }
        if (container) {
            container.style.display = show ? 'none' : 'block';
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
                // Remettre la date d'aujourd'hui
                const dateInput = form.querySelector('#scheduleDate');
                if (dateInput) {
                    const today = new Date().toISOString().split('T')[0];
                    dateInput.value = today;
                }
            }
        }
    }

    // Gestion des trajets
    async function handleAddTrajet(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const trajetData = {
            nom: formData.get('nom').trim(),
            point_depart: formData.get('point_depart').trim(),
            point_arrivee: formData.get('point_arrivee').trim(),
            duree_estime: formData.get('duree_estime'),
            prix: formData.get('prix')
        };

        if (!validateTrajetData(trajetData)) {
            return;
        }

        // Utiliser l'ID du bouton pour le trouver de manière fiable
        const submitButton = document.getElementById('newTrajetSubmitBtn');

        if (!submitButton) {
            console.error('Bouton de soumission non trouvé');
            showMessage('Erreur d\'interface: bouton non trouvé', 'error');
            return;
        }

        const stopLoading = showButtonLoading(submitButton);

        try {
            const result = await trajetsService.registerTrajet(trajetData);
            console.log('Trajet créé avec succès:', result);
            
            closeModal('newTrajetModal');
            showMessage('Trajet créé avec succès !', 'success');
            await loadTrajets();
            updateStats();
            populateSelectOptions();
            
        } catch (error) {
            console.error('Erreur lors de la création:', error);
            showMessage('Erreur lors de la création du trajet: ' + error.message, 'error');
        } finally {
            stopLoading();
        }
    }

    async function handleEditTrajet(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const trajetId = formData.get('trajetId');
        const trajetData = {
            nom: formData.get('nom').trim(),
            point_depart: formData.get('point_depart').trim(),
            point_arrivee: formData.get('point_arrivee').trim(),
            duree_estime: formData.get('duree_estime'),
            prix: formData.get('prix')
        };

        if (!validateTrajetData(trajetData)) {
            return;
        }

        // Utiliser l'ID du bouton pour le trouver de manière fiable
        const submitButton = document.getElementById('editTrajetSubmitBtn');

        if (!submitButton) {
            console.error('Bouton de soumission non trouvé');
            showMessage('Erreur d\'interface: bouton non trouvé', 'error');
            return;
        }

        const stopLoading = showButtonLoading(submitButton);

        try {
            const result = await trajetsService.updateTrajet(trajetId, trajetData);
            console.log('Trajet modifié avec succès:', result);
            
            closeModal('editTrajetModal');
            showMessage('Trajet modifié avec succès !', 'success');
            await loadTrajets();
            updateStats();
            populateSelectOptions();
            
        } catch (error) {
            console.error('Erreur lors de la modification:', error);
            showMessage('Erreur lors de la modification du trajet: ' + error.message, 'error');
        } finally {
            stopLoading();
        }
    }

    function validateTrajetData(data) {
        if (!data.nom || !data.point_depart || !data.point_arrivee || !data.duree_estime || !data.prix) {
            showMessage('Tous les champs sont obligatoires.', 'error');
            return false;
        }

        if (parseInt(data.duree_estime) < 30) {
            showMessage('La durée doit être d\'au moins 30 minutes.', 'error');
            return false;
        }

        if (parseInt(data.prix) < 500) {
            showMessage('Le prix doit être d\'au moins 500 FCFA.', 'error');
            return false;
        }

        return true;
    }

    // Gestion des plannings
    async function handleAddPlanning(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const planningData = {
            date: formData.get('date'),
            heure: formData.get('heure'),
            trajet_id: formData.get('trajet_id'),
            chauffeur_id: formData.get('chauffeur_id'),
            bus_id: formData.get('bus_id'),
            valide: formData.get('valide') === 'on'
        };

        if (!validatePlanningData(planningData)) {
            return;
        }

        // Utiliser l'ID du bouton pour le trouver de manière fiable
        const submitButton = document.getElementById('newPlanningSubmitBtn');

        if (!submitButton) {
            console.error('Bouton de soumission non trouvé');
            showMessage('Erreur d\'interface: bouton non trouvé', 'error');
            return;
        }

        const stopLoading = showButtonLoading(submitButton);

        try {
            const result = await planningsService.registerPlanning(planningData);
            console.log('Planning créé avec succès:', result);
            
            closeModal('newScheduleModal');
            showMessage('Planning créé avec succès !', 'success');
            await loadPlannings();
            updateStats();
            
        } catch (error) {
            console.error('Erreur lors de la création:', error);
            showMessage('Erreur lors de la création du planning: ' + error.message, 'error');
        } finally {
            stopLoading();
        }
    }

    async function handleEditPlanning(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const planningId = formData.get('planningId');
        const planningData = {
            date: formData.get('date'),
            heure: formData.get('heure'),
            trajet_id: formData.get('trajet_id'),
            chauffeur_id: formData.get('chauffeur_id'),
            bus_id: formData.get('bus_id'),
            valide: formData.get('valide') === 'on'
        };

        if (!validatePlanningData(planningData)) {
            return;
        }

        // Utiliser l'ID du bouton pour le trouver de manière fiable
        const submitButton = document.getElementById('editPlanningSubmitBtn');

        if (!submitButton) {
            console.error('Bouton de soumission non trouvé');
            showMessage('Erreur d\'interface: bouton non trouvé', 'error');
            return;
        }

        const stopLoading = showButtonLoading(submitButton);

        try {
            const result = await planningsService.updatePlanning(planningId, planningData);
            console.log('Planning modifié avec succès:', result);
            
            closeModal('editPlanningModal');
            showMessage('Planning modifié avec succès !', 'success');
            await loadPlannings();
            updateStats();
            
        } catch (error) {
            console.error('Erreur lors de la modification:', error);
            showMessage('Erreur lors de la modification du planning: ' + error.message, 'error');
        } finally {
            stopLoading();
        }
    }

    function validatePlanningData(data) {
        if (!data.date || !data.heure || !data.trajet_id || !data.chauffeur_id || !data.bus_id) {
            showMessage('Tous les champs sont obligatoires.', 'error');
            return false;
        }

        return true;
    }

    // Fonctions pour les actions
    function viewTrajetDetails(trajetId) {
        const trajet = allTrajets.find(t => t.id === trajetId);
        if (!trajet) {
            showMessage('Trajet non trouvé.', 'error');
            return;
        }

        const heures = Math.floor(trajet.duree_estime / 60);
        const minutes = trajet.duree_estime % 60;
        const dureeFormatee = `${heures}h ${minutes}min`;

        alert(`Détails du trajet:
        
Nom: ${trajet.nom}
Départ: ${trajet.point_depart}
Arrivée: ${trajet.point_arrivee}
Durée: ${dureeFormatee}
Prix: ${parseInt(trajet.prix).toLocaleString()} FCFA`);
    }

    function editTrajet(trajetId) {
        const trajet = allTrajets.find(t => t.id === trajetId);
        if (!trajet) {
            showMessage('Trajet non trouvé.', 'error');
            return;
        }

        // Remplir le formulaire de modification
        const editTrajetIdEl = document.getElementById('editTrajetId');
        const editTrajetNameEl = document.getElementById('editTrajetName');
        const editPointDepartEl = document.getElementById('editPointDepart');
        const editPointArriveeEl = document.getElementById('editPointArrivee');
        const editDureeEstimeEl = document.getElementById('editDureeEstime');
        const editPrixEl = document.getElementById('editPrix');

        if (editTrajetIdEl) editTrajetIdEl.value = trajet.id;
        if (editTrajetNameEl) editTrajetNameEl.value = trajet.nom;
        if (editPointDepartEl) editPointDepartEl.value = trajet.point_depart;
        if (editPointArriveeEl) editPointArriveeEl.value = trajet.point_arrivee;
        if (editDureeEstimeEl) editDureeEstimeEl.value = trajet.duree_estime;
        if (editPrixEl) editPrixEl.value = trajet.prix;

        openModal('editTrajetModal');
    }

    function deleteTrajet(trajetId) {
        const trajet = allTrajets.find(t => t.id === trajetId);
        if (!trajet) {
            showMessage('Trajet non trouvé.', 'error');
            return;
        }

        currentTrajetToDelete = trajet;
        const deleteTrajetNameEl = document.getElementById('deleteTrajetName');
        if (deleteTrajetNameEl) {
            deleteTrajetNameEl.textContent = trajet.nom;
        }
        openModal('deleteTrajetModal');
    }

    async function confirmDeleteTrajet() {
        if (!currentTrajetToDelete) return;

        try {
            await trajetsService.deleteTrajet(currentTrajetToDelete.id);
            
            showMessage(`Trajet "${currentTrajetToDelete.nom}" supprimé avec succès !`, 'success');
            closeModal('deleteTrajetModal');
            
            await loadTrajets();
            await loadPlannings(); // Recharger aussi les plannings
            updateStats();
            populateSelectOptions();
            
        } catch (error) {
            showMessage('Erreur lors de la suppression: ' + error.message, 'error');
        } finally {
            currentTrajetToDelete = null;
        }
    }

    function viewPlanningDetails(planningId) {
        const planning = allPlannings.find(p => p.id === planningId);
        if (!planning) {
            showMessage('Planning non trouvé.', 'error');
            return;
        }

        const trajet = allTrajets.find(t => t.id === planning.trajet_id);
        const chauffeur = allChauffeurs.find(c => c.id === planning.chauffeur_id);
        const bus = allBus.find(b => b.id === planning.bus_id);

        const dateFormatee = new Date(planning.date).toLocaleDateString('fr-FR');

        alert(`Détails du planning:
        
Date: ${dateFormatee}
Heure: ${planning.heure}
Trajet: ${trajet ? trajet.nom : 'Inconnu'}
Chauffeur: ${chauffeur ? `${chauffeur.prenom} ${chauffeur.nom}` : 'Inconnu'}
Bus: ${bus ? bus.matricule : 'Inconnu'}
Statut: ${planning.valide ? 'Validé' : 'En attente'}`);
    }

    function editPlanning(planningId) {
        const planning = allPlannings.find(p => p.id === planningId);
        if (!planning) {
            showMessage('Planning non trouvé.', 'error');
            return;
        }

        // Remplir le formulaire de modification
        const editPlanningIdEl = document.getElementById('editPlanningId');
        if (editPlanningIdEl) {
            editPlanningIdEl.value = planning.id;
        }
        
        const editPlanningContentEl = document.getElementById('editPlanningContent');
        if (editPlanningContentEl) {
            editPlanningContentEl.innerHTML = `
                <div class="form-group">
                    <label for="editScheduleDate">Date</label>
                    <input type="date" id="editScheduleDate" name="date" value="${planning.date}" required />
                </div>
                <div class="form-group">
                    <label for="editScheduleHeure">Heure de départ</label>
                    <input type="time" id="editScheduleHeure" name="heure" value="${planning.heure}" required />
                </div>
                <div class="form-group">
                    <label for="editScheduleTrajet">Trajet</label>
                    <select id="editScheduleTrajet" name="trajet_id" required>
                        <!-- Options chargées par populateSelectOptions -->
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="editScheduleChauffeur">Chauffeur</label>
                        <select id="editScheduleChauffeur" name="chauffeur_id" required>
                            <!-- Options chargées par populateSelectOptions -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editScheduleBus">Bus</label>
                        <select id="editScheduleBus" name="bus_id" required>
                            <!-- Options chargées par populateSelectOptions -->
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="valide" id="editScheduleValide" ${planning.valide ? 'checked' : ''}>
                        Planning validé
                    </label>
                </div>
            `;

            // Pré-sélectionner les valeurs après un délai
            setTimeout(() => {
                const editScheduleTrajetEl = document.getElementById('editScheduleTrajet');
                const editScheduleChauffeurEl = document.getElementById('editScheduleChauffeur');
                const editScheduleBusEl = document.getElementById('editScheduleBus');

                if (editScheduleTrajetEl) editScheduleTrajetEl.value = planning.trajet_id;
                if (editScheduleChauffeurEl) editScheduleChauffeurEl.value = planning.chauffeur_id;
                if (editScheduleBusEl) editScheduleBusEl.value = planning.bus_id;
                
                populateSelectOptions();
            }, 100);
        }

        openModal('editPlanningModal');
    }

    function deletePlanning(planningId) {
        const planning = allPlannings.find(p => p.id === planningId);
        if (!planning) {
            showMessage('Planning non trouvé.', 'error');
            return;
        }

        const trajet = allTrajets.find(t => t.id === planning.trajet_id);
        const planningName = `${planning.heure} - ${trajet ? trajet.nom : 'Trajet inconnu'}`;

        currentPlanningToDelete = planning;
        const deletePlanningNameEl = document.getElementById('deletePlanningName');
        if (deletePlanningNameEl) {
            deletePlanningNameEl.textContent = planningName;
        }
        openModal('deletePlanningModal');
    }

    async function confirmDeletePlanning() {
        if (!currentPlanningToDelete) return;

        try {
            await planningsService.deletePlanning(currentPlanningToDelete.id);
            
            showMessage('Planning supprimé avec succès !', 'success');
            closeModal('deletePlanningModal');
            
            await loadPlannings();
            updateStats();
            
        } catch (error) {
            showMessage('Erreur lors de la suppression: ' + error.message, 'error');
        } finally {
            currentPlanningToDelete = null;
        }
    }

    function exportData() {
        if (allTrajets.length === 0 && allPlannings.length === 0) {
            showMessage('Aucune donnée à exporter.', 'error');
            return;
        }

        // Export simple des trajets
        const headers = ['Type', 'ID', 'Nom/Info', 'Départ', 'Arrivée', 'Durée', 'Prix'];
        const csvContent = [
            headers.join(','),
            // Trajets
            ...allTrajets.map(trajet => [
                'Trajet',
                trajet.id,
                `"${trajet.nom}"`,
                `"${trajet.point_depart}"`,
                `"${trajet.point_arrivee}"`,
                trajet.duree_estime,
                trajet.prix
            ].join(',')),
            // Plannings
            ...allPlannings.map(planning => {
                const trajet = allTrajets.find(t => t.id === planning.trajet_id);
                return [
                    'Planning',
                    planning.id,
                    `"${planning.date} ${planning.heure}"`,
                    `"${trajet ? trajet.nom : 'Inconnu'}"`,
                    planning.valide ? 'Validé' : 'En attente',
                    '',
                    ''
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `trajets_plannings_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        showMessage('Export réussi !', 'success');
    }

    // Exposer les fonctions globalement
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.loadTrajets = loadTrajets;
    window.viewTrajetDetails = viewTrajetDetails;
    window.editTrajet = editTrajet;
    window.deleteTrajet = deleteTrajet;
    window.confirmDeleteTrajet = confirmDeleteTrajet;
    window.viewPlanningDetails = viewPlanningDetails;
    window.editPlanning = editPlanning;
    window.deletePlanning = deletePlanning;
    window.confirmDeletePlanning = confirmDeletePlanning;
    window.exportData = exportData;
});