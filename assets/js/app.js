// Utilitaires généraux
class TransportAdmin {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeComponents();
    }

    setupEventListeners() {
        // Toggle sidebar mobile
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', this.toggleSidebar);
        }

        // Navigation active state
        this.setActiveNavigation();

        // Form animations
        this.setupFormAnimations();
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('open');
        }
    }

    setActiveNavigation() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.sidebar-nav-item, .nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && currentPath.includes(href)) {
                link.classList.add('active');
            }
        });
    }

    setupFormAnimations() {
        // Animation des inputs avec labels flottants et icônes
        const formInputs = document.querySelectorAll('.form-input');
        
        formInputs.forEach(input => {
            // Vérifier si l'input a une valeur au chargement
            if (input.value) {
                input.classList.add('has-value');
                const icon = input.parentElement.querySelector('.form-icon');
                if (icon) icon.style.color = 'var(--primary-orange)';
            }

            input.addEventListener('focus', (e) => {
                const formGroup = e.target.parentElement;
                const icon = formGroup.querySelector('.form-icon');
                const label = formGroup.querySelector('.form-label');
                
                formGroup.classList.add('focused');
                if (icon) {
                    icon.style.color = 'var(--primary-orange)';
                    icon.style.transform = 'translateY(-50%) scale(1.1)';
                }
                if (label) {
                    label.style.color = 'var(--primary-orange)';
                }
            });

            input.addEventListener('blur', (e) => {
                const formGroup = e.target.parentElement;
                const icon = formGroup.querySelector('.form-icon');
                const label = formGroup.querySelector('.form-label');
                
                formGroup.classList.remove('focused');
                
                if (!e.target.value) {
                    e.target.classList.remove('has-value');
                    if (icon) {
                        icon.style.color = 'var(--dark-gray)';
                        icon.style.transform = 'translateY(-50%) scale(1)';
                    }
                    if (label) {
                        label.style.color = 'var(--dark-gray)';
                    }
                } else {
                    e.target.classList.add('has-value');
                    if (icon) {
                        icon.style.color = 'var(--primary-orange)';
                    }
                    if (label) {
                        label.style.color = 'var(--primary-orange)';
                    }
                }
            });

            // Animation de typing
            input.addEventListener('input', (e) => {
                const icon = e.target.parentElement.querySelector('.form-icon');
                if (icon && e.target.value) {
                    icon.style.color = 'var(--primary-orange)';
                    // Petit effet de pulsation lors de la saisie
                    icon.style.animation = 'pulse 0.3s ease';
                    setTimeout(() => {
                        icon.style.animation = '';
                    }, 300);
                }
            });
        });
    }

    initializeComponents() {
        // Initialiser les composants de la page
        this.initCharts();
        this.initTables();
        this.loadDashboardData();
    }

    initCharts() {
        // Simulation de données pour les graphiques
        if (typeof Chart !== 'undefined') {
            this.createRevenueChart();
            this.createFrequentationChart();
        }
    }

    createRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Revenus (FCFA)',
                    data: [12000, 15000, 13000, 17000, 16000, 19000],
                    borderColor: '#ff7900',
                    backgroundColor: 'rgba(255, 121, 0, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#e9ecef'
                        }
                    },
                    x: {
                        grid: {
                            color: '#e9ecef'
                        }
                    }
                }
            }
        });
    }

    createFrequentationChart() {
        const ctx = document.getElementById('frequentationChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Ligne A', 'Ligne B', 'Ligne C', 'Ligne D'],
                datasets: [{
                    data: [35, 25, 25, 15],
                    backgroundColor: [
                        '#ff7900',
                        '#ff9500',
                        '#ffb84d',
                        '#e9ecef'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    initTables() {
        // Initialiser les fonctionnalités des tableaux
        const tables = document.querySelectorAll('.data-table');
        tables.forEach(table => {
            this.addTableSearch(table);
            this.addTableSort(table);
        });
    }

    addTableSearch(table) {
        const searchInput = table.parentElement.querySelector('.table-search');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const rows = table.querySelectorAll('tbody tr');

            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }

    addTableSort(table) {
        const headers = table.querySelectorAll('th[data-sort]');
        headers.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                this.sortTable(table, header.dataset.sort);
            });
        });
    }

    sortTable(table, column) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const columnIndex = parseInt(column);

        rows.sort((a, b) => {
            const aText = a.cells[columnIndex].textContent.trim();
            const bText = b.cells[columnIndex].textContent.trim();
            
            // Essayer de comparer comme des nombres d'abord
            const aNum = parseFloat(aText.replace(/[^0-9.-]/g, ''));
            const bNum = parseFloat(bText.replace(/[^0-9.-]/g, ''));
            
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum;
            }
            
            return aText.localeCompare(bText);
        });

        rows.forEach(row => tbody.appendChild(row));
    }

    loadDashboardData() {
        // Simulation du chargement de données
        this.updateStats();
        this.loadRecentTransactions();
        this.loadVehicleStatus();
    }

    updateStats() {
        const stats = {
            totalRevenue: '45,230',
            dailyPassengers: '2,847',
            activeVehicles: '24',
            onTimePerformance: '87'
        };

        Object.keys(stats).forEach(key => {
            const element = document.querySelector(`[data-stat="${key}"]`);
            if (element) {
                this.animateNumber(element, stats[key]);
            }
        });
    }

    animateNumber(element, finalValue) {
        const value = parseFloat(finalValue.replace(/,/g, ''));
        const duration = 1000;
        const steps = 60;
        const increment = value / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(() => {
            current += increment;
            step++;
            
            if (step >= steps) {
                clearInterval(timer);
                current = value;
            }

            const displayValue = Math.floor(current).toLocaleString();
            element.textContent = finalValue.includes('%') ? displayValue + '%' : displayValue;
        }, duration / steps);
    }

    loadRecentTransactions() {
        // Simulation de données de transactions récentes
        const transactions = [
            { id: 'TXN001', line: 'Ligne A', amount: '125.50', time: '14:30', status: 'success' },
            { id: 'TXN002', line: 'Ligne B', amount: '89.00', time: '14:28', status: 'success' },
            { id: 'TXN003', line: 'Ligne C', amount: '156.75', time: '14:25', status: 'warning' },
            { id: 'TXN004', line: 'Ligne A', amount: '203.25', time: '14:22', status: 'success' }
        ];

        const tableBody = document.querySelector('#transactionsTable tbody');
        if (!tableBody) return;

        tableBody.innerHTML = transactions.map(tx => `
            <tr>
                <td>${tx.id}</td>
                <td>${tx.line}</td>
                <td>${tx.amount}FCFA</td>
                <td>${tx.time}</td>
                <td><span class="badge badge-${tx.status}">${tx.status === 'success' ? 'Validé' : 'En attente'}</span></td>
            </tr>
        `).join('');
    }

    loadVehicleStatus() {
        // Simulation du statut des véhicules
        const vehicles = [
            { id: 'BUS001', line: 'Ligne A', status: 'En service', passengers: 45, location: 'Gare Centrale' },
            { id: 'BUS002', line: 'Ligne B', status: 'En service', passengers: 32, location: 'Centre Ville' },
            { id: 'BUS003', line: 'Ligne C', status: 'Maintenance', passengers: 0, location: 'Dépôt' },
            { id: 'BUS004', line: 'Ligne A', status: 'En service', passengers: 28, location: 'Université' }
        ];

        const tableBody = document.querySelector('#vehiclesTable tbody');
        if (!tableBody) return;

        tableBody.innerHTML = vehicles.map(vehicle => `
            <tr>
                <td>${vehicle.id}</td>
                <td>${vehicle.line}</td>
                <td><span class="badge badge-${vehicle.status === 'En service' ? 'success' : 'warning'}">${vehicle.status}</span></td>
                <td>${vehicle.passengers}</td>
                <td>${vehicle.location}</td>
            </tr>
        `).join('');
    }

    // API simulation pour communication future avec Node.js
    async apiCall(endpoint, method = 'GET', data = null) {
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`/api${endpoint}`, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            this.showNotification('Erreur de connexion', 'error');
            throw error;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-close après 5 secondes
        setTimeout(() => {
            notification.remove();
        }, 5000);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }
}

