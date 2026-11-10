from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...db.session import get_db
from ...models.models import User, UserPreference
from ...schemas.schemas import SettingsOut, SettingsUpdate
from ...dependencies.auth import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])

def _prefs(db, user) -> UserPreference:
    p = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
    if not p:
        p = UserPreference(user_id=user.id); db.add(p); db.commit(); db.refresh(p)
    return p

@router.get("", response_model=SettingsOut)
def get_settings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = _prefs(db, user); return SettingsOut(theme=p.theme, notifications_enabled=p.notifications_enabled, default_note_color=p.default_note_color)

@router.put("", response_model=SettingsOut)
def update_settings(payload: SettingsUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = _prefs(db, user)
    p.theme = payload.theme; p.notifications_enabled = payload.notifications_enabled; p.default_note_color = payload.default_note_color
    db.commit()
    return SettingsOut(theme=p.theme, notifications_enabled=p.notifications_enabled, default_note_color=p.default_note_color)

