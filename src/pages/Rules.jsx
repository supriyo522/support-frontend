import { useEffect, useState } from 'react';
import { api } from '../api.js';

const empty = { name: '', category: '', sentiment: '', priority: '', keyword: '', type: 'escalate', value: '' };

export default function Rules() {
  const [rules, setRules] = useState([]);
  const [f, setF] = useState(empty);
  const load = () => api('/automation').then(setRules);
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    const conditions = Object.fromEntries(['category', 'sentiment', 'priority', 'keyword'].filter((k) => f[k]).map((k) => [k, f[k]]));
    await api('/automation', { method: 'POST', body: { name: f.name, conditions, action: { type: f.type, value: f.value } } });
    setF(empty);
    load();
  };
  const toggle = (r) => api(`/automation/${r._id}`, { method: 'PATCH', body: { enabled: !r.enabled } }).then(load);
  const del = (r) => api(`/automation/${r._id}`, { method: 'DELETE' }).then(load);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const sel = (k, opts) => (
    <select value={f[k]} onChange={set(k)}>
      <option value="">{k}: any</option>
      {opts.map((o) => <option key={o}>{o}</option>)}
    </select>
  );

  return (
    <>
      <h1>Automation rules</h1>
      <p className="muted">If all conditions match a new customer message, the action runs. “Escalate” disables the AI auto-reply and sends it to a human.</p>
      <form className="card" onSubmit={add}>
        <input placeholder="Rule name" value={f.name} onChange={set('name')} required />
        <div className="toolbar">
          {sel('category', ['billing', 'technical', 'account', 'general'])}
          {sel('sentiment', ['positive', 'neutral', 'negative', 'angry'])}
          <input placeholder="keyword contains…" value={f.keyword} onChange={set('keyword')} />
        </div>
        <div className="toolbar">
          <select value={f.type} onChange={set('type')}>
            <option value="escalate">escalate to human</option>
            <option value="set_priority">set priority</option>
          </select>
          {f.type === 'set_priority' && (
            <select value={f.value} onChange={set('value')} required>
              <option value="">level…</option>
              {['low', 'medium', 'high', 'urgent'].map((o) => <option key={o}>{o}</option>)}
            </select>
          )}
          <button className="primary">Add rule</button>
        </div>
      </form>
      {rules.map((r) => (
        <div className="card row" key={r._id}>
          <div>
            <b>{r.name}</b>
            <div className="muted">
              IF {Object.entries(r.conditions || {}).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join(' AND ') || 'always'} → {r.action.type} {r.action.value || ''}
            </div>
          </div>
          <div>
            <button className="link" onClick={() => toggle(r)}>{r.enabled ? 'Disable' : 'Enable'}</button>
            <button className="link" onClick={() => del(r)}>Delete</button>
          </div>
        </div>
      ))}
    </>
  );
}
