// assets/js/dashboard.js
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier l'authentification
    if (!authService.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    // Charger les informations de l'utilisateur
    loadUserInfo();
    
    // Initialiser le dashboard
    initializeDashboard();
    
    // Gestionnaire de déconnexion
    setupLogoutHandler();
    
    // Charger les données du dashboard
    loadDashboardData();
});

function loadUserInfo() {
    const companyData = authService.getCompanyData();
    
    if (companyData) {
        // Afficher le nom de la compagnie dans le titre principal
        const companyNameElement = document.getElementById('companyName');
        if (companyNameElement) {
            companyNameElement.textContent = companyData.nom || 'Société';
        }
        
        // Afficher les infos dans l'en-tête utilisateur
        const userCompanyNameElement = document.getElementById('userCompanyName');
        const userEmailElement = document.getElementById('userEmail');
        
        if (userCompanyNameElement) {
            userCompanyNameElement.textContent = companyData.nom || '-';
        }
        
        if (userEmailElement) {
            userEmailElement.textContent = companyData.email || '-';
        }
        
        console.log('Données utilisateur chargées:', companyData);
    } else {
        console.error('Aucune donnée utilisateur trouvée');
        // Rediriger vers la connexion si pas de données
        authService.logout();
        window.location.href = 'index.html';
    }
}

function setupLogoutHandler() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Confirmer la déconnexion
            if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                // Afficher un message de déconnexion
                uiService.showMessage('Déconnexion en cours...', 'success');
                
                // Nettoyer les données d'authentification
                authService.logout();
                
                // Rediriger vers la page de connexion après un court délai
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
        });
    }
}

function initializeDashboard() {
    // Initialiser les graphiques
    initializeCharts();
    
    // Initialiser les animations des statistiques
    animateStats();
}

function loadDashboardData() {
    // Simuler le chargement des données (à remplacer par de vrais appels API)
    
    // Mettre à jour les statistiques
    updateStats({
        totalRevenue: 15420,
        dailyPassengers: 234,
        activeVehicles: 12,
        onTimePerformance: 92
    });
    
    // Charger les transactions récentes
    loadRecentTransactions();
    
    // Charger le statut des véhicules
    loadVehicleStatus();
}

function updateStats(stats) {
    // Animation des chiffres
    Object.keys(stats).forEach(key => {
        const element = document.querySelector(`[data-stat="${key}"]`);
        if (element) {
            animateNumber(element, stats[key], key);
        }
    });
}

function animateNumber(element, targetValue, statType) {
    const startValue = 0;
    const duration = 2000; // 2 secondes
    const startTime = Date.now();
    
    function updateNumber() {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Fonction d'easing
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easedProgress);
        
        // Formater selon le type de statistique
        if (statType === 'totalRevenue') {
            element.textContent = new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                minimumFractionDigits: 0
            }).format(currentValue);
        } else if (statType === 'onTimePerformance') {
            element.textContent = currentValue + '%';
        } else {
            element.textContent = new Intl.NumberFormat('fr-FR').format(currentValue);
        }
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    updateNumber();
}

function animateStats() {
    // Observer pour déclencher l'animation quand les éléments sont visibles
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    });
    
    document.querySelectorAll('.stat-card').forEach(card => {
        observer.observe(card);
    });
}

function initializeCharts() {
    // Graphique des revenus
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
                datasets: [{
                    label: 'Revenus (XOF)',
                    data: [12000, 15000, 8000, 18000, 22000, 25000, 15420],
                    borderColor: '#ff7900',
                    backgroundColor: 'rgba(255, 121, 0, 0.1)',
                    tension: 0.4,
                    fill: true
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
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('fr-FR').format(value) + ' XOF';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Graphique de fréquentation
    const frequentationCtx = document.getElementById('frequentationChart');
    if (frequentationCtx) {
        new Chart(frequentationCtx, {
            type: 'doughnut',
            data: {
                labels: ['Ligne A', 'Ligne B', 'Ligne C', 'Ligne D'],
                datasets: [{
                    data: [35, 25, 25, 15],
                    backgroundColor: [
                        '#ff7900',
                        '#1a1a1a',
                        '#666666',
                        '#cccccc'
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
}

function loadRecentTransactions() {
    const tableBody = document.querySelector('#transactionsTable tbody');
    if (!tableBody) return;
    
    // Données simulées (à remplacer par de vrais appels API)
    const transactions = [
        { id: 'TXN001', ligne: 'Ligne A', montant: 500, heure: '14:30', statut: 'Validé' },
        { id: 'TXN002', ligne: 'Ligne B', montant: 750, heure: '14:25', statut: 'Validé' },
        { id: 'TXN003', ligne: 'Ligne A', montant: 500, heure: '14:20', statut: 'En attente' },
        { id: 'TXN004', ligne: 'Ligne C', montant: 600, heure: '14:15', statut: 'Validé' },
        { id: 'TXN005', ligne: 'Ligne B', montant: 750, heure: '14:10', statut: 'Validé' }
    ];
    
    tableBody.innerHTML = transactions.map(transaction => `
        <tr>
            <td>${transaction.id}</td>
            <td>${transaction.ligne}</td>
            <td>${new Intl.NumberFormat('fr-FR').format(transaction.montant)} XOF</td>
            <td>${transaction.heure}</td>
            <td>
                <span class="status ${transaction.statut === 'Validé' ? 'success' : 'warning'}">
                    ${transaction.statut}
                </span>
            </td>
        </tr>
    `).join('');
}

function loadVehicleStatus() {
    const tableBody = document.querySelector('#vehiclesTable tbody');
    if (!tableBody) return;
    
    // Données simulées (à remplacer par de vrais appels API)
    const vehicles = [
        { vehicule: 'BUS-001', ligne: 'Ligne A', statut: 'En service', passagers: '15/45', position: 'Gare centrale' },
        { vehicule: 'BUS-002', ligne: 'Ligne B', statut: 'En service', passagers: '32/50', position: 'Avenue Kwame' },
        { vehicule: 'BUS-003', ligne: 'Ligne A', statut: 'Pause', passagers: '0/45', position: 'Dépôt' },
        { vehicule: 'BUS-004', ligne: 'Ligne C', statut: 'En service', passagers: '28/40', position: 'Zone 4' },
        { vehicule: 'BUS-005', ligne: 'Ligne B', statut: 'Maintenance', passagers: '0/50', position: 'Atelier' }
    ];
    
    tableBody.innerHTML = vehicles.map(vehicle => `
        <tr>
            <td>${vehicle.vehicule}</td>
            <td>${vehicle.ligne}</td>
            <td>
                <span class="status ${getStatusClass(vehicle.statut)}">
                    ${vehicle.statut}
                </span>
            </td>
            <td>${vehicle.passagers}</td>
            <td>${vehicle.position}</td>
        </tr>
    `).join('');
}

function getStatusClass(statut) {
    switch (statut) {
        case 'En service': return 'success';
        case 'Pause': return 'warning';
        case 'Maintenance': return 'error';
        default: return '';
    }
}

// Actualisation automatique des données toutes les 30 secondes
setInterval(loadDashboardData, 30000);