import { useEffect, useState } from "react";
import { notesApi, errMsg } from "../services/api";
import { NoteCard } from "../components/Notes";
export default function ArchiveTrash({ mode }) {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const load = () =>
    (mode === "archive" ? notesApi.archived() : notesApi.trashed())
      .then((r) => setItems(r.data))
      .catch((e) => setErr(errMsg(e)));
  useEffect(() => {
    load();
  }, [mode]);
  const act = (fn) => async (id) => {
    try {
      await fn(id);
      load();
    } catch (e) {
      setErr(errMsg(e));
    }
  };
  const emptyTrash = async () => {
    if (!confirm("Permanently delete all trashed notes?")) return;
    try {
      for (const n of items) await notesApi.permanent(n.id);
      load();
    } catch (e) {
      setErr(errMsg(e));
    }
  };
  return (
    <div>
      <div className="row">
        <h1 style={{ flex: 1 }}>{mode === "archive" ? "Archive" : "Trash"}</h1>
        {mode === "trash" && items.length > 0 && (
          <button className="btn secondary" onClick={emptyTrash}>
            Empty trash
          </button>
        )}
      </div>
      {err && <p className="error">{err}</p>}
      <div className="grid">
        {items.map((n) => (
          <NoteCard
            key={n.id}
            note={n}
            mode={mode === "trash" ? "trash" : "archive"}
            onRestore={act(notesApi.restore)}
            onDelete={act(notesApi.permanent)}
            onTrash={act(notesApi.trash)}
          />
        ))}
      </div>
      {items.length === 0 && <p className="empty">Nothing here.</p>}
    </div>
  );
}
