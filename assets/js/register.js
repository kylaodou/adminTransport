// assets/js/register.js
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    
    // Ajouter la validation des champs
    uiService.addFormValidation(registerForm);
    
    // Gestionnaire de soumission du formulaire
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Récupérer les données du formulaire
        const formData = new FormData(registerForm);
        const userData = {
            compagnie: formData.get('compagnie').trim(),
            email: formData.get('email').trim(),
            localisation: formData.get('localisation').trim(),
            telephone: formData.get('telephone').trim(),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };
        
        // Validation côté client
        if (!validateForm(userData)) {
            return;
        }
        
        // Afficher le loading
        const submitButton = registerForm.querySelector('button[type="submit"]');
        const stopLoading = uiService.showLoading(submitButton);
        
        try {
            // Supprimer les messages d'erreur précédents
            uiService.removeMessages();
            
            // Appel à l'API
            const response = await authService.register(userData);
            
            // Succès
            uiService.showMessage('Inscription réussie ! Vous pouvez maintenant vous connecter.', 'success');
            
            // Rediriger vers la page de connexion après 2 secondes
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            
        } catch (error) {
            // Gestion des erreurs
            let errorMessage = 'Une erreur est survenue lors de l\'inscription.';
            
            if (error.message.includes('Téléphone invalide')) {
                errorMessage = 'Le numéro de téléphone n\'est pas valide. Vérifiez le format (ex: 70234567, 0123456789).';
            } else if (error.message.includes('email')) {
                errorMessage = 'Cette adresse email est déjà utilisée.';
            } else if (error.message.includes('telephone')) {
                errorMessage = 'Ce numéro de téléphone est déjà utilisé.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            uiService.showMessage(errorMessage, 'error');
        } finally {
            stopLoading();
        }
    });
    
    // Validation du formulaire
    function validateForm(userData) {
        let isValid = true;
        
        // Vérifier tous les champs requis
        const requiredFields = ['compagnie', 'email', 'telephone', 'password'];
        requiredFields.forEach(field => {
            if (!userData[field]) {
                isValid = false;
            }
        });
        
        // Vérifier la correspondance des mots de passe
        if (userData.password !== userData.confirmPassword) {
            uiService.showMessage('Les mots de passe ne correspondent pas.', 'error');
            isValid = false;
        }
        
        // Vérifier la longueur du mot de passe
        if (userData.password.length < 6) {
            uiService.showMessage('Le mot de passe doit contenir au moins 6 caractères.', 'error');
            isValid = false;
        }
        
        // Vérifier l'email
        if (!uiService.isValidEmail(userData.email)) {
            uiService.showMessage('Format d\'email invalide.', 'error');
            isValid = false;
        }
        
        // Vérifier le téléphone
        if (!uiService.isValidPhone(userData.telephone)) {
            uiService.showMessage('Format de téléphone invalide. Utilisez un format valide (ex: 70234567, 0123456789, +33123456789).', 'error');
            isValid = false;
        }
        
        // Vérifier les conditions d'utilisation
        const termsCheckbox = registerForm.querySelector('input[name="terms"]');
        if (!termsCheckbox.checked) {
            uiService.showMessage('Vous devez accepter les conditions d\'utilisation.', 'error');
            isValid = false;
        }
        
        return isValid;
    }
});