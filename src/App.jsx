import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { api, getToken, setToken } from './api.js';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import TicketView from './pages/TicketView.jsx';
import Analytics from './pages/Analytics.jsx';
import Knowledge from './pages/Knowledge.jsx';
import Rules from './pages/Rules.jsx';
import Chat from './pages/Chat.jsx';

function Shell({ user, onLogout, children }) {
  return (
    <div className="shell">
      <aside>
        <h2>SupportGen AI</h2>
        <nav>
          <NavLink to="/" end>Tickets</NavLink>
          <NavLink to="/analytics">Analytics</NavLink>
          <NavLink to="/knowledge">Knowledge base</NavLink>
          {user.role === 'admin' && <NavLink to="/rules">Automation</NavLink>}
        </nav>
        <div className="me">
          <div>{user.name} <span className="badge">{user.role}</span></div>
          <button className="link" onClick={onLogout}>Log out</button>
        </div>
      </aside>
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (!getToken()) return setReady(true);
    api('/auth/me').then(setUser).catch(() => setToken(null)).finally(() => setReady(true));
  }, []);

  const logout = () => { setToken(null); setUser(null); nav('/login'); };
  if (!ready) return <p className="center">Loading…</p>;

  return (
    <Routes>
      <Route path="/chat" element={<Chat />} />
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={setUser} />} />
      <Route
        path="/*"
        element={
          !user ? <Navigate to="/login" /> : (
            <Shell user={user} onLogout={logout}>
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="tickets/:id" element={<TicketView user={user} />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="knowledge" element={<Knowledge user={user} />} />
                <Route path="rules" element={user.role === 'admin' ? <Rules /> : <Navigate to="/" />} />
              </Routes>
            </Shell>
          )
        }
      />
    </Routes>
  );
}
