import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getToken } from '../api.js';
import { connectSocket } from '../socket.js';

export const Pill = ({ value }) => <span className={`pill ${value}`}>{value}</span>;

export default function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState({ status: '', priority: '', sentiment: '', escalated: '' });
  const [q, setQ] = useState('');

  const load = useCallback(() => {
    const params = new URLSearchParams({ ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), ...(q ? { q } : {}) });
    api(`/tickets?${params}`).then(setTickets).catch(console.error);
  }, [filters, q]);

  useEffect(load, [load]);
  useEffect(() => {
    const s = connectSocket(getToken());
    if (!s) return undefined;

    const refresh = () => load();
    s.on('connect', refresh);
    s.on('ticket:updated', refresh);

    return () => {
      s.off('connect', refresh);
      s.off('ticket:updated', refresh);
      s.disconnect();
    };
  }, [load]);

  const sel = (key, opts) => (
    <select value={filters[key]} onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}>
      <option value="">{key}: all</option>
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <>
      <h1>Tickets</h1>
      <div className="toolbar">
        <input placeholder="Search subject…" value={q} onChange={(e) => setQ(e.target.value)} />
        {sel('status', ['open', 'pending', 'resolved'])}
        {sel('priority', ['low', 'medium', 'high', 'urgent'])}
        {sel('sentiment', ['positive', 'neutral', 'negative', 'angry'])}
        <select value={filters.escalated} onChange={(e) => setFilters({ ...filters, escalated: e.target.value })}>
          <option value="">handling: all</option>
          <option value="true">needs human</option>
        </select>
        <button type="button" className="link" onClick={load}>Refresh</button>
      </div>
      <table>
        <thead>
          <tr><th>Subject</th><th>Customer</th><th>Category</th><th>Sentiment</th><th>Priority</th><th>Status</th><th>Handled by</th></tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t._id}>
              <td><Link to={`/tickets/${t._id}`}>{t.subject}</Link></td>
              <td>{t.customer?.name}</td>
              <td>{t.category}</td>
              <td><Pill value={t.sentiment} /></td>
              <td><Pill value={t.priority} /></td>
              <td>{t.status}</td>
              <td>{t.humanTakeover ? `👤 ${t.assignedAgent?.name || 'agent'}` : t.escalated ? '⚠️ needs human' : t.aiHandled ? '🤖 AI' : '—'}</td>
            </tr>
          ))}
          {!tickets.length && <tr><td colSpan="7" className="muted">No tickets yet. Open <code>/chat</code> to create one.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
