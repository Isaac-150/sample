const db = require('../database/database');
const bcrypt = require('bcryptjs');

class User {
    static create(userData, callback) {
        const { name, email, password } = userData;
        
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) return callback(err);
            
            const sql = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
            db.run(sql, [name, email, hashedPassword], function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return callback(new Error('Email already exists'));
                    }
                    return callback(err);
                }
                
                // Copy default categories for the new user
                const copyCategoriesSql = `
                    INSERT INTO categories (user_id, name, color, icon)
                    SELECT ?, name, color, icon FROM categories WHERE user_id IS NULL
                `;
                db.run(copyCategoriesSql, [this.lastID], (err) => {
                    if (err) console.error('Error copying categories:', err);
                    callback(null, { id: this.lastID, name, email });
                });
            });
        });
    }

    static findByEmail(email, callback) {
        const sql = `SELECT * FROM users WHERE email = ?`;
        db.get(sql, [email], (err, row) => {
            callback(err, row);
        });
    }

    static updateSettings(userId, settings, callback) {
        const { monthly_budget, currency, theme } = settings;
        const sql = `UPDATE users SET monthly_budget = ?, currency = ?, theme = ? WHERE id = ?`;
        db.run(sql, [monthly_budget, currency, theme, userId], function(err) {
            callback(err, this.changes);
        });
    }

    static getSettings(userId, callback) {
        const sql = `SELECT monthly_budget, currency, theme FROM users WHERE id = ?`;
        db.get(sql, [userId], callback);
    }
}

module.exports = User;