// Staff token is kept in localStorage; customer chat tokens are ticket-scoped.
export const getToken = () => localStorage.getItem('sg_token');
export const setToken = (t) => (t ? localStorage.setItem('sg_token', t) : localStorage.removeItem('sg_token'));

const API_BASE = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://support-backend-73f2.onrender.com'
);

export async function api(path, { method = 'GET', body, token = getToken() } = {}) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
