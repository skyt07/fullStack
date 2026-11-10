from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from ...db.session import get_db
from ...models.models import User, Note, Folder, Reminder
from ...dependencies.auth import get_current_user
from ...schemas.schemas import NoteOut, FolderOut

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats")
def stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    base = db.query(Note).filter(Note.user_id == user.id, Note.is_deleted == False)
    return {
        "total_notes": base.filter(Note.is_archived == False).count(),
        "total_folders": db.query(Folder).filter(Folder.user_id == user.id).count(),
        "pinned_notes": base.filter(Note.is_pinned == True).count(),
        "archived_notes": base.filter(Note.is_archived == True).count(),
        "trashed_notes": db.query(Note).filter(Note.user_id == user.id, Note.is_deleted == True).count(),
        "total_reminders": db.query(Reminder).filter(Reminder.user_id == user.id).count(),
        "upcoming_reminders": db.query(Reminder).filter(Reminder.user_id == user.id, Reminder.is_completed == False, Reminder.remind_at >= datetime.now(timezone.utc).replace(tzinfo=None)).count(),
    }

@router.get("/recent-notes", response_model=list[NoteOut])
def recent_notes(limit: int = 8, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Note).filter(Note.user_id == user.id, Note.is_deleted == False, Note.is_archived == False).order_by(Note.updated_at.desc()).limit(max(1, min(limit, 50))).all()

@router.get("/recent-folders", response_model=list[FolderOut])
def recent_folders(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    folders = db.query(Folder).filter(Folder.user_id == user.id).order_by(Folder.updated_at.desc()).limit(8).all()
    for f in folders:
        f.note_count = db.query(Note).filter(Note.folder_id == f.id, Note.is_deleted == False).count()
    return folders

