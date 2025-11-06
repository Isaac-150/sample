// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Utility Functions
class Utils {
    static showMessage(message, type = 'success') {
        const messageDiv = document.getElementById('loginMessage') || 
                          document.getElementById('registerMessage') ||
                          this.createMessageElement();
        
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.classList.remove('hidden');
        
        setTimeout(() => {
            messageDiv.classList.add('hidden');
        }, 5000);
    }

    static createMessageElement() {
        const div = document.createElement('div');
        div.id = 'dynamicMessage';
        document.body.appendChild(div);
        return div;
    }

    static showLoading(button) {
        const spinner = button.querySelector('.spinner');
        const text = button.querySelector('span');
        if (spinner && text) {
            spinner.classList.remove('hidden');
            text.textContent = 'Please wait...';
            button.disabled = true;
        }
    }

    static hideLoading(button, originalText = 'Sign In') {
        const spinner = button.querySelector('.spinner');
        const text = button.querySelector('span');
        if (spinner && text) {
            spinner.classList.add('hidden');
            text.textContent = originalText;
            button.disabled = false;
        }
    }

    static formatCurrency(amount, currency = '₹') {
        return `${currency}${parseFloat(amount).toFixed(2)}`;
    }

    static getAuthToken() {
        return localStorage.getItem('token');
    }

    static getCurrentUser() {
        return JSON.parse(localStorage.getItem('user') || '{}');
    }

    static isLoggedIn() {
        return !!this.getAuthToken();
    }

    static redirectIfLoggedIn() {
        if (this.isLoggedIn() && !window.location.href.includes('dashboard.html')) {
            window.location.href = 'dashboard.html';
        }
    }

    static redirectToLogin() {
        if (!this.isLoggedIn() && !window.location.href.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }
}

// API Service Class
class ApiService {
    static async request(endpoint, options = {}) {
        const token = Utils.getAuthToken();
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            },
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Auth endpoints
    static async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: { email, password }
        });
    }

    static async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: userData
        });
    }

    static async verifyToken() {
        return this.request('/auth/verify', {
            method: 'POST'
        });
    }

    // Expense endpoints
    static async getExpenses(filters = {}) {
        const queryParams = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key]) queryParams.append(key, filters[key]);
        });
        
        const queryString = queryParams.toString();
        const endpoint = `/expenses${queryString ? `?${queryString}` : ''}`;
        
        return this.request(endpoint);
    }

    static async addExpense(expenseData) {
        return this.request('/expenses', {
            method: 'POST',
            body: expenseData
        });
    }

    static async updateExpense(id, expenseData) {
        return this.request(`/expenses/${id}`, {
            method: 'PUT',
            body: expenseData
        });
    }

    static async deleteExpense(id) {
        return this.request(`/expenses/${id}`, {
            method: 'DELETE'
        });
    }

    static async getDashboardSummary() {
        return this.request('/expenses/dashboard/summary');
    }

    static async getCategories() {
        return this.request('/expenses/categories');
    }

    static async addCategory(categoryData) {
        return this.request('/expenses/categories', {
            method: 'POST',
            body: categoryData
        });
    }

    static async updateSettings(settings) {
        return this.request('/expenses/settings', {
            method: 'PUT',
            body: settings
        });
    }

    static async exportToCSV() {
        const response = await fetch(`${API_BASE_URL}/expenses/export/csv`, {
            headers: {
                'Authorization': `Bearer ${Utils.getAuthToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Export failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

// Theme Management
class ThemeManager {
    static init() {
        this.applySavedTheme();
        this.setupThemeToggle();
    }

    static applySavedTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    static setupThemeToggle() {
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleTheme());
        }
    }

    static toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    static updateThemeIcon(theme) {
        const themeIcon = document.querySelector('#themeToggle i');
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    ThemeManager.init();
    
    // Check authentication state
    if (Utils.isLoggedIn() && window.location.href.includes('login.html')) {
        Utils.redirectIfLoggedIn();
    }
});