// assets/js/login.js
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    // Vérifier si l'utilisateur est déjà connecté
    if (authService.isAuthenticated()) {
        window.location.href = 'dashboard.html'; // Rediriger vers le tableau de bord
        return;
    }
    
    // Ajouter la validation des champs
    uiService.addFormValidation(loginForm);
    
    // Gestionnaire de soumission du formulaire
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Récupérer les données du formulaire
        const formData = new FormData(loginForm);
        const credentials = {
            telephone: formData.get('telephone').trim(),
            password: formData.get('password')
        };
        
        // Validation côté client
        if (!validateForm(credentials)) {
            return;
        }
        
        // Afficher le loading
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const stopLoading = uiService.showLoading(submitButton);
        
        try {
            // Supprimer les messages d'erreur précédents
            uiService.removeMessages();
            
            // Appel à l'API
            const response = await authService.login(credentials);
            
            // Succès
            uiService.showMessage('Connexion réussie ! Redirection en cours...', 'success');
            
            // Rediriger vers le tableau de bord après 1 seconde
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } catch (error) {
            // Gestion des erreurs
            let errorMessage = 'Une erreur est survenue lors de la connexion.';
            
            if (error.message.includes('Téléphone invalide')) {
                errorMessage = 'Le numéro de téléphone n\'est pas valide.';
            } else if (error.message.includes('Mot de passe incorrect')) {
                errorMessage = 'Mot de passe incorrect. Veuillez réessayer.';
            } else if (error.message.includes('Compagnie non trouvée')) {
                errorMessage = 'Aucun compte trouvé avec ce numéro de téléphone.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            uiService.showMessage(errorMessage, 'error');
        } finally {
            stopLoading();
        }
    });
    
    // Validation du formulaire
    function validateForm(credentials) {
        let isValid = true;
        
        // Vérifier les champs requis
        if (!credentials.telephone) {
            uiService.showMessage('Le numéro de téléphone est requis.', 'error');
            isValid = false;
        }
        
        if (!credentials.password) {
            uiService.showMessage('Le mot de passe est requis.', 'error');
            isValid = false;
        }
        
        // Vérifier le format du téléphone
        if (credentials.telephone && !uiService.isValidPhone(credentials.telephone)) {
            uiService.showMessage('Format de téléphone invalide.', 'error');
            isValid = false;
        }
        
        return isValid;
    }
    
    // Gestion du "Se souvenir de moi"
    const rememberCheckbox = loginForm.querySelector('input[name="remember"]');
    const telephoneInput = loginForm.querySelector('input[name="telephone"]');
    
    // Charger le téléphone sauvegardé
    const savedTelephone = localStorage.getItem('rememberedTelephone');
    if (savedTelephone) {
        telephoneInput.value = savedTelephone;
        rememberCheckbox.checked = true;
    }
    
    // Sauvegarder/supprimer le téléphone
    rememberCheckbox.addEventListener('change', function() {
        if (this.checked && telephoneInput.value) {
            localStorage.setItem('rememberedTelephone', telephoneInput.value);
        } else {
            localStorage.removeItem('rememberedTelephone');
        }
    });
    
    // Sauvegarder le téléphone quand il change
    telephoneInput.addEventListener('change', function() {
        if (rememberCheckbox.checked) {
            localStorage.setItem('rememberedTelephone', this.value);
        }
    });
});