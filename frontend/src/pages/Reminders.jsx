import { useEffect, useState } from "react";
import { remindersApi, notesApi, errMsg } from "../services/api";
export default function Reminders() {
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState({ title: "", remind_at: "", note_id: "" });
  const [err, setErr] = useState("");
  const load = () => {
    remindersApi
      .list()
      .then((r) => setItems(r.data))
      .catch((e) => setErr(errMsg(e)));
    notesApi.list().then((r) => setNotes(r.data));
  };
  useEffect(() => {
    load();
  }, []);
  const create = async (e) => {
    e.preventDefault();
    try {
      await remindersApi.create({
        title: form.title,
        remind_at: new Date(form.remind_at).toISOString(),
        note_id: form.note_id ? Number(form.note_id) : null,
      });
      setForm({ title: "", remind_at: "", note_id: "" });
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
  const now = new Date();
  return (
    <div>
      <h1>Reminders</h1>
      {err && <p className="error">{err}</p>}
      <form className="row" onSubmit={create}>
        <input
          className="input"
          style={{ width: "auto" }}
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          className="input"
          style={{ width: "auto" }}
          type="datetime-local"
          value={form.remind_at}
          onChange={(e) => setForm({ ...form, remind_at: e.target.value })}
          required
        />
        <select
          className="input"
          style={{ width: "auto" }}
          value={form.note_id}
          onChange={(e) => setForm({ ...form, note_id: e.target.value })}
        >
          <option value="">No note</option>
          {notes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.title}
            </option>
          ))}
        </select>
        <button className="btn">Create</button>
      </form>
      {items.length === 0 ? (
        <p className="empty">No reminders</p>
      ) : (
        items.map((r) => {
          const overdue = !r.is_completed && new Date(r.remind_at) < now;
          return (
            <div key={r.id} className="panel row" style={{ marginTop: 10 }}>
              <span style={{ flex: 1 }}>
                {r.title} — {new Date(r.remind_at).toLocaleString()}{" "}
                {r.is_completed && "(done)"}{" "}
                {overdue && <b className="error">OVERDUE</b>}
              </span>
              <button
                className="btn secondary"
                onClick={() => act(remindersApi.complete)(r.id)}
              >
                {r.is_completed ? "Reopen" : "Complete"}
              </button>
              <button
                className="btn secondary"
                onClick={() => act(remindersApi.remove)(r.id)}
              >
                Delete
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
