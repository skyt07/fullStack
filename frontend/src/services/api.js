import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8001",
});
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401 && !location.pathname.startsWith("/login")) {
      localStorage.removeItem("token");
      location.href = "/login";
    }
    return Promise.reject(e);
  },
);
export const errMsg = (e) => {
  const detail = e.response?.data?.detail;
  if (Array.isArray(detail))
    return detail.map((x) => x.msg || "Invalid input").join(", ");
  return typeof detail === "string"
    ? detail
    : e.message || "Something went wrong";
};
export const authApi = {
  register: (d) => api.post("/api/auth/register", d),
  login: (d) => api.post("/api/auth/login", d),
  me: () => api.get("/api/auth/me"),
  profile: (d) => api.put("/api/auth/profile", d),
  changePassword: (d) => api.put("/api/auth/change-password", d),
  logout: () => api.post("/api/auth/logout"),
};
export const dashboardApi = {
  stats: () => api.get("/api/dashboard/stats"),
  recentNotes: () => api.get("/api/dashboard/recent-notes"),
  recentFolders: () => api.get("/api/dashboard/recent-folders"),
};
export const notesApi = {
  list: (p) => api.get("/api/notes", { params: p }),
  create: (d) => api.post("/api/notes", d),
  get: (id) => api.get(`/api/notes/${id}`),
  update: (id, d) => api.put(`/api/notes/${id}`, d),
  trash: (id) => api.delete(`/api/notes/${id}`),
  pin: (id) => api.patch(`/api/notes/${id}/pin`),
  archive: (id) => api.patch(`/api/notes/${id}/archive`),
  restore: (id) => api.patch(`/api/notes/${id}/restore`),
  color: (id, color) => api.patch(`/api/notes/${id}/color`, { color }),
  archived: () => api.get("/api/notes/archive"),
  trashed: () => api.get("/api/notes/trash"),
  permanent: (id) => api.delete(`/api/notes/${id}/permanent`),
};
export const foldersApi = {
  list: () => api.get("/api/folders"),
  create: (d) => api.post("/api/folders", d),
  update: (id, d) => api.put(`/api/folders/${id}`, d),
  remove: (id) => api.delete(`/api/folders/${id}`),
  notes: (id) => api.get(`/api/folders/${id}/notes`),
};
export const remindersApi = {
  list: () => api.get("/api/reminders"),
  create: (d) => api.post("/api/reminders", d),
  update: (id, d) => api.put(`/api/reminders/${id}`, d),
  remove: (id) => api.delete(`/api/reminders/${id}`),
  complete: (id) => api.patch(`/api/reminders/${id}/complete`),
  due: () => api.get("/api/reminders/due"),
};
export const searchApi = {
  search: (q) => api.get("/api/search", { params: { q } }),
};
export const settingsApi = {
  get: () => api.get("/api/settings"),
  update: (d) => api.put("/api/settings", d),
};
export default api;
