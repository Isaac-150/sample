class LoginManager {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.loginBtn = document.getElementById('loginBtn');
        this.init();
    }

    init() {
        this.setupEventListeners();
        Utils.redirectIfLoggedIn();
    }

    setupEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleLogin(e));
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const email = formData.get('email');
        const password = formData.get('password');

        if (!this.validateForm(email, password)) {
            return;
        }

        Utils.showLoading(this.loginBtn);

        try {
            const result = await ApiService.login(email, password);
            
            // Save token and user data
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            
            Utils.showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);

        } catch (error) {
            Utils.showMessage(error.message, 'error');
        } finally {
            Utils.hideLoading(this.loginBtn, 'Sign In');
        }
    }

    validateForm(email, password) {
        if (!email || !password) {
            Utils.showMessage('Please fill in all fields', 'error');
            return false;
        }

        if (!this.isValidEmail(email)) {
            Utils.showMessage('Please enter a valid email address', 'error');
            return false;
        }

        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Initialize login manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new LoginManager();
});