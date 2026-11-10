import { useState } from "react";
export const COLORS = ["blue", "pink", "yellow", "green", "purple"];
export function NoteCard({
  note,
  onEdit,
  onPin,
  onArchive,
  onTrash,
  onColor,
  onRestore,
  onDelete,
  mode,
}) {
  return (
    <div className={`card ${note.color}`}>
      <h3>{note.title || "Untitled"}</h3>
      <p>{(note.content || "").slice(0, 300)}</p>
      <small>{new Date(note.updated_at).toLocaleString()}</small>
      <div className="actions">
        {mode === "trash" ? (
          <>
            <button onClick={() => onRestore(note.id)}>Restore</button>
            <button onClick={() => onDelete(note.id)}>Delete forever</button>
          </>
        ) : mode === "archive" ? (
          <>
            <button onClick={() => onRestore(note.id)}>Restore to notes</button>
            <button onClick={() => onTrash(note.id)}>Move to trash</button>
          </>
        ) : (
          <>
            <button onClick={() => onEdit(note)}>Edit</button>
            <button onClick={() => onPin(note.id)}>
              {note.is_pinned ? "Unpin" : "Pin"}
            </button>
            <button onClick={() => onArchive(note.id)}>Archive</button>
            <button onClick={() => onTrash(note.id)}>Trash</button>
            {COLORS.map((c) => (
              <button
                key={c}
                title={c}
                onClick={() => onColor?.(note.id, c)}
                style={{ background: `var(--${c})`, width: 22 }}
              >
                {""}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
export function NoteModal({ note, folders, onClose, onSave }) {
  const [form, setForm] = useState(
    note || {
      title: "",
      content: "",
      folder_id: "",
      color: "yellow",
      is_pinned: false,
    },
  );
  const submit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      folder_id: form.folder_id ? Number(form.folder_id) : null,
    });
  };
  return (
    <div className="modal-bg" onClick={onClose}>
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <h2>{note ? "Edit note" : "New note"}</h2>
        <input
          className="input"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          className="input"
          rows="8"
          placeholder="Write…"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          style={{ marginTop: 10 }}
        />
        <div className="row" style={{ marginTop: 10 }}>
          <select
            className="input"
            style={{ width: "auto" }}
            value={form.folder_id || ""}
            onChange={(e) => setForm({ ...form, folder_id: e.target.value })}
          >
            <option value="">No folder</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <select
            className="input"
            style={{ width: "auto" }}
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
          >
            {COLORS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <label>
            <input
              type="checkbox"
              checked={!!form.is_pinned}
              onChange={(e) =>
                setForm({ ...form, is_pinned: e.target.checked })
              }
            />{" "}
            Pinned
          </label>
        </div>
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn">Save</button>
          <button type="button" className="btn secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
