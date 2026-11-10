# My Notes — Full-Stack Notes Management

React (Vite) + FastAPI + SQLAlchemy + MySQL (SQLite fallback for local dev/tests).

## Setup
Backend:
```
cd backend
python -m venv .venv; .venv\Scripts\activate   (Windows)  /  source .venv/bin/activate (macOS/Linux)
pip install -r requirements.txt
copy .env.example .env   (then edit SECRET_KEY and DATABASE_URL)
uvicorn app.main:app --reload --port 8000
```
MySQL: `mysql -u root -p < ..\database\schema.sql` then set in `.env`:
`DATABASE_URL=mysql+pymysql://root:PASSWORD@localhost:3306/my_notes_db` (remove any `my_notes.db`/`test_*.db`).
Without MySQL, leave the SQLite default — the app runs identically; tests use SQLite.
Swagger: http://127.0.0.1:8000/docs

Frontend:
```
cd frontend
npm install
copy .env.example .env
npm run dev   -> http://localhost:5173
```

## Tests
```
cd backend; python -m pytest tests -v
cd frontend; npm test   (vitest smoke test)
```

## Notes / limitations
- Reminders: in-app polling of `GET /api/reminders/due` every 30s (banner + badge); no OS push notifications.
- Alembic: `backend/migrations/` + `alembic.ini` provided; initial autogenerate needs MySQL `DATABASE_URL`. Dev uses `create_all`.
- Auth: bcrypt (direct `bcrypt` lib, not passlib — passlib 1.7.4 is incompatible with bcrypt >=4.1/5.x) + PyJWT.
