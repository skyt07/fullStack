from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ...db.session import get_db
from ...models.models import User, Note, Folder
from ...schemas.schemas import NoteIn, NoteUpdate, NoteOut, ColorIn
from ...dependencies.auth import get_current_user

router = APIRouter(prefix="/api/notes", tags=["notes"])

def _own(db: Session, user: User, note_id: int) -> Note:
    # archive/trash included; callers filter as needed
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == user.id).first()
    if not note:
        raise HTTPException(404, "Note not found")
    return note

def _check_folder(db, user, folder_id):
    if folder_id is not None and not db.query(Folder).filter(Folder.id == folder_id, Folder.user_id == user.id).first():
        raise HTTPException(400, "Folder not found")

# NOTE: /archive and /trash MUST be declared before /{note_id}
@router.get("/archive", response_model=list[NoteOut])
def archived(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Note).filter(Note.user_id == user.id, Note.is_archived == True, Note.is_deleted == False).order_by(Note.updated_at.desc()).all()

@router.get("/trash", response_model=list[NoteOut])
def trashed(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Note).filter(Note.user_id == user.id, Note.is_deleted == True).order_by(Note.updated_at.desc()).all()

@router.get("", response_model=list[NoteOut])
def list_notes(folder_id: Optional[int] = None, color: Optional[str] = None, pinned: Optional[bool] = None,
               sort: str = "updated", q: Optional[str] = None,
               user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Note).filter(Note.user_id == user.id, Note.is_deleted == False, Note.is_archived == False)
    if folder_id is not None: query = query.filter(Note.folder_id == folder_id)
    if color: query = query.filter(Note.color == color)
    if pinned is not None: query = query.filter(Note.is_pinned == pinned)
    if q: query = query.filter((Note.title.ilike(f"%{q}%")) | (Note.content.ilike(f"%{q}%")))
    order = {"created": Note.created_at.desc(), "updated": Note.updated_at.desc(), "title": Note.title.asc()}.get(sort, Note.updated_at.desc())
    return query.order_by(Note.is_pinned.desc(), order).all()

@router.post("", response_model=NoteOut, status_code=201)
def create(payload: NoteIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _check_folder(db, user, payload.folder_id)
    note = Note(user_id=user.id, **payload.model_dump())
    db.add(note); db.commit(); db.refresh(note)
    return note

@router.get("/{note_id}", response_model=NoteOut)
def get(note_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _own(db, user, note_id)

@router.put("/{note_id}", response_model=NoteOut)
def update(note_id: int, payload: NoteUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = _own(db, user, note_id); _check_folder(db, user, payload.folder_id)
    for k, v in payload.model_dump().items(): setattr(note, k, v)
    db.commit(); db.refresh(note)
    return note

@router.delete("/{note_id}")
def delete(note_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = _own(db, user, note_id); note.is_deleted = True  # soft delete
    db.commit(); return {"detail": "Moved to trash"}

@router.delete("/{note_id}/permanent")
def permanent(note_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = _own(db, user, note_id); db.delete(note); db.commit(); return {"detail": "Permanently deleted"}

@router.patch("/{note_id}/pin", response_model=NoteOut)
def pin(note_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = _own(db, user, note_id); n.is_pinned = not n.is_pinned; db.commit(); db.refresh(n); return n

@router.patch("/{note_id}/archive", response_model=NoteOut)
def archive(note_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = _own(db, user, note_id); n.is_archived = True; db.commit(); db.refresh(n); return n

@router.patch("/{note_id}/restore", response_model=NoteOut)
def restore(note_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = _own(db, user, note_id); n.is_archived = False; n.is_deleted = False; db.commit(); db.refresh(n); return n

@router.patch("/{note_id}/trash", response_model=NoteOut)
def trash(note_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = _own(db, user, note_id); n.is_deleted = True; db.commit(); db.refresh(n); return n

@router.patch("/{note_id}/color", response_model=NoteOut)
def color(note_id: int, payload: ColorIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = _own(db, user, note_id); n.color = payload.color; db.commit(); db.refresh(n); return n

