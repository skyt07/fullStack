import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../services/api";
const Ctx = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        if (localStorage.getItem("token")) setUser((await authApi.me()).data);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  const login = async (d) => {
    const r = await authApi.login(d);
    localStorage.setItem("token", r.data.access_token);
    setUser((await authApi.me()).data);
  };
  const register = async (d) => {
    const r = await authApi.register(d);
    localStorage.setItem("token", r.data.access_token);
    setUser((await authApi.me()).data);
  };
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };
  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </Ctx.Provider>
  );
}
export const useAuth = () => useContext(Ctx);
