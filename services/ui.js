// services/ui.js
class UIService {
    showMessage(message, type = 'error') {
        // Supprimer les messages existants
        this.removeMessages();

        // Créer l'élément message
        const messageElement = document.createElement('div');
        messageElement.className = `alert alert-${type}`;
        messageElement.style.cssText = `
            padding: 12px 16px;
            margin-bottom: 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            animation: slideIn 0.3s ease-out;
        `;

        // Styles selon le type
        if (type === 'error') {
            messageElement.style.cssText += `
                background-color: #fee2e2;
                color: #dc2626;
                border: 1px solid #fecaca;
            `;
        } else if (type === 'success') {
            messageElement.style.cssText += `
                background-color: #dcfce7;
                color: #16a34a;
                border: 1px solid #bbf7d0;
            `;
        }

        messageElement.textContent = message;

        // Insérer le message au début du formulaire
        const form = document.querySelector('form');
        if (form) {
            form.insertBefore(messageElement, form.firstChild);
        }

        // Supprimer automatiquement après 5 secondes
        setTimeout(() => {
            this.removeMessages();
        }, 5000);
    }

    removeMessages() {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => alert.remove());
    }

    showLoading(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
        button.disabled = true;
        
        return () => {
            button.innerHTML = originalText;
            button.disabled = false;
        };
    }

    addFormValidation(form) {
        const inputs = form.querySelectorAll('input[required]');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                this.clearFieldError(input);
            });
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        
        // Supprimer les erreurs existantes
        this.clearFieldError(field);
        
        let errorMessage = '';
        
        if (!value) {
            errorMessage = 'Ce champ est requis';
        } else {
            switch (fieldName) {
                case 'email':
                    if (!this.isValidEmail(value)) {
                        errorMessage = 'Format d\'email invalide';
                    }
                    break;
                case 'telephone':
                    if (!this.isValidPhone(value)) {
                        errorMessage = 'Format de téléphone invalide';
                    }
                    break;
                case 'password':
                    if (value.length < 6) {
                        errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
                    }
                    break;
                case 'confirmPassword':
                    const password = document.querySelector('input[name="password"]').value;
                    if (value !== password) {
                        errorMessage = 'Les mots de passe ne correspondent pas';
                    }
                    break;
            }
        }
        
        if (errorMessage) {
            this.showFieldError(field, errorMessage);
            return false;
        }
        
        return true;
    }

    showFieldError(field, message) {
        const formGroup = field.closest('.form-group');
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.style.cssText = `
            color: #dc2626;
            font-size: 12px;
            margin-top: 4px;
            display: block;
        `;
        errorElement.textContent = message;
        
        formGroup.appendChild(errorElement);
        field.style.borderColor = '#dc2626';
    }

    clearFieldError(field) {
        const formGroup = field.closest('.form-group');
        const errorElement = formGroup.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
        field.style.borderColor = '';
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        // Nettoyer le numéro (supprimer espaces, tirets, points)
        const cleanPhone = phone.replace(/[\s\-\.]/g, '');
        
        // Accepter tout numéro de 8 chiffres ou plus (jusqu'à 15 chiffres)
        // Peut commencer par + pour l'international
        const phoneRegex = /^(\+)?[0-9]{8,15}$/;
        
        return phoneRegex.test(cleanPhone);
    }
}

// Export du service
const uiService = new UIService();

// Ajouter les styles CSS pour l'animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateY(-10px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);