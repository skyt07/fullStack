import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi, settingsApi, errMsg } from "../services/api";
export default function Settings() {
  const { user, logout, setUser } = useAuth();
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [profile, setProfile] = useState({ full_name: user?.full_name || "" });
  const [pw, setPw] = useState({ current_password: "", new_password: "" });
  const [prefs, setPrefs] = useState({
    theme: "light",
    notifications_enabled: true,
    default_note_color: "yellow",
  });
  useEffect(() => {
    settingsApi
      .get()
      .then((r) => setPrefs(r.data))
      .catch((e) => setErr(errMsg(e)));
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = prefs.theme;
  }, [prefs.theme]);
  const saveProfile = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      const r = await authApi.profile(profile);
      setUser(r.data);
      setMsg("Profile saved");
    } catch (e) {
      setErr(errMsg(e));
    }
  };
  const savePw = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await authApi.changePassword(pw);
      setPw({ current_password: "", new_password: "" });
      setMsg("Password changed");
    } catch (e) {
      setErr(errMsg(e));
    }
  };
  const savePrefs = async () => {
    setErr("");
    setMsg("");
    try {
      setPrefs((await settingsApi.update(prefs)).data);
      setMsg("Preferences saved");
    } catch (e) {
      setErr(errMsg(e));
    }
  };
  return (
    <div>
      <h1>Settings</h1>
      {err && <p className="error">{err}</p>}
      {msg && <p>{msg}</p>}
      <form
        className="panel"
        onSubmit={saveProfile}
        style={{ marginBottom: 14 }}
      >
        <h3>Profile</h3>
        <input
          className="input"
          value={profile.full_name}
          onChange={(e) => setProfile({ full_name: e.target.value })}
          placeholder="Full name"
        />
        <button className="btn" style={{ marginTop: 10 }}>
          Save profile
        </button>
      </form>
      <form className="panel" onSubmit={savePw} style={{ marginBottom: 14 }}>
        <h3>Change password</h3>
        <input
          className="input"
          type="password"
          placeholder="Current"
          value={pw.current_password}
          onChange={(e) => setPw({ ...pw, current_password: e.target.value })}
        />
        <input
          className="input"
          type="password"
          placeholder="New (8+ chars)"
          style={{ marginTop: 8 }}
          value={pw.new_password}
          onChange={(e) => setPw({ ...pw, new_password: e.target.value })}
        />
        <button className="btn" style={{ marginTop: 10 }}>
          Change password
        </button>
      </form>
      <div className="panel">
        <h3>Preferences</h3>
        <div className="row">
          <select
            className="input"
            style={{ width: "auto" }}
            value={prefs.theme}
            onChange={(e) => setPrefs({ ...prefs, theme: e.target.value })}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          <label>
            <input
              type="checkbox"
              checked={prefs.notifications_enabled}
              onChange={(e) =>
                setPrefs({ ...prefs, notifications_enabled: e.target.checked })
              }
            />{" "}
            Notifications
          </label>
          <select
            className="input"
            style={{ width: "auto" }}
            value={prefs.default_note_color}
            onChange={(e) =>
              setPrefs({ ...prefs, default_note_color: e.target.value })
            }
          >
            {["blue", "pink", "yellow", "green", "purple"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button className="btn" onClick={savePrefs}>
            Save preferences
          </button>
          <button className="btn secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
