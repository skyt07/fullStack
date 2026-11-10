from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .db.session import engine, Base
from .models import models  # noqa: F401  (register tables)
from .api.routes import auth, dashboard, notes, folders, reminders, search, settings as settings_route

Base.metadata.create_all(bind=engine)  # dev convenience; production: use Alembic

app = FastAPI(title="My Notes API", version="1.0.0")
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")] if settings.CORS_ORIGINS else ["http://localhost:5173"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

router_root = APIRouter()
@router_root.get("/health")
def health():
    return {"status": "ok"}

for r in (auth.router, dashboard.router, notes.router, folders.router, reminders.router, search.router, settings_route.router, router_root):
    app.include_router(r)
