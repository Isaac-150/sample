const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'expense_tracker.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        monthly_budget DECIMAL DEFAULT 10000,
        currency TEXT DEFAULT '₹',
        theme TEXT DEFAULT 'light',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Categories table
    db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#3b82f6',
        icon TEXT DEFAULT 'tag',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(user_id, name)
    )`);

    // Expenses table
    db.run(`CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT NOT NULL,
        amount DECIMAL NOT NULL,
        category TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        date DATE NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Insert default categories for new users
    db.get("SELECT COUNT(*) as count FROM categories", (err, row) => {
        if (row.count === 0) {
            const defaultCategories = [
                { name: 'Food', color: '#ef4444', icon: 'utensils' },
                { name: 'Travel', color: '#3b82f6', icon: 'car' },
                { name: 'Shopping', color: '#8b5cf6', icon: 'shopping-bag' },
                { name: 'Entertainment', color: '#f59e0b', icon: 'film' },
                { name: 'Bills', color: '#10b981', icon: 'file-invoice' },
                { name: 'Healthcare', color: '#06b6d4', icon: 'heartbeat' },
                { name: 'Education', color: '#ec4899', icon: 'book' },
                { name: 'Other', color: '#64748b', icon: 'circle' }
            ];

            const stmt = db.prepare("INSERT INTO categories (user_id, name, color, icon) VALUES (NULL, ?, ?, ?)");
            defaultCategories.forEach(cat => {
                stmt.run([cat.name, cat.color, cat.icon]);
            });
            stmt.finalize();
        }
    });
}

module.exports = db;