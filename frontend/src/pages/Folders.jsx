import { useEffect, useState } from "react";
import { foldersApi, notesApi, errMsg } from "../services/api";
export default function Folders() {
  const [folders, setFolders] = useState([]);
  const [form, setForm] = useState({ name: "", color: "blue" });
  const [err, setErr] = useState("");
  const [view, setView] = useState(null);
  const load = () =>
    foldersApi
      .list()
      .then((r) => setFolders(r.data))
      .catch((e) => setErr(errMsg(e)));
  useEffect(() => {
    load();
  }, []);
  const create = async (e) => {
    e.preventDefault();
    try {
      await foldersApi.create(form);
      setForm({ name: "", color: "blue" });
      load();
    } catch (e) {
      setErr(errMsg(e));
    }
  };
  const rename = async (f) => {
    const name = prompt("New name", f.name);
    if (name?.trim()) {
      try {
        await foldersApi.update(f.id, { name: name.trim(), color: f.color });
        load();
      } catch (e) {
        setErr(errMsg(e));
      }
    }
  };
  const remove = async (f) => {
    if (confirm("Delete folder? Notes are kept.")) {
      try {
        await foldersApi.remove(f.id);
        if (view?.folder?.id === f.id) setView(null);
        load();
      } catch (e) {
        setErr(errMsg(e));
      }
    }
  };
  const showNotes = async (f) => {
    try {
      setView({ folder: f, items: (await foldersApi.notes(f.id)).data });
    } catch (e) {
      setErr(errMsg(e));
    }
  };
  const move = async (noteId, folderId) => {
    try {
      const n = (await notesApi.get(noteId)).data;
      await notesApi.update(noteId, {
        ...n,
        folder_id: folderId ? Number(folderId) : null,
      });
      showNotes(view.folder);
    } catch (e) {
      setErr(errMsg(e));
    }
  };
  return (
    <div>
      <h1>Folders</h1>
      {err && <p className="error">{err}</p>}
      <form className="row" onSubmit={create}>
        <input
          className="input"
          style={{ width: "auto" }}
          placeholder="Folder name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <select
          className="input"
          style={{ width: "auto" }}
          value={form.color}
          onChange={(e) => setForm({ ...form, color: e.target.value })}
        >
          {["blue", "pink", "yellow", "green", "purple"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button className="btn">Create</button>
      </form>
      <div className="grid" style={{ marginTop: 16 }}>
        {folders.map((f) => (
          <div key={f.id} className={`card ${f.color}`}>
            <h3>{f.name}</h3>
            <small>{f.note_count} notes</small>
            <div className="actions">
              <button onClick={() => rename(f)}>Rename</button>
              <button onClick={() => remove(f)}>Delete</button>
              <button onClick={() => showNotes(f)}>View notes</button>
            </div>
          </div>
        ))}
      </div>
      {view && (
        <div className="panel" style={{ marginTop: 16 }}>
          <h3>{view.folder?.name || "Folder notes"}</h3>
          {view.items.length === 0 ? (
            <p className="empty">Empty</p>
          ) : (
            view.items.map((n) => (
              <div key={n.id} className="row">
                <span style={{ flex: 1 }}>{n.title}</span>
                <select
                  onChange={(e) => move(n.id, e.target.value)}
                  defaultValue={n.folder_id || ""}
                >
                  <option value="">No folder</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
