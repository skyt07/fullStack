# My Notes — QA and bug-fix report

## Additional fixes in this pass

- Fixed Dashboard's "Create New Note" action: an empty editing object was treated as an existing note and attempted `PUT /api/notes/undefined`; it now correctly creates a note.
- Dashboard recent notes now exclude archived notes and cap the requested limit.
- Fixed reminder response timestamps: UTC values stored in the database are now serialized with a UTC offset, so browsers render the correct local time.
- Added automated backend coverage for profile/password changes, folder rename/delete and note listing, note update, reminder update/due/delete, settings, note filters, invalid folder references, and timezone conversion.

## Verification results

- Python application source compilation: PASS.
- Backend API integration tests: 5 passed.
- Important test-environment limitation: `bcrypt` was unavailable in this runtime. For the API integration run only, a temporary in-memory bcrypt-compatible shim was used to exercise authentication flows. The shim was not added to the project. Install the real dependencies locally and rerun `python -m pytest tests -v` to verify the real bcrypt implementation.
- Frontend test/build: NOT RUN. The supplied `node_modules` directory contains empty package directories and the environment could not fetch npm packages. Run `npm ci`, `npm test`, and `npm run build` locally.
- MySQL runtime: NOT RUN. The integration tests use the project's SQLite test database. Configure MySQL in `backend/.env` and verify with the local server.

## Start and verify locally

Backend (from `backend/`):

```bash
pip install -r requirements.txt
python -m pytest tests -v
uvicorn app.main:app --reload --port 8000
```

Frontend (from `frontend/`):

```bash
npm ci
npm test
npm run build
npm run dev
```

Open `http://localhost:5173`; API docs are at `http://127.0.0.1:8001/docs`.
