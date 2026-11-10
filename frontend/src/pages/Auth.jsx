import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../services/api";
export default function Auth({ mode }) {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });
  const submit = async (e) => {
    e.preventDefault();
    try {
      mode === "login" ? await login(form) : await register(form);
      nav("/");
    } catch (e) {
      setErr(errMsg(e));
    }
  };
  return (
    <div className="auth-wrap">
      <form className="panel auth-card" onSubmit={submit}>
        <h1>MY NOTES</h1>
        <h2>{mode === "login" ? "Login" : "Register"}</h2>
        {err && <p className="error">{err}</p>}
        {mode === "register" && (
          <input
            className="input"
            placeholder="Full name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        )}
        <input
          className="input"
          type="email"
          placeholder="Email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={{ marginTop: 10 }}
        />
        <input
          className="input"
          type="password"
          placeholder="Password (8+ chars)"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          style={{ marginTop: 10 }}
        />
        <button className="btn" style={{ width: "100%", marginTop: 14 }}>
          {mode === "login" ? "Login" : "Create account"}
        </button>
        <p>
          {mode === "login" ? (
            <>
              No account? <Link to="/register">Register</Link>
            </>
          ) : (
            <>
              Have an account? <Link to="/login">Login</Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
