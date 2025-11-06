class DashboardManager {
    constructor() {
        this.currentSection = 'dashboard';
        this.expenses = [];
        this.categories = [];
        this.init();
    }

    async init() {
        Utils.redirectToLogin();
        this.setupEventListeners();
        await this.loadInitialData();
        this.updateUserInfo();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Expense form
        const expenseForm = document.getElementById('expenseForm');
        if (expenseForm) {
            expenseForm.addEventListener('submit', (e) => this.handleExpenseSubmit(e));
        }

        // Search and filters
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterExpenses());
        }

        // Export
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToCSV());
        }

        // Settings
        const saveBudgetBtn = document.getElementById('saveBudget');
        if (saveBudgetBtn) {
            saveBudgetBtn.addEventListener('click', () => this.saveBudget());
        }
    }

    async loadInitialData() {
        try {
            await this.loadDashboard();
            await this.loadCategories();
            this.setupSettings();
        } catch (error) {
            Utils.showMessage('Failed to load dashboard data', 'error');
        }
    }

    async loadDashboard() {
        const data = await ApiService.getDashboardSummary();
        this.updateDashboard(data);
        this.loadCharts(data);
        this.generateInsights(data);
    }

    async loadCategories() {
        this.categories = await ApiService.getCategories();
        this.populateCategoryDropdowns();
        
        // Load categories in categories section
        if (document.getElementById('categoriesContainer')) {
            this.displayCategories();
        }
    }

    updateDashboard(data) {
        // Update summary cards
        document.getElementById('totalExpenses').textContent = Utils.formatCurrency(data.totalExpenses, data.currency);
        document.getElementById('remainingBudget').textContent = Utils.formatCurrency(data.remainingBudget, data.currency);
        document.getElementById('transactionCount').textContent = data.transactionCount;
        document.getElementById('dailyAverage').textContent = Utils.formatCurrency(data.dailyAverage, data.currency);

        // Update budget progress
        const progressFill = document.getElementById('budgetProgress');
        const budgetPercentage = document.getElementById('budgetPercentage');
        const spentAmount = document.getElementById('spentAmount');
        const totalBudget = document.getElementById('totalBudget');
        const budgetAlert = document.getElementById('budgetAlert');

        if (progressFill) {
            progressFill.style.width = `${Math.min(100, data.budgetPercentage)}%`;
        }
        if (budgetPercentage) {
            budgetPercentage.textContent = `${data.budgetPercentage.toFixed(1)}%`;
        }
        if (spentAmount) {
            spentAmount.textContent = Utils.formatCurrency(data.totalExpenses, data.currency);
        }
        if (totalBudget) {
            totalBudget.textContent = Utils.formatCurrency(data.monthlyBudget, data.currency);
        }

        // Show budget alerts
        if (budgetAlert) {
            if (data.budgetPercentage >= 90) {
                budgetAlert.textContent = '⚠ You have exceeded your budget!';
                budgetAlert.className = 'alert danger';
                budgetAlert.classList.remove('hidden');
            } else if (data.budgetPercentage >= 80) {
                budgetAlert.textContent = '⚠ You\'ve spent 80% of your budget!';
                budgetAlert.className = 'alert warning';
                budgetAlert.classList.remove('hidden');
            } else {
                budgetAlert.classList.add('hidden');
            }
        }
    }

    populateCategoryDropdowns() {
        const expenseCategory = document.getElementById('expenseCategory');
        const categoryFilter = document.getElementById('categoryFilter');

        if (expenseCategory) {
            expenseCategory.innerHTML = '<option value="">Select Category</option>';
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.name;
                option.textContent = category.name;
                expenseCategory.appendChild(option);
            });
        }

        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">All Categories</option>';
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.name;
                option.textContent = category.name;
                categoryFilter.appendChild(option);
            });
        }
    }

    displayCategories() {
        const container = document.getElementById('categoriesContainer');
        if (!container) return;

        container.innerHTML = '';
        
        // Get category stats from dashboard data
        // This would need to be implemented based on your data structure
        this.categories.forEach(category => {
            const categoryCard = document.createElement('div');
            categoryCard.className = 'category-card';
            categoryCard.innerHTML = `
                <div class="category-icon" style="background-color: ${category.color}">
                    <i class="fas fa-${category.icon}"></i>
                </div>
                <div class="category-name">${category.name}</div>
                <div class="category-amount">₹0</div>
                <div class="category-count">0 transactions</div>
            `;
            container.appendChild(categoryCard);
        });
    }

    async handleExpenseSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const expenseData = {
            title: formData.get('title') || document.getElementById('expenseTitle').value,
            amount: formData.get('amount') || document.getElementById('expenseAmount').value,
            category: formData.get('category') || document.getElementById('expenseCategory').value,
            payment_method: formData.get('payment_method') || document.getElementById('expensePayment').value,
            date: formData.get('date') || document.getElementById('expenseDate').value,
            notes: formData.get('notes') || document.getElementById('expenseNotes').value
        };

        try {
            await ApiService.addExpense(expenseData);
            e.target.reset();
            document.getElementById('expenseDate').valueAsDate = new Date();
            Utils.showMessage('Expense added successfully!', 'success');
            await this.loadDashboard();
        } catch (error) {
            Utils.showMessage(error.message, 'error');
        }
    }

    handleNavigation(e) {
        e.preventDefault();
        const link = e.target.closest('a');
        const target = link.getAttribute('href').substring(1);
        
        // Update active nav item
        document.querySelectorAll('.sidebar-menu li').forEach(item => {
            item.classList.remove('active');
        });
        link.parentElement.classList.add('active');
        
        // Show target section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(target).classList.add('active');
        
        // Load section-specific data
        if (target === 'categories') {
            this.displayCategories();
        }
    }

    updateUserInfo() {
        const user = Utils.getCurrentUser();
        const welcomeElement = document.getElementById('userWelcome');
        if (welcomeElement && user.name) {
            welcomeElement.textContent = `Welcome, ${user.name}! 👋`;
        }
    }

    async exportToCSV() {
        try {
            await ApiService.exportToCSV();
            Utils.showMessage('Expenses exported successfully!', 'success');
        } catch (error) {
            Utils.showMessage('Failed to export expenses', 'error');
        }
    }

    async saveBudget() {
        const budgetInput = document.getElementById('monthlyBudget');
        const budgetValue = parseFloat(budgetInput.value);

        if (!budgetValue || budgetValue <= 0) {
            Utils.showMessage('Please enter a valid budget amount', 'error');
            return;
        }

        try {
            await ApiService.updateSettings({ monthly_budget: budgetValue });
            Utils.showMessage('Budget updated successfully!', 'success');
            await this.loadDashboard();
        } catch (error) {
            Utils.showMessage('Failed to update budget', 'error');
        }
    }

    setupSettings() {
        // This would load current settings from API
        const budgetInput = document.getElementById('monthlyBudget');
        if (budgetInput) {
            budgetInput.value = 10000; // Default value
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }

    // Chart and insights methods would go here (similar to previous implementation)
    loadCharts(data) {
        // Implementation for charts
    }

    generateInsights(data) {
        // Implementation for insights
    }

    filterExpenses() {
        // Implementation for filtering
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new DashboardManager();
});