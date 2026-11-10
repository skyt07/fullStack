from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_serializer

class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(default="", max_length=255)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: int; email: str; full_name: str
    class Config: from_attributes = True

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, max_length=255)

class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)

class FolderIn(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    color: str = Field(default="blue", pattern="^(blue|pink|yellow|green|purple)$")

class FolderOut(BaseModel):
    id: int; user_id: int; name: str; color: str; note_count: int = 0
    class Config: from_attributes = True

class NoteIn(BaseModel):
    title: str = Field(default="Untitled", max_length=500)
    content: str = ""
    folder_id: Optional[int] = None
    color: str = Field(default="yellow", pattern="^(blue|pink|yellow|green|purple)$")
    is_pinned: bool = False

class NoteUpdate(NoteIn):
    pass

class NoteOut(BaseModel):
    id: int; user_id: int; folder_id: Optional[int]; title: str; content: str
    color: str; is_pinned: bool; is_archived: bool; is_deleted: bool
    created_at: Optional[datetime] = None; updated_at: Optional[datetime] = None
    class Config: from_attributes = True

class ColorIn(BaseModel):
    color: str = Field(pattern="^(blue|pink|yellow|green|purple)$")

class ReminderIn(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    remind_at: datetime
    note_id: Optional[int] = None

class ReminderOut(BaseModel):
    id: int; user_id: int; note_id: Optional[int]; title: str
    remind_at: datetime; is_completed: bool
    class Config: from_attributes = True

    @field_serializer("remind_at")
    def serialize_remind_at(self, value: datetime) -> datetime:
        # Database stores UTC as a naive datetime for MySQL/SQLite portability.
        # Mark it as UTC in JSON so browsers display the correct local time.
        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)

class SettingsOut(BaseModel):
    theme: str = "light"; notifications_enabled: bool = True; default_note_color: str = "yellow"

class SettingsUpdate(SettingsOut):
    pass