// Formulaires de connexion et inscription
class AuthForm {
    constructor() {
        this.setupAuthForms();
    }

    setupAuthForms() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        if (registerForm) {
            registerForm.addEventListener('submit', this.handleRegister.bind(this));
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const loginData = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            // Simulation de l'authentification
            await this.simulateApiCall('/auth/login', loginData);
            
            // Redirection vers le dashboard
            window.location.href = 'dashboard.html';
        } catch (error) {
            this.showError('Email ou mot de passe incorrect');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const registerData = {
            prenom: formData.get('prenom'),
            nom: formData.get('nom'),
            email: formData.get('email'),
            password: formData.get('password'),
            compagnie: formData.get('compagnie')
        };

        try {
            // Simulation de l'inscription
            await this.simulateApiCall('/auth/register', registerData);
            
            // Redirection vers la connexion
            window.location.href = 'login.html';
        } catch (error) {
            this.showError('Erreur lors de l\'inscription');
        }
    }

    async simulateApiCall(endpoint, data) {
        // Simulation d'un appel API avec délai
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (endpoint === '/auth/login' && data.email === 'admin@transport.com') {
                    resolve({ token: 'fake-jwt-token', user: data });
                } else if (endpoint === '/auth/register') {
                    resolve({ message: 'Inscription réussie' });
                } else {
                    reject(new Error('Invalid credentials'));
                }
            }, 1000);
        });
    }

    showError(message) {
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background-color: #f8d7da;
            color: #721c24;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            border: 1px solid #f5c6cb;
        `;
        errorDiv.textContent = message;

        const form = document.querySelector('.auth-form');
        if (form) {
            form.insertBefore(errorDiv, form.firstChild);
        }
    }
}

// Gestion des modals
class ModalManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.bindModalButtons();
    }

    setupEventListeners() {
        // Fermer le modal en cliquant sur l'overlay
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });

        // Fermer le modal avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Gérer les boutons de fermeture des modals
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target.closest('.modal-close')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal);
                }
            }
        });
    }

    bindModalButtons() {
        // Lier tous les boutons avec data-modal
        document.addEventListener('click', (e) => {
            const button = e.target.closest('[data-modal]');
            if (button) {
                e.preventDefault();
                const modalId = button.getAttribute('data-modal');
                const vehicleId = button.getAttribute('data-vehicle');
                this.openModal(modalId, button, vehicleId);
            }
        });
    }

    openModal(modalId, button = null, vehicleId = null) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // Pré-remplir les données si nécessaire
        if (vehicleId && modalId === 'editVehicleModal') {
            this.populateEditVehicleModal(vehicleId);
        } else if (vehicleId && modalId === 'vehicleLocationModal') {
            this.populateLocationModal(vehicleId);
        }

        // Ouvrir le modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus sur le premier input si c'est un formulaire
        const firstInput = modal.querySelector('.form-input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    closeModal(modal) {
        if (!modal) {
            modal = document.querySelector('.modal.active');
        }
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal.active');
        modals.forEach(modal => this.closeModal(modal));
    }

    populateEditVehicleModal(vehicleId) {
        // Données simulées des véhicules
        const vehicleData = {
            'BUS001': {
                id: 'BUS001',
                line: 'A',
                status: 'En service',
                driver: 'Jean Dupont'
            },
            'BUS002': {
                id: 'BUS002',
                line: 'B',
                status: 'En service',
                driver: 'Marie Martin'
            },
            'BUS003': {
                id: 'BUS003',
                line: '',
                status: 'Maintenance',
                driver: ''
            },
            'BUS004': {
                id: 'BUS004',
                line: 'A',
                status: 'En service',
                driver: 'Pierre Durand'
            }
        };

        const data = vehicleData[vehicleId];
        if (data) {
            document.getElementById('editVehicleId').value = data.id;
            document.getElementById('editVehicleLine').value = data.line;
            document.getElementById('editVehicleStatus').value = data.status;
            document.getElementById('editVehicleDriver').value = data.driver;
        }
    }

    populateLocationModal(vehicleId) {
        // Données simulées de position
        const locationData = {
            'BUS001': {
                id: 'BUS001',
                line: 'Ligne A',
                current: 'Gare Centrale',
                next: 'Centre Ville'
            },
            'BUS002': {
                id: 'BUS002',
                line: 'Ligne B',
                current: 'Centre Ville',
                next: 'Université'
            },
            'BUS003': {
                id: 'BUS003',
                line: '-',
                current: 'Dépôt Central',
                next: '-'
            },
            'BUS004': {
                id: 'BUS004',
                line: 'Ligne A',
                current: 'Université',
                next: 'Gare Centrale'
            }
        };

        const data = locationData[vehicleId];
        if (data) {
            document.getElementById('locationVehicleId').textContent = data.id;
            document.getElementById('locationVehicleLine').textContent = data.line;
            document.getElementById('locationCurrent').textContent = data.current;
            document.getElementById('locationNext').textContent = data.next;
        }
    }

    // Méthodes pour afficher des notifications après actions
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Gestionnaire de navigation
class NavigationManager {
    constructor() {
        this.setupNavigation();
    }

    setupNavigation() {
        // Redirection automatique pour les liens
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && !link.href.startsWith('#') && !link.href.startsWith('javascript:')) {
                const href = link.getAttribute('href');
                if (href.endsWith('.html')) {
                    e.preventDefault();
                    this.navigateTo(href);
                }
            }
        });
    }

    navigateTo(page) {
        // Animation de transition
        document.body.style.opacity = '0.8';
        
        setTimeout(() => {
            window.location.href = page;
        }, 150);
    }
}

// Améliorations des interactions boutons
class ButtonEnhancer {
    constructor() {
        this.enhanceButtons();
    }

    enhanceButtons() {
        // Améliorer tous les boutons d'action
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (button && !button.classList.contains('enhanced')) {
                this.addButtonEffects(button);
            }
        });
    }

    addButtonEffects(button) {
        button.classList.add('enhanced');
        
        button.addEventListener('click', (e) => {
            // Effet de ripple
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            if (!document.querySelector('style[data-ripple]')) {
                const style = document.createElement('style');
                style.setAttribute('data-ripple', 'true');
                style.textContent = `
                    @keyframes ripple {
                        to {
                            transform: scale(2);
                            opacity: 0;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            
            const buttonPos = getComputedStyle(button).position;
            if (buttonPos !== 'relative' && buttonPos !== 'absolute') {
                button.style.position = 'relative';
            }
            
            button.style.overflow = 'hidden';
            button.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    }
}

// Gestionnaire des formulaires avec soumission
class FormManager {
    constructor() {
        this.setupFormHandlers();
    }

    setupFormHandlers() {
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.tagName === 'FORM') {
                this.handleFormSubmit(e, form);
            }
        });
    }

    handleFormSubmit(e, form) {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.innerHTML : '';
        
        // Animation de chargement
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
            submitBtn.disabled = true;
        }

        // Simulation d'envoi
        setTimeout(() => {
            const formId = form.id;
            let message = 'Opération réussie !';
            
            switch (formId) {
                case 'addVehicleForm':
                    message = 'Véhicule ajouté avec succès !';
                    break;
                case 'editVehicleForm':
                    message = 'Véhicule modifié avec succès !';
                    break;
                case 'contactForm':
                    message = 'Message envoyé avec succès !';
                    break;
                case 'loginForm':
                    window.location.href = 'dashboard.html';
                    return;
                case 'registerForm':
                    window.location.href = 'index.html';
                    return;
            }
            
            // Fermer le modal si c'est dans un modal
            const modal = form.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
            
            // Afficher notification
            this.showNotification(message, 'success');
            
            // Réinitialiser le bouton
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
            
            // Réinitialiser le formulaire
            form.reset();
            
        }, 1500);
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    new TransportAdmin();
    new AuthForm();
    new ModalManager();
    new NavigationManager();
    new ButtonEnhancer();
    new FormManager();
});

// Utilitaires globaux
window.TransportUtils = {
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    },

    formatDate: (date) => {
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    },

    generateId: () => {
        return Math.random().toString(36).substring(2, 9);
    }
};
