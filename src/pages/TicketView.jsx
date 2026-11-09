import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, getToken } from '../api.js';
import { connectSocket } from '../socket.js';
import { Pill } from './Dashboard.jsx';

export default function TicketView() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [agents, setAgents] = useState([]);
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const bottom = useRef();

  const load = useCallback(() => api(`/tickets/${id}`).then(setData).catch((e) => setError(e.message)), [id]);

  useEffect(() => { load(); api('/auth/agents').then(setAgents).catch(() => {}); }, [load]);
  useEffect(() => {
    const s = connectSocket(getToken());
    if (!s) return undefined;

    const onMessage = (m) => {
      if (String(m.ticket) === id) load();
    };
    const onTicketUpdated = (t) => {
      if (String(t.id) === id) load();
    };

    s.on('message', onMessage);
    s.on('ticket:updated', onTicketUpdated);

    return () => {
      s.off('message', onMessage);
      s.off('ticket:updated', onTicketUpdated);
      s.disconnect();
    };
  }, [id, load]);
  useEffect(() => bottom.current?.scrollIntoView({ behavior: 'smooth' }), [data?.messages.length]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Loading…</p>;
  const { ticket, messages } = data;
  const draft = [...messages].reverse().find((m) => m.isDraft);

  const patch = (body) => api(`/tickets/${id}`, { method: 'PATCH', body }).then(load);
  const send = async () => {
    if (!reply.trim()) return;
    await api(`/tickets/${id}/reply`, { method: 'POST', body: { content: reply } });
    setReply('');
  };
  const rate = (mid, rating) => api(`/tickets/messages/${mid}/feedback`, { method: 'POST', body: { rating } }).then(load);

  return (
    <div className="ticket">
      <div className="thread">
        <h1>{ticket.subject}</h1>
        <p className="muted">{ticket.customer?.name} · {ticket.customer?.email} · via {ticket.source}</p>
        <div className="messages">
          {messages.map((m) => (
            <div key={m._id} className={`msg ${m.sender} ${m.isDraft ? 'draft' : ''}`}>
              <div className="who">{m.isDraft ? '🤖 AI draft (not sent)' : m.sender}</div>
              <div>{m.content}</div>
              {m.sender === 'ai' && (
                <div className="meta">
                  {m.aiMeta?.confidence != null && <>confidence {(m.aiMeta.confidence * 100).toFixed(0)}% · </>}
                  <button className={`thumb ${m.feedback === 'up' ? 'on' : ''}`} onClick={() => rate(m._id, 'up')}>👍</button>
                  <button className={`thumb ${m.feedback === 'down' ? 'on' : ''}`} onClick={() => rate(m._id, 'down')}>👎</button>
                </div>
              )}
            </div>
          ))}
          <div ref={bottom} />
        </div>
        <div className="composer">
          {draft && (
            <button className="link" onClick={() => setReply(draft.content)}>
              Use AI suggestion ({Math.round((draft.aiMeta?.confidence || 0) * 100)}% confidence)
            </button>
          )}
          <textarea rows="4" placeholder="Write a reply…" value={reply} onChange={(e) => setReply(e.target.value)} />
          <button className="primary" onClick={send}>Send as agent</button>
        </div>
      </div>

      <aside className="details card">
        <h3>Details</h3>
        <label>Status
          <select value={ticket.status} onChange={(e) => patch({ status: e.target.value })}>
            {['open', 'pending', 'resolved'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label>Priority
          <select value={ticket.priority} onChange={(e) => patch({ priority: e.target.value })}>
            {['low', 'medium', 'high', 'urgent'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label>Assigned to
          <select value={ticket.assignedAgent?._id || ''} onChange={(e) => patch({ assignedAgent: e.target.value })}>
            <option value="">Unassigned</option>
            {agents.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
          </select>
        </label>
        <p>Category: <b>{ticket.category}</b></p>
        <p>Sentiment: <Pill value={ticket.sentiment} /></p>
        {ticket.appliedRules?.length > 0 && (
          <p className="muted">Rules applied: {ticket.appliedRules.join(', ')}</p>
        )}
        {draft?.aiMeta?.sources?.length > 0 && (
          <p className="muted">AI sources: {draft.aiMeta.sources.join(', ')}</p>
        )}
      </aside>
    </div>
  );
}
