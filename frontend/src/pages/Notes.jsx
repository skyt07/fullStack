import { useEffect, useState } from "react";
import { notesApi, foldersApi, errMsg } from "../services/api";
import { NoteCard, NoteModal } from "../components/Notes";
export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState({
    color: "",
    pinned: "",
    sort: "updated",
    folder_id: "",
  });
  const load = () =>
    notesApi
      .list({
        color: filter.color || undefined,
        pinned: filter.pinned === "" ? undefined : filter.pinned === "true",
        sort: filter.sort,
        folder_id: filter.folder_id || undefined,
      })
      .then((r) => setNotes(r.data))
      .catch((e) => setErr(errMsg(e)));
  useEffect(() => {
    foldersApi.list().then((r) => setFolders(r.data));
    load();
  }, [filter]);
  const save = async (d) => {
    try {
      editing.id
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
  return (
    <div>
      <div className="row">
        <h1 style={{ flex: 1 }}>My Notes</h1>
        <button className="btn" onClick={() => setEditing({})}>
          + New note
        </button>
      </div>
      <div className="row" style={{ marginBottom: 14 }}>
        <select
          className="input"
          style={{ width: "auto" }}
          value={filter.color}
          onChange={(e) => setFilter({ ...filter, color: e.target.value })}
        >
          <option value="">All colors</option>
          {["blue", "pink", "yellow", "green", "purple"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          className="input"
          style={{ width: "auto" }}
          value={filter.pinned}
          onChange={(e) => setFilter({ ...filter, pinned: e.target.value })}
        >
          <option value="">All</option>
          <option value="true">Pinned</option>
          <option value="false">Not pinned</option>
        </select>
        <select
          className="input"
          style={{ width: "auto" }}
          value={filter.sort}
          onChange={(e) => setFilter({ ...filter, sort: e.target.value })}
        >
          <option value="updated">Updated</option>
          <option value="created">Created</option>
          <option value="title">A–Z</option>
        </select>
        <select
          className="input"
          style={{ width: "auto" }}
          value={filter.folder_id}
          onChange={(e) => setFilter({ ...filter, folder_id: e.target.value })}
        >
          <option value="">All folders</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>
      {err && <p className="error">{err}</p>}
      <div className="grid">
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
      {notes.length === 0 && <p className="empty">No notes match.</p>}
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
