from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...db.session import get_db
from ...models.models import User, Reminder, Note
from ...schemas.schemas import ReminderIn, ReminderOut
from ...dependencies.auth import get_current_user

router = APIRouter(prefix="/api/reminders", tags=["reminders"])

def _own(db, user, rid):
    r = db.query(Reminder).filter(Reminder.id == rid, Reminder.user_id == user.id).first()
    if not r: raise HTTPException(404, "Reminder not found")
    return r

@router.get("", response_model=list[ReminderOut])
def list_r(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Reminder).filter(Reminder.user_id == user.id).order_by(Reminder.remind_at).all()

@router.post("", response_model=ReminderOut, status_code=201)
def create(payload: ReminderIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.note_id and not db.query(Note).filter(Note.id == payload.note_id, Note.user_id == user.id).first():
        raise HTTPException(400, "Note not found")
    values = payload.model_dump()
    remind_at = values["remind_at"]
    values["remind_at"] = remind_at.astimezone(timezone.utc).replace(tzinfo=None) if remind_at.tzinfo else remind_at
    r = Reminder(user_id=user.id, **values)
    db.add(r); db.commit(); db.refresh(r); return r

@router.put("/{reminder_id}", response_model=ReminderOut)
def update(reminder_id: int, payload: ReminderIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = _own(db, user, reminder_id)
    values = payload.model_dump()
    if values["note_id"] is not None and not db.query(Note).filter(Note.id == values["note_id"], Note.user_id == user.id).first():
        raise HTTPException(400, "Note not found")
    remind_at = values["remind_at"]
    values["remind_at"] = remind_at.astimezone(timezone.utc).replace(tzinfo=None) if remind_at.tzinfo else remind_at
    for k, v in values.items(): setattr(r, k, v)
    db.commit(); db.refresh(r); return r

@router.delete("/{reminder_id}")
def delete(reminder_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(_own(db, user, reminder_id)); db.commit(); return {"detail": "Deleted"}

@router.patch("/{reminder_id}/complete", response_model=ReminderOut)
def complete(reminder_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = _own(db, user, reminder_id); r.is_completed = not r.is_completed; db.commit(); db.refresh(r); return r

@router.get("/due", response_model=list[ReminderOut])
def due(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """In-app polling endpoint: reminders whose time has passed and not completed."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    return db.query(Reminder).filter(Reminder.user_id == user.id, Reminder.is_completed == False, Reminder.remind_at <= now).all()

