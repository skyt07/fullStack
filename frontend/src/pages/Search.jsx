import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchApi, notesApi, foldersApi, errMsg } from "../services/api";
import { NoteCard, NoteModal } from "../components/Notes";
export default function Search() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [items, setItems] = useState([]);
  const [folders, setFolders] = useState([]);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(null);
  const load = () => {
    if (!q.trim()) {
      setItems([]);
      return;
    }
    searchApi
      .search(q)
      .then((r) => setItems(r.data))
      .catch((e) => setErr(errMsg(e)));
  };
  useEffect(() => {
    load();
    foldersApi
      .list()
      .then((r) => setFolders(r.data))
      .catch((e) => setErr(errMsg(e)));
  }, [q]);
  return (
    <div>
      <h1>Search results for “{q}”</h1>
      {err && <p className="error">{err}</p>}
      <div className="grid">
        {items.map((n) => (
          <NoteCard
            key={n.id}
            note={n}
            onEdit={setEditing}
            onPin={async (id) => {
              await notesApi.pin(id);
              load();
            }}
            onArchive={async (id) => {
              await notesApi.archive(id);
              load();
            }}
            onTrash={async (id) => {
              await notesApi.trash(id);
              load();
            }}
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
      {items.length === 0 && <p className="empty">No matches.</p>}
      {editing && (
        <NoteModal
          note={editing}
          folders={folders}
          onClose={() => setEditing(null)}
          onSave={async (d) => {
            await notesApi.update(editing.id, d);
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}
