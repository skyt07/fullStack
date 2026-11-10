import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ["DATABASE_URL"] = "sqlite:///./test_my_notes.db"
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import engine, Base

@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

def _register(client, email="a@test.com"):
    r = client.post("/api/auth/register", json={"email": email, "password": "password123", "full_name": "A"})
    assert r.status_code == 201, r.text
    return r.json()["access_token"]

def test_auth_and_isolation(client):
    tok = _register(client)
    h = {"Authorization": f"Bearer {tok}"}
    assert client.get("/api/auth/me", headers=h).json()["email"] == "a@test.com"
    assert client.get("/api/notes").status_code == 401  # protected
    assert client.post("/api/auth/login", json={"email": "a@test.com", "password": "wrong"}).status_code == 401
    assert client.post("/api/auth/register", json={"email": "a@test.com", "password": "password123"}).status_code == 400  # duplicate

def test_notes_folders_reminders(client):
    h = {"Authorization": f"Bearer {_register(client)}"}
    f = client.post("/api/folders", headers=h, json={"name": "Work", "color": "blue"}); assert f.status_code == 201
    fid = f.json()["id"]
    n = client.post("/api/notes", headers=h, json={"title": "Hello", "content": "World", "folder_id": fid, "color": "pink"})
    assert n.status_code == 201; nid = n.json()["id"]
    assert client.patch(f"/api/notes/{nid}/pin", headers=h).json()["is_pinned"] is True
    assert client.patch(f"/api/notes/{nid}/color", headers=h, json={"color": "green"}).json()["color"] == "green"
    assert client.patch(f"/api/notes/{nid}/archive", headers=h).json()["is_archived"] is True
    assert len(client.get("/api/notes/archive", headers=h).json()) == 1
    assert client.patch(f"/api/notes/{nid}/restore", headers=h).json()["is_archived"] is False
    assert client.delete(f"/api/notes/{nid}", headers=h).status_code == 200
    assert len(client.get("/api/notes/trash", headers=h).json()) == 1
    assert client.patch(f"/api/notes/{nid}/restore", headers=h).json()["is_deleted"] is False
    r = client.post("/api/reminders", headers=h, json={"title": "Call", "remind_at": "2030-01-01T10:00:00"})
    assert r.status_code == 201
    rid = r.json()["id"]
    assert client.patch(f"/api/reminders/{rid}/complete", headers=h).json()["is_completed"] is True
    assert client.get("/api/search?q=Hello", headers=h).json()[0]["id"] == nid
    s = client.get("/api/dashboard/stats", headers=h).json()
    assert s["total_notes"] == 1 and s["total_folders"] == 1
    # second user cannot see first user's note
    h2 = {"Authorization": f"Bearer {_register(client, 'b@test.com')}"}
    assert client.get(f"/api/notes/{nid}", headers=h2).status_code == 404
    client.delete(f"/api/notes/{nid}/permanent", headers=h)
    assert client.get(f"/api/notes/{nid}", headers=h).status_code == 404


def test_settings_and_reminder_timezone_serialization(client):
    h = {"Authorization": f"Bearer {_register(client)}"}
    defaults = client.get("/api/settings", headers=h)
    assert defaults.status_code == 200
    assert defaults.json() == {
        "theme": "light",
        "notifications_enabled": True,
        "default_note_color": "yellow",
    }

    updated = client.put("/api/settings", headers=h, json={
        "theme": "dark",
        "notifications_enabled": False,
        "default_note_color": "pink",
    })
    assert updated.status_code == 200
    assert updated.json()["theme"] == "dark"
    assert updated.json()["notifications_enabled"] is False

    reminder = client.post("/api/reminders", headers=h, json={
        "title": "Timezone check",
        "remind_at": "2030-01-01T10:00:00+05:30",
    })
    assert reminder.status_code == 201
    # 10:00 at UTC+05:30 is 04:30 UTC; the API must identify the UTC offset.
    assert reminder.json()["remind_at"].endswith("+00:00") or reminder.json()["remind_at"].endswith("Z")
    assert "04:30:00" in reminder.json()["remind_at"]


def test_note_filters_and_invalid_folder(client):
    h = {"Authorization": f"Bearer {_register(client)}"}
    bad = client.post("/api/notes", headers=h, json={
        "title": "Bad folder", "content": "x", "folder_id": 99999,
    })
    assert bad.status_code == 400

    first = client.post("/api/notes", headers=h, json={
        "title": "Alpha", "content": "project", "color": "blue", "is_pinned": True,
    })
    second = client.post("/api/notes", headers=h, json={
        "title": "Beta", "content": "personal", "color": "pink",
    })
    assert first.status_code == 201 and second.status_code == 201
    assert [n["title"] for n in client.get("/api/notes?color=blue&pinned=true", headers=h).json()] == ["Alpha"]
    assert [n["title"] for n in client.get("/api/search?q=personal", headers=h).json()] == ["Beta"]


def test_remaining_module_operations(client):
    h = {"Authorization": f"Bearer {_register(client)}"}

    # Profile update and password change
    profile = client.put("/api/auth/profile", headers=h, json={"full_name": "Updated User"})
    assert profile.status_code == 200 and profile.json()["full_name"] == "Updated User"
    changed = client.put("/api/auth/change-password", headers=h, json={
        "current_password": "password123", "new_password": "newpassword123",
    })
    assert changed.status_code == 200
    assert client.post("/api/auth/login", json={
        "email": "a@test.com", "password": "newpassword123",
    }).status_code == 200

    # Folder rename, note assignment/listing, and safe folder deletion
    folder = client.post("/api/folders", headers=h, json={"name": "Drafts", "color": "blue"})
    fid = folder.json()["id"]
    renamed = client.put(f"/api/folders/{fid}", headers=h, json={"name": "Final", "color": "green"})
    assert renamed.status_code == 200 and renamed.json()["name"] == "Final"

    note = client.post("/api/notes", headers=h, json={
        "title": "Before", "content": "Body", "folder_id": fid,
    })
    nid = note.json()["id"]
    edited = client.put(f"/api/notes/{nid}", headers=h, json={
        "title": "After", "content": "Edited body", "folder_id": fid,
        "color": "purple", "is_pinned": False,
    })
    assert edited.status_code == 200 and edited.json()["title"] == "After"
    assert len(client.get(f"/api/folders/{fid}/notes", headers=h).json()) == 1
    assert client.delete(f"/api/folders/{fid}", headers=h).status_code == 200
    assert client.get(f"/api/notes/{nid}", headers=h).json()["folder_id"] is None

    # Reminder update, due polling, completion, and delete
    reminder = client.post("/api/reminders", headers=h, json={
        "title": "Initial", "remind_at": "2020-01-01T00:00:00",
    })
    rid = reminder.json()["id"]
    updated = client.put(f"/api/reminders/{rid}", headers=h, json={
        "title": "Updated", "remind_at": "2020-01-02T00:00:00", "note_id": nid,
    })
    assert updated.status_code == 200 and updated.json()["title"] == "Updated"
    assert len(client.get("/api/reminders/due", headers=h).json()) == 1
    assert client.delete(f"/api/reminders/{rid}", headers=h).status_code == 200

    # Dashboard endpoints and permanent note deletion
    assert client.get("/api/dashboard/recent-notes", headers=h).status_code == 200
    assert client.get("/api/dashboard/recent-folders", headers=h).status_code == 200
    assert client.delete(f"/api/notes/{nid}/permanent", headers=h).status_code == 200
