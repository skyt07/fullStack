import { useEffect, useState } from "react";
import { dashboardApi, notesApi, foldersApi, errMsg } from "../services/api";
import { NoteCard, NoteModal } from "../components/Notes";
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState("");
  const load = () =>
    Promise.all([
      dashboardApi.stats(),
      dashboardApi.recentNotes(),
      dashboardApi.recentFolders(),
    ])
      .then(([s, n, f]) => {
        setStats(s.data);
        setNotes(n.data);
        setFolders(f.data);
      })
      .catch((e) => setErr(errMsg(e)));
  useEffect(() => {
    load();
  }, []);
  const save = async (d) => {
    try {
      editing?.id
        ? await notesApi.update(editing.id, d)
        : await notesApi.create(d);
      setEditing(null);
      load();
    } catch (e) {
      setErr(errMsg(e));
    }
  };
  const act = (fn) => async (id) => {
    try {
      await fn(id);
      load();
    } catch (e) {
      setErr(errMsg(e));
    }
  };
  if (!stats) return <p>{err || "Loading…"}</p>;
  return (
    <div>
      <h1>Welcome{stats ? "" : ""}</h1>
      <p>{new Date().toLocaleString()}</p>
      {err && <p className="error">{err}</p>}
      <div className="stats">
        {[
          ["Total notes", stats.total_notes],
          ["Folders", stats.total_folders],
          ["Pinned", stats.pinned_notes],
          ["Upcoming reminders", stats.upcoming_reminders],
        ].map(([k, v]) => (
          <div className="stat" key={k}>
            <small>{k}</small>
            <br />
            <b>{v}</b>
          </div>
        ))}
      </div>
      <h2>Recent Folders</h2>
      {folders.length === 0 ? (
        <p className="empty">No folders yet</p>
      ) : (
        <div className="grid">
          {folders.map((f) => (
            <div key={f.id} className={`card ${f.color}`}>
              <h3>{f.name}</h3>
              <small>{f.note_count} notes</small>
            </div>
          ))}
        </div>
      )}
      <h2 style={{ marginTop: 24 }}>My Notes</h2>
      <div className="grid">
        <button className="card" onClick={() => setEditing({})}>
          + Create New Note
        </button>
        {notes.map((n) => (
          <NoteCard
            key={n.id}
            note={n}
            onEdit={setEditing}
            onPin={act(notesApi.pin)}
            onArchive={act(notesApi.archive)}
            onTrash={act(notesApi.trash)}
            onColor={async (id, c) => {
              try {
                await notesApi.color(id, c);
                load();
              } catch (e) {
                setErr(errMsg(e));
              }
            }}
          />
        ))}
      </div>
      {notes.length === 0 && (
        <p className="empty">No notes yet — create your first one.</p>
      )}
      {editing && (
        <NoteModal
          note={editing.id ? editing : null}
          folders={folders}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}
