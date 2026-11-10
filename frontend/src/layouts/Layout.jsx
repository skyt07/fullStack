import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  StickyNote,
  Folder,
  Bell,
  Archive,
  Trash2,
  Settings,
  Menu,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { remindersApi } from "../services/api";
const links = [
  ["/", "Dashboard", LayoutDashboard],
  ["/notes", "My Notes", StickyNote],
  ["/folders", "Folders", Folder],
  ["/reminders", "Reminders", Bell],
  ["/archive", "Archive", Archive],
  ["/trash", "Trash", Trash2],
  ["/settings", "Settings", Settings],
];
export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [due, setDue] = useState([]);
  useEffect(() => {
    const f = () =>
      remindersApi
        .due()
        .then((r) => setDue(r.data))
        .catch(() => {});
    f();
    const t = setInterval(f, 30000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="layout">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="logo">MY NOTES</div>
        {links.map(([to, label, Icon]) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            onClick={() => setOpen(false)}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
        <div className="side-user">
          <div className="avatar">
            {(user?.full_name || user?.email || "?")[0].toUpperCase()}
          </div>
          <div>
            <b>{user?.full_name || "User"}</b>
            <br />
            <small>{user?.email}</small>
          </div>
        </div>
      </aside>
      <main className="main">
        <div className="topbar">
          <button
            className="btn secondary hamburger"
            onClick={() => setOpen(!open)}
          >
            <Menu size={18} />
          </button>
          <input
            className="search"
            placeholder="Search notes…"
            onKeyDown={(e) =>
              e.key === "Enter" &&
              nav(`/search?q=${encodeURIComponent(e.target.value)}`)
            }
          />
          <span title="Due reminders">
            <Bell size={20} />
            {due.length > 0 && <b> {due.length}</b>}
          </span>
          <button
            className="btn secondary"
            onClick={() => {
              logout();
              nav("/login");
            }}
          >
            Logout
          </button>
        </div>
        {due.length > 0 && (
          <div className="panel" style={{ marginBottom: 14 }}>
            <b>Due reminders:</b>{" "}
            {due.map((r) => (
              <div key={r.id}>
                {r.title} — {new Date(r.remind_at).toLocaleString()}
              </div>
            ))}
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
