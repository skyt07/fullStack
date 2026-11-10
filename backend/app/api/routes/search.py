from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...db.session import get_db
from ...models.models import User, Note
from ...schemas.schemas import NoteOut
from ...dependencies.auth import get_current_user

router = APIRouter(prefix="/api/search", tags=["search"])

@router.get("", response_model=list[NoteOut])
def search(q: str = "", user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not q.strip():
        return []
    return db.query(Note).filter(Note.user_id == user.id, Note.is_deleted == False,
        (Note.title.ilike(f"%{q}%")) | (Note.content.ilike(f"%{q}%"))).order_by(Note.updated_at.desc()).all()

