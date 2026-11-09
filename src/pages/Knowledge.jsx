import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Knowledge({ user }) {
  const [docs, setDocs] = useState([]);
  const [form, setForm] = useState({ title: '', content: '' });
  const load = () => api('/knowledge').then(setDocs);
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    await api('/knowledge', { method: 'POST', body: form });
    setForm({ title: '', content: '' });
    load();
  };
  const del = async (id) => { await api(`/knowledge/${id}`, { method: 'DELETE' }); load(); };

  return (
    <>
      <h1>Knowledge base</h1>
      <p className="muted">The AI only answers from these articles. Better articles mean more auto-resolved tickets.</p>
      {user.role === 'admin' && (
        <form className="card" onSubmit={add}>
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea rows="4" placeholder="Article content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
          <button className="primary">Add article</button>
        </form>
      )}
      {docs.map((d) => (
        <div className="card" key={d._id}>
          <h3>{d.title}</h3>
          <p>{d.content}</p>
          {user.role === 'admin' && <button className="link" onClick={() => del(d._id)}>Delete</button>}
        </div>
      ))}
    </>
  );
}
