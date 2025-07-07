// assets/js/alertes.js
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier l'authentification
    if (!authService.isAuthenticated()) {
        window.location.href = '../index.html';
        return;
    }

    // Variables globales
    let allAlertes = [];
    let allBus = [];
    let filteredAlertes = [];
    let currentAlerteToDelete = null;

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
            await waitForElement('#alertesContainer');
            await waitForElement('#alertesTableBody');
            
            // Vérifier que les éléments statistiques existent
            const statsElements = [
                'totalAlertes',
                'alertesOuvertes', 
                'alertesEnCours',
                'alertesResolues'
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
            setupFloatingLabels();
            await loadAllData();
            
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            showMessage('Erreur lors de l\'initialisation de la page', 'error');
        }
    }

    function setupEventListeners() {
        // Formulaires - Vérifier l'existence avant d'ajouter les listeners
        const newAlerteForm = document.getElementById('newAlerteForm');
        if (newAlerteForm) {
            newAlerteForm.addEventListener('submit', handleAddAlerte);
        }

        const editAlerteForm = document.getElementById('editAlerteForm');
        if (editAlerteForm) {
            editAlerteForm.addEventListener('submit', handleEditAlerte);
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
        const alerteDateInput = document.getElementById('alerteDate');
        if (alerteDateInput) {
            const today = new Date().toISOString().split('T')[0];
            alerteDateInput.value = today;
        }
    }

    function setupFloatingLabels() {
        // Gestion des floating labels pour les selects
        document.querySelectorAll('.floating-input select').forEach(select => {
            // Trigger l'événement change pour les selects avec valeur initiale
            if (select.value && select.value !== '') {
                activateFloatingLabel(select);
            }

            select.addEventListener('change', function() {
                if (this.value && this.value !== '') {
                    activateFloatingLabel(this);
                } else {
                    deactivateFloatingLabel(this);
                }
            });
        });

        // Gestion des floating labels pour les inputs
        document.querySelectorAll('.floating-input input').forEach(input => {
            // Trigger pour les inputs avec valeur initiale
            if (input.value && input.value !== '') {
                activateFloatingLabel(input);
            }

            input.addEventListener('input', function() {
                if (this.value && this.value !== '') {
                    activateFloatingLabel(this);
                } else {
                    deactivateFloatingLabel(this);
                }
            });

            input.addEventListener('focus', function() {
                if (this.value && this.value !== '') {
                    activateFloatingLabel(this);
                }
            });
        });

        // Gestion des floating labels pour les textareas
        document.querySelectorAll('.floating-input textarea').forEach(textarea => {
            // Trigger pour les textareas avec valeur initiale
            if (textarea.value && textarea.value !== '') {
                activateFloatingLabelTextarea(textarea);
            }

            textarea.addEventListener('input', function() {
                if (this.value && this.value !== '') {
                    activateFloatingLabelTextarea(this);
                } else {
                    deactivateFloatingLabelTextarea(this);
                }
            });

            textarea.addEventListener('focus', function() {
                if (this.value && this.value !== '') {
                    activateFloatingLabelTextarea(this);
                }
            });
        });
    }

    function activateFloatingLabel(element) {
        const label = element.nextElementSibling;
        if (label && label.tagName === 'LABEL') {
            label.style.top = '-8px';
            label.style.left = '45px';
            label.style.fontSize = '12px';
            label.style.fontWeight = '600';
            label.style.color = 'var(--primary-orange)';
            label.style.background = 'var(--primary-white)';
            label.style.padding = '0 8px';
            label.style.zIndex = '10';
            label.style.transform = 'none';
        }
    }

    function deactivateFloatingLabel(element) {
        const label = element.nextElementSibling;
        if (label && label.tagName === 'LABEL') {
            label.style.top = '50%';
            label.style.left = '50px';
            label.style.fontSize = '16px';
            label.style.fontWeight = 'normal';
            label.style.color = 'var(--dark-gray)';
            label.style.background = 'transparent';
            label.style.padding = '0';
            label.style.transform = 'translateY(-50%)';
            label.style.zIndex = 'auto';
        }
    }

    function activateFloatingLabelTextarea(element) {
        const label = element.nextElementSibling;
        if (label && label.tagName === 'LABEL') {
            label.style.top = '-8px';
            label.style.left = '45px';
            label.style.fontSize = '12px';
            label.style.fontWeight = '600';
            label.style.color = 'var(--primary-orange)';
            label.style.background = 'var(--primary-white)';
            label.style.padding = '0 8px';
            label.style.zIndex = '10';
            label.style.transform = 'none';
        }
    }

    function deactivateFloatingLabelTextarea(element) {
        const label = element.nextElementSibling;
        if (label && label.tagName === 'LABEL') {
            label.style.top = '30px';
            label.style.left = '50px';
            label.style.fontSize = '16px';
            label.style.fontWeight = 'normal';
            label.style.color = 'var(--dark-gray)';
            label.style.background = 'transparent';
            label.style.padding = '0';
            label.style.transform = 'none';
            label.style.zIndex = 'auto';
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
                loadAlertes(),
                loadBus()
            ]);
            
            // Vérifier s'il y a eu des erreurs
            const errors = results.filter(result => result.status === 'rejected');
            if (errors.length > 0) {
                console.warn('Certaines données n\'ont pas pu être chargées:', errors);
            }
            
            updateStats();
            populateSelectOptions();
            filteredAlertes = [...allAlertes];
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            showMessage('Erreur lors du chargement des données', 'error');
        }
    }

    async function loadAlertes() {
        console.log('Chargement des alertes...');
        showAlertesLoading(true);
        
        try {
            const response = await alertesService.getAlertes();
            allAlertes = Array.isArray(response) ? response : (response.alertes || response.data || []);
            console.log('Alertes chargées:', allAlertes);
            displayAlertes(allAlertes);
            displayAlertesTable(allAlertes);
        } catch (error) {
            console.error('Erreur lors du chargement des alertes:', error);
            showMessage('Erreur lors du chargement des alertes: ' + error.message, 'error');
            displayEmptyAlertes();
        } finally {
            showAlertesLoading(false);
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
        const totalAlertesEl = document.getElementById('totalAlertes');
        const alertesOuvertesEl = document.getElementById('alertesOuvertes');
        const alertesEnCoursEl = document.getElementById('alertesEnCours');
        const alertesResoluesEl = document.getElementById('alertesResolues');

        if (totalAlertesEl) totalAlertesEl.textContent = allAlertes.length;
        
        const ouvertes = allAlertes.filter(a => a.statut === 'ouverte').length;
        const enCours = allAlertes.filter(a => a.statut === 'en_cours').length;
        const resolues = allAlertes.filter(a => a.statut === 'resolue').length;
        
        if (alertesOuvertesEl) alertesOuvertesEl.textContent = ouvertes;
        if (alertesEnCoursEl) alertesEnCoursEl.textContent = enCours;
        if (alertesResoluesEl) alertesResoluesEl.textContent = resolues;
    }

    function populateSelectOptions() {
        // Remplir les options de bus dans tous les selects
        const busSelects = document.querySelectorAll('#alerteBus, #editAlerteBus, #filterBus');
        busSelects.forEach(select => {
            if (select) {
                const currentValue = select.value;
                const isFilter = select.id === 'filterBus';
                
                select.innerHTML = isFilter ? '<option value="">Tous les bus</option>' : '<option value="">Sélectionner un bus</option>';
                
                allBus.forEach(bus => {
                    const option = document.createElement('option');
                    option.value = bus.id;
                    option.textContent = bus.matricule;
                    if (bus.id.toString() === currentValue) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });

                // Trigger l'événement change pour les floating labels
                if (select.value && select.value !== '') {
                    select.dispatchEvent(new Event('change'));
                }
            }
        });
    }

    function displayAlertes(alertes) {
        const container = document.getElementById('alertesContainer');
        
        if (!container) {
            console.error('Container alertesContainer non trouvé');
            return;
        }
        
        if (alertes.length === 0) {
            displayEmptyAlertes();
            return;
        }

        // Créer la grille s'il n'y en a pas
        let grid = document.getElementById('alertesGrid');
        if (!grid) {
            grid = document.createElement('div');
            grid.id = 'alertesGrid';
            grid.className = 'grid grid-2';
            container.innerHTML = '';
            container.appendChild(grid);
        } else {
            grid.innerHTML = '';
        }
        
        // Trier par priorité et date
        const sortedAlertes = alertes.sort((a, b) => {
            const priorityOrder = { 'panne': 3, 'entretien': 2, 'info': 1 };
            const statutOrder = { 'ouverte': 3, 'en_cours': 2, 'resolue': 1 };
            
            const priorityDiff = (priorityOrder[b.type] || 0) - (priorityOrder[a.type] || 0);
            if (priorityDiff !== 0) return priorityDiff;
            
            const statutDiff = (statutOrder[b.statut] || 0) - (statutOrder[a.statut] || 0);
            if (statutDiff !== 0) return statutDiff;
            
            return new Date(b.date_signalement) - new Date(a.date_signalement);
        });
        
        sortedAlertes.forEach(alerte => {
            const alerteCard = createAlerteCard(alerte);
            grid.appendChild(alerteCard);
        });
    }

    function createAlerteCard(alerte) {
        const card = document.createElement('div');
        card.className = `alert-card ${alerte.type} priority-${alertesService.getPriorityLevel(alerte.type)}`;
        
        // Trouver le bus associé
        const bus = allBus.find(b => b.id === alerte.bus_id);
        const busMatricule = bus ? bus.id : 'Bus inconnu';
        
        // Formater la date
        const dateFormatee = new Date(alerte.date_signalement).toLocaleDateString('fr-FR');
        
        card.innerHTML = `
            <div class="alert-header">
                <div class="alert-title">
                    <i class="${alertesService.getTypeIcon(alerte.type)}"></i>
                    ${alertesService.getTypeLabel(alerte.type)}
                </div>
                <span class="badge badge-${alertesService.getStatutBadgeClass(alerte.statut).replace('badge-', '')}">
                    <i class="${alertesService.getStatutIcon(alerte.statut)}"></i>
                    ${alertesService.getStatutLabel(alerte.statut)}
                </span>
            </div>
            <div class="alert-meta">
                <div class="alert-meta-item">
                    <strong>Bus</strong>
                    <span>${busMatricule}</span>
                </div>
                <div class="alert-meta-item">
                    <strong>Date</strong>
                    <span>${dateFormatee}</span>
                </div>
                <div class="alert-meta-item">
                    <strong>Priorité</strong>
                    <span>${alertesService.getPriorityLevel(alerte.type).charAt(0).toUpperCase() + alertesService.getPriorityLevel(alerte.type).slice(1)}</span>
                </div>
            </div>
            <div class="alert-description">
                ${alerte.description.length > 100 ? alerte.description.substring(0, 100) + '...' : alerte.description}
            </div>
            <div class="alert-actions">
                <button  class="btn btn-primary" style="padding: 8px;" onclick="viewAlerteDetails(${alerte.id})" title="Voir détails">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-secondary" style="padding: 8px;" onclick="editAlerte(${alerte.id})" title="Modifier">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" style="padding: 8px;" onclick="deleteAlerte(${alerte.id})" title="Supprimer">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return card;
    }

    function displayEmptyAlertes() {
        const container = document.getElementById('alertesContainer');
        if (!container) {
            console.error('Container alertesContainer non trouvé');
            return;
        }
        
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Aucune alerte trouvée</h3>
                <p>Aucune alerte n'a été signalée pour le moment.</p>
                <button class="btn btn-primary" onclick="openModal('newAlerteModal')">
                    <i class="fas fa-plus"></i>
                    Créer une alerte
                </button>
            </div>
        `;
    }

    function displayAlertesTable(alertes) {
        const tbody = document.getElementById('alertesTableBody');
        
        if (!tbody) {
            console.error('Element alertesTableBody non trouvé');
            return;
        }
        
        if (alertes.length === 0) {
            displayEmptyTable();
            return;
        }

        tbody.innerHTML = '';
        
        alertes.forEach(alerte => {
            const row = createAlerteRow(alerte);
            tbody.appendChild(row);
        });
    }

    function createAlerteRow(alerte) {
        const row = document.createElement('tr');
        
        // Trouver le bus associé
        const bus = allBus.find(b => b.id === alerte.bus_id);
        const busMatricule = bus ? bus.id : 'Bus inconnu';
        
        // Formater la date
        const dateFormatee = new Date(alerte.date_signalement).toLocaleDateString('fr-FR');
        
        row.innerHTML = `
            <td>${dateFormatee}</td>
            <td><strong>${busMatricule}</strong></td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="${alertesService.getTypeIcon(alerte.type)}" style="color: var(--primary-orange);"></i>
                    ${alertesService.getTypeLabel(alerte.type)}
                </div>
            </td>
            <td>
                <span class="badge badge-${alertesService.getStatutBadgeClass(alerte.statut).replace('badge-', '')}">
                    <i class="${alertesService.getStatutIcon(alerte.statut)}"></i>
                    ${alertesService.getStatutLabel(alerte.statut)}
                </span>
            </td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${alerte.description}">
                ${alerte.description}
            </td>
            <td>
                <div class="flex gap-8px">
                    <button class="btn btn-primary" style="padding: 8px;" onclick="viewAlerteDetails(${alerte.id})" title="Voir détails">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-secondary" style="padding: 8px;" onclick="editAlerte(${alerte.id})" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" style="padding: 8px;" onclick="deleteAlerte(${alerte.id})" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        return row;
    }

    function displayEmptyTable() {
        const tbody = document.getElementById('alertesTableBody');
        if (!tbody) {
            console.error('Element alertesTableBody non trouvé');
            return;
        }
        
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--dark-gray); padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                    Aucune alerte trouvée
                    <br>
                    <button class="btn btn-primary" onclick="openModal('newAlerteModal')" style="margin-top: 16px;">
                        <i class="fas fa-plus"></i>
                        Créer une alerte
                    </button>
                </td>
            </tr>
        `;
    }

    function showAlertesLoading(show) {
        const spinner = document.getElementById('alertesLoadingSpinner');
        const tableSpinner = document.getElementById('tableLoadingSpinner');
        const container = document.getElementById('alertesContainer');
        const tableContainer = document.getElementById('tableContainer');
        
        if (spinner) {
            spinner.style.display = show ? 'flex' : 'none';
        }
        if (tableSpinner) {
            tableSpinner.style.display = show ? 'flex' : 'none';
        }
        if (container) {
            container.style.display = show ? 'none' : 'block';
        }
        if (tableContainer) {
            tableContainer.style.display = show ? 'none' : 'block';
        }
    }

    // Gestion des modales
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Réactiver les floating labels après ouverture de la modale
            setTimeout(() => {
                setupFloatingLabels();
            }, 100);
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
                const dateInput = form.querySelector('#alerteDate, #editAlerteDate');
                if (dateInput && modalId === 'newAlerteModal') {
                    const today = new Date().toISOString().split('T')[0];
                    dateInput.value = today;
                }
                
                // Réinitialiser les floating labels
                form.querySelectorAll('.floating-input label').forEach(label => {
                    const input = label.previousElementSibling;
                    if (input && input.tagName === 'TEXTAREA') {
                        // Labels pour textarea
                        label.style.top = '30px';
                        label.style.left = '50px';
                        label.style.fontSize = '16px';
                        label.style.fontWeight = 'normal';
                        label.style.color = 'var(--dark-gray)';
                        label.style.background = 'transparent';
                        label.style.padding = '0';
                        label.style.transform = 'none';
                        label.style.zIndex = 'auto';
                    } else {
                        // Labels pour input et select
                        label.style.top = '50%';
                        label.style.left = '50px';
                        label.style.fontSize = '16px';
                        label.style.fontWeight = 'normal';
                        label.style.color = 'var(--dark-gray)';
                        label.style.background = 'transparent';
                        label.style.padding = '0';
                        label.style.transform = 'translateY(-50%)';
                        label.style.zIndex = 'auto';
                    }
                });
            }
        }
    }

    // Gestion des alertes
    async function handleAddAlerte(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const alerteData = {
            bus_id: formData.get('bus_id'),
            type: formData.get('type'),
            statut: formData.get('statut'),
            description: formData.get('description').trim(),
            date_signalement: formData.get('date_signalement')
        };

        if (!validateAlerteData(alerteData)) {
            return;
        }

        // Utiliser l'ID du bouton pour le trouver de manière fiable
        const submitButton = document.getElementById('newAlerteSubmitBtn');
        
        if (!submitButton) {
            console.error('Bouton de soumission non trouvé');
            showMessage('Erreur d\'interface: bouton non trouvé', 'error');
            return;
        }

        const stopLoading = showButtonLoading(submitButton);

        try {
            const result = await alertesService.registerAlerte(alerteData);
            console.log('Alerte créée avec succès:', result);
            
            closeModal('newAlerteModal');
            showMessage('Alerte créée avec succès !', 'success');
            await loadAlertes();
            updateStats();
            
        } catch (error) {
            console.error('Erreur lors de la création:', error);
            showMessage('Erreur lors de la création de l\'alerte: ' + error.message, 'error');
        } finally {
            stopLoading();
        }
    }

    async function handleEditAlerte(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const alerteId = formData.get('alerteId');
        const alerteData = {
            bus_id: formData.get('bus_id'),
            type: formData.get('type'),
            statut: formData.get('statut'),
            description: formData.get('description').trim(),
            date_signalement: formData.get('date_signalement')
        };

        if (!validateAlerteData(alerteData)) {
            return;
        }

        // Utiliser l'ID du bouton pour le trouver de manière fiable
        const submitButton = document.getElementById('editAlerteSubmitBtn');
        
        if (!submitButton) {
            console.error('Bouton de soumission non trouvé');
            showMessage('Erreur d\'interface: bouton non trouvé', 'error');
            return;
        }

        const stopLoading = showButtonLoading(submitButton);

        try {
            const result = await alertesService.updateAlerte(alerteId, alerteData);
            console.log('Alerte modifiée avec succès:', result);
            
            closeModal('editAlerteModal');
            showMessage('Alerte modifiée avec succès !', 'success');
            await loadAlertes();
            updateStats();
            applyFilters();
            
        } catch (error) {
            console.error('Erreur lors de la modification:', error);
            showMessage('Erreur lors de la modification de l\'alerte: ' + error.message, 'error');
        } finally {
            stopLoading();
        }
    }

    function validateAlerteData(data) {
        if (!data.bus_id || !data.type || !data.statut || !data.description || !data.date_signalement) {
            showMessage('Tous les champs sont obligatoires.', 'error');
            return false;
        }

        if (data.description.length < 10) {
            showMessage('La description doit contenir au moins 10 caractères.', 'error');
            return false;
        }

        return true;
    }

    // Fonctions pour les actions
    function viewAlerteDetails(alerteId) {
        const alerte = allAlertes.find(a => a.id === alerteId);
        if (!alerte) {
            showMessage('Alerte non trouvée.', 'error');
            return;
        }

        const bus = allBus.find(b => b.id === alerte.bus_id);
        const busMatricule = bus ? bus.id : 'Bus inconnu';
        const dateFormatee = new Date(alerte.date_signalement).toLocaleDateString('fr-FR');

        const detailsContent = document.getElementById('alerteDetailsContent');
        if (detailsContent) {
            detailsContent.innerHTML = `
                <div class="details-grid">
                    <div class="details-card">
                        <h4>
                            <i class="${alertesService.getStatutIcon(alerte.statut)}"></i>
                            Informations générales
                        </h4>
                        <div class="details-list">
                            <div class="details-item">
                                <span class="details-label">ID de l'alerte:</span>
                                <span class="details-value">#${alerte.id}</span>
                            </div>
                            <div class="details-item">
                                <span class="details-label">Bus concerné:</span>
                                <span class="details-value">${busMatricule}</span>
                            </div>
                            <div class="details-item">
                                <span class="details-label">Type d'alerte:</span>
                                <span class="details-value">
                                    <i class="${alertesService.getTypeIcon(alerte.type)}"></i>
                                    ${alertesService.getTypeLabel(alerte.type)}
                                </span>
                            </div>
                            <div class="details-item">
                                <span class="details-label">Statut actuel:</span>
                                <span class="details-value">
                                    <span class="badge badge-${alertesService.getStatutBadgeClass(alerte.statut).replace('badge-', '')}">
                                        <i class="${alertesService.getStatutIcon(alerte.statut)}"></i>
                                        ${alertesService.getStatutLabel(alerte.statut)}
                                    </span>
                                </span>
                            </div>
                            <div class="details-item">
                                <span class="details-label">Date de signalement:</span>
                                <span class="details-value">${dateFormatee}</span>
                            </div>
                            <div class="details-item">
                                <span class="details-label">Niveau de priorité:</span>
                                <span class="details-value">${alertesService.getPriorityLevel(alerte.type).charAt(0).toUpperCase() + alertesService.getPriorityLevel(alerte.type).slice(1)}</span>
                            </div>
                        </div>
                    </div>
                    ${bus ? `
                    <div class="details-card">
                        <h4>
                            <i class="fas fa-bus"></i>
                            Informations du bus
                        </h4>
                        <div class="details-list">
                            <div class="details-item">
                                <span class="details-label">Matricule:</span>
                                <span class="details-value">${bus.matricule}</span>
                            </div>
                            <div class="details-item">
                                <span class="details-label">Modèle:</span>
                                <span class="details-value">${bus.modele || 'Non spécifié'}</span>
                            </div>
                            <div class="details-item">
                                <span class="details-label">Capacité:</span>
                                <span class="details-value">${bus.capacite || 'Non spécifiée'} places</span>
                            </div>
                            <div class="details-item">
                                <span class="details-label">État:</span>
                                <span class="details-value">${bus.etat || 'Non spécifié'}</span>
                            </div>
                        </div>
                    </div>
                    ` : `
                    <div class="details-card">
                        <h4>
                            <i class="fas fa-bus"></i>
                            Informations du bus
                        </h4>
                        <p style="color: var(--dark-gray); font-style: italic;">
                            Les informations du bus ne sont pas disponibles.
                        </p>
                    </div>
                    `}
                </div>
                <div class="details-card">
                    <h4>
                        <i class="fas fa-file-alt"></i>
                        Description détaillée de l'alerte
                    </h4>
                    <div class="description-box">
                        ${alerte.description}
                    </div>
                </div>
            `;
        }

        openModal('detailsAlerteModal');
    }

    function editAlerte(alerteId) {
        const alerte = allAlertes.find(a => a.id === alerteId);
        if (!alerte) {
            showMessage('Alerte non trouvée.', 'error');
            return;
        }

        // Convertir la date du format ISO vers le format YYYY-MM-DD
        let dateSignalement = alerte.date_signalement;
        if (dateSignalement && dateSignalement.includes('T')) {
            dateSignalement = dateSignalement.split('T')[0];
        }

        // Remplir le formulaire de modification
        const editAlerteIdEl = document.getElementById('editAlerteId');
        const editAlerteBusEl = document.getElementById('editAlerteBus');
        const editAlerteTypeEl = document.getElementById('editAlerteType');
        const editAlerteStatutEl = document.getElementById('editAlerteStatut');
        const editAlerteDateEl = document.getElementById('editAlerteDate');
        const editAlerteDescriptionEl = document.getElementById('editAlerteDescription');

        if (editAlerteIdEl) editAlerteIdEl.value = alerte.id;
        if (editAlerteBusEl) editAlerteBusEl.value = alerte.bus_id;
        if (editAlerteTypeEl) editAlerteTypeEl.value = alerte.type;
        if (editAlerteStatutEl) editAlerteStatutEl.value = alerte.statut;
        if (editAlerteDateEl) editAlerteDateEl.value = dateSignalement;
        if (editAlerteDescriptionEl) editAlerteDescriptionEl.value = alerte.description;

        openModal('editAlerteModal');

        // Activer les floating labels après ouverture et remplissage
        setTimeout(() => {
            if (editAlerteBusEl && editAlerteBusEl.value) {
                activateFloatingLabel(editAlerteBusEl);
            }
            if (editAlerteTypeEl && editAlerteTypeEl.value) {
                activateFloatingLabel(editAlerteTypeEl);
            }
            if (editAlerteStatutEl && editAlerteStatutEl.value) {
                activateFloatingLabel(editAlerteStatutEl);
            }
            if (editAlerteDateEl && editAlerteDateEl.value) {
                activateFloatingLabel(editAlerteDateEl);
            }
            if (editAlerteDescriptionEl && editAlerteDescriptionEl.value) {
                activateFloatingLabelTextarea(editAlerteDescriptionEl);
            }
        }, 150);
    }

    function deleteAlerte(alerteId) {
        const alerte = allAlertes.find(a => a.id === alerteId);
        if (!alerte) {
            showMessage('Alerte non trouvée.', 'error');
            return;
        }

        currentAlerteToDelete = alerte;
        openModal('deleteAlerteModal');
    }

    async function confirmDeleteAlerte() {
        if (!currentAlerteToDelete) return;

        try {
            await alertesService.deleteAlerte(currentAlerteToDelete.id);
            
            showMessage('Alerte supprimée avec succès !', 'success');
            closeModal('deleteAlerteModal');
            
            await loadAlertes();
            updateStats();
            applyFilters();
            
        } catch (error) {
            showMessage('Erreur lors de la suppression: ' + error.message, 'error');
        } finally {
            currentAlerteToDelete = null;
        }
    }

    // Système de filtres
    function applyFilters() {
        const filterType = document.getElementById('filterType')?.value || '';
        const filterStatut = document.getElementById('filterStatut')?.value || '';
        const filterBus = document.getElementById('filterBus')?.value || '';
        const filterDate = document.getElementById('filterDate')?.value || '';

        filteredAlertes = allAlertes.filter(alerte => {
            let matches = true;

            if (filterType && alerte.type !== filterType) {
                matches = false;
            }

            if (filterStatut && alerte.statut !== filterStatut) {
                matches = false;
            }

            if (filterBus && alerte.bus_id.toString() !== filterBus) {
                matches = false;
            }

            if (filterDate && alerte.date_signalement !== filterDate) {
                matches = false;
            }

            return matches;
        });

        displayAlertes(filteredAlertes);
        displayAlertesTable(filteredAlertes);
    }

    function clearFilters() {
        const filterType = document.getElementById('filterType');
        const filterStatut = document.getElementById('filterStatut');
        const filterBus = document.getElementById('filterBus');
        const filterDate = document.getElementById('filterDate');

        if (filterType) filterType.value = '';
        if (filterStatut) filterStatut.value = '';
        if (filterBus) filterBus.value = '';
        if (filterDate) filterDate.value = '';

        filteredAlertes = [...allAlertes];
        displayAlertes(filteredAlertes);
        displayAlertesTable(filteredAlertes);
    }

    // Export des données
    function exportAlertes() {
        if (allAlertes.length === 0) {
            showMessage('Aucune donnée à exporter.', 'error');
            return;
        }

        const headers = ['ID', 'Date', 'Bus', 'Type', 'Statut', 'Description', 'Priorité'];
        const csvContent = [
            headers.join(','),
            ...allAlertes.map(alerte => {
                const bus = allBus.find(b => b.id === alerte.bus_id);
                const busMatricule = bus ? bus.matricule : 'Inconnu';
                return [
                    alerte.id,
                    alerte.date_signalement,
                    `"${busMatricule}"`,
                    `"${alertesService.getTypeLabel(alerte.type)}"`,
                    `"${alertesService.getStatutLabel(alerte.statut)}"`,
                    `"${alerte.description.replace(/"/g, '""')}"`,
                    `"${alertesService.getPriorityLevel(alerte.type)}"`
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `alertes_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        showMessage('Export réussi !', 'success');
    }

    // Exposer les fonctions globalement
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.loadAlertes = loadAlertes;
    window.viewAlerteDetails = viewAlerteDetails;
    window.editAlerte = editAlerte;
    window.deleteAlerte = deleteAlerte;
    window.confirmDeleteAlerte = confirmDeleteAlerte;
    window.applyFilters = applyFilters;
    window.clearFilters = clearFilters;
    window.exportAlertes = exportAlertes;
});