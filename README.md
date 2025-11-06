# Expense Tracker

Simple full-stack expense tracker example using:
- Backend: Node.js + Express
- DB: SQLite (better-sqlite3)
- Auth: JWT (bcryptjs for password hashing)
- Frontend: static HTML/CSS/vanilla JS

Getting started

1. Install dependencies

```powershell
cd "c:\New folder\expense-tracker\backend"
npm install
```

2. Start server

```powershell
npm start
```

3. Open the UI

Open `c:\New folder\expense-tracker\frontend\index.html` in a browser or visit http://localhost:3000 (server serves the frontend statically).

Environment

- `PORT` optionally to change port (default 3000)
- `JWT_SECRET` to set a production secret

APIs

- POST /api/auth/register  { name, email, password }
- POST /api/auth/login     { email, password }
- GET  /api/expenses      (requires Bearer token)
- POST /api/expenses      { amount, category, note?, date? }
