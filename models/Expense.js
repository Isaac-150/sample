const dbModule = require('../database/database');

function createExpense(userId, amount, category, note, date) {
  const db = dbModule.getDB();
  const stmt = db.prepare('INSERT INTO expenses (user_id, amount, category, note, date) VALUES (?,?,?,?,?)');
  const info = stmt.run(userId, amount, category, note || '', date || new Date().toISOString());
  return { id: info.lastInsertRowid, user_id: userId, amount, category, note, date };
}

function getExpensesByUser(userId) {
  const db = dbModule.getDB();
  return db.prepare('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC').all(userId);
}

function getExpenseById(id, userId) {
  const db = dbModule.getDB();
  return db.prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?').get(id, userId);
}

function updateExpense(id, userId, fields) {
  const db = dbModule.getDB();
  const existing = getExpenseById(id, userId);
  if (!existing) return null;
  const amount = fields.amount !== undefined ? fields.amount : existing.amount;
  const category = fields.category !== undefined ? fields.category : existing.category;
  const note = fields.note !== undefined ? fields.note : existing.note;
  const date = fields.date !== undefined ? fields.date : existing.date;
  db.prepare('UPDATE expenses SET amount = ?, category = ?, note = ?, date = ? WHERE id = ? AND user_id = ?')
    .run(amount, category, note, date, id, userId);
  return getExpenseById(id, userId);
}

function deleteExpense(id, userId) {
  const db = dbModule.getDB();
  const res = db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?').run(id, userId);
  return res.changes > 0;
}

module.exports = { createExpense, getExpensesByUser, getExpenseById, updateExpense, deleteExpense };
