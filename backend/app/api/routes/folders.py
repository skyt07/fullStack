from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...db.session import get_db
from ...models.models import User, Folder, Note
from ...schemas.schemas import FolderIn, FolderOut, NoteOut
from ...dependencies.auth import get_current_user

router = APIRouter(prefix="/api/folders", tags=["folders"])

def _own(db, user, fid):
    f = db.query(Folder).filter(Folder.id == fid, Folder.user_id == user.id).first()
    if not f: raise HTTPException(404, "Folder not found")
    return f

def _with_count(db, f):
    f.note_count = db.query(Note).filter(Note.folder_id == f.id, Note.is_deleted == False).count()
    return f

@router.get("", response_model=list[FolderOut])
def list_folders(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return [_with_count(db, f) for f in db.query(Folder).filter(Folder.user_id == user.id).all()]

@router.post("", response_model=FolderOut, status_code=201)
def create(payload: FolderIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    f = Folder(user_id=user.id, name=payload.name, color=payload.color)
    db.add(f); db.commit(); db.refresh(f); return _with_count(db, f)

@router.put("/{folder_id}", response_model=FolderOut)
def update(folder_id: int, payload: FolderIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    f = _own(db, user, folder_id); f.name = payload.name; f.color = payload.color
    db.commit(); db.refresh(f); return _with_count(db, f)

@router.delete("/{folder_id}")
def delete(folder_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    f = _own(db, user, folder_id)
    db.query(Note).filter(Note.folder_id == folder_id).update({"folder_id": None})  # keep notes
    db.delete(f); db.commit(); return {"detail": "Folder deleted; notes kept (folder cleared)"}

@router.get("/{folder_id}/notes", response_model=list[NoteOut])
def folder_notes(folder_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _own(db, user, folder_id)
    return db.query(Note).filter(Note.folder_id == folder_id, Note.user_id == user.id, Note.is_deleted == False).all()

