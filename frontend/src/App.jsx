import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./layouts/Layout";
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import Folders from "./pages/Folders";
import Reminders from "./pages/Reminders";
import ArchiveTrash from "./pages/ArchiveTrash";
import Search from "./pages/Search";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p style={{ padding: 20 }}>Loading…</p>;
  return user ? children : <Navigate to="/login" />;
}
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route
            element={
              <Protected>
                <Layout />
              </Protected>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/folders" element={<Folders />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/archive" element={<ArchiveTrash mode="archive" />} />
            <Route path="/trash" element={<ArchiveTrash mode="trash" />} />
            <Route path="/search" element={<Search />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
