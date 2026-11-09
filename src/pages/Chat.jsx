import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { connectSocket } from '../socket.js';

// Customer-facing chat (also used inside the embeddable widget iframe)
export default function Chat() {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => {
    try {
      const raw = sessionStorage.getItem('sg_chat');
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && parsed.ticketId && parsed.token ? parsed : null;
    } catch {
      sessionStorage.removeItem('sg_chat');
      return null;
    }
  });
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [resolved, setResolved] = useState(false);
  const bottom = useRef();

  useEffect(() => {
    if (!session || !session.ticketId || !session.token) {
      sessionStorage.removeItem('sg_chat');
      setSession(null);
      return undefined;
    }

    let cancelled = false;

    api(`/chat/${session.ticketId}/messages`, { token: session.token })
      .then((initialMessages) => {
        if (!cancelled) setMessages(initialMessages);
      })
      .catch(() => {
        if (!cancelled) {
          sessionStorage.removeItem('sg_chat');
          setSession(null);
        }
      });

    const s = connectSocket(session.token);
    if (!s) return undefined;

    const handleMessage = (m) => {
      setMessages((prev) => (prev.some((x) => x._id === m._id) ? prev : [...prev, m]));
    };

    s.on('message', handleMessage);
    return () => {
      cancelled = true;
      s.off('message', handleMessage);
      s.disconnect();
    };
  }, [session]);

  useEffect(() => bottom.current?.scrollIntoView({ behavior: 'smooth' }), [messages.length]);

  const start = async (e) => {
    e.preventDefault();
    try {
      const s = await api('/chat/start', { method: 'POST', body: form, token: null });
      sessionStorage.setItem('sg_chat', JSON.stringify(s));
      setSession(s);
      navigate('/chat', { replace: true });
    } catch (err) { setError(err.message); }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const content = text;
    setText('');
    await api(`/chat/${session.ticketId}/messages`, { method: 'POST', body: { content }, token: session.token });
  };

  const resolve = async () => {
    await api(`/chat/${session.ticketId}/resolve`, { method: 'POST', token: session.token });
    setResolved(true);
  };

  if (!session)
    return (
      <form className="chat start" onSubmit={start}>
        <h3>How can we help?</h3>
        <input placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <textarea rows="4" placeholder="Describe your issue…" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
        {error && <p className="error">{error}</p>}
        <button className="primary">Start chat</button>
      </form>
    );

  return (
    <div className="chat">
      <div className="chat-log">
        {messages.map((m) => (
          <div key={m._id} className={`bubble ${m.sender === 'customer' ? 'mine' : 'theirs'}`}>
            {m.sender === 'ai' && <small>Assistant</small>}
            {m.sender === 'agent' && <small>Support agent</small>}
            <div>{m.content}</div>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      {resolved ? <p className="center muted">Glad we could help! Send a message to reopen.</p> : (
        <button className="link" onClick={resolve}>✔ My issue is solved</button>
      )}
      <form className="chat-input" onSubmit={send}>
        <input value={text} onChange={(e) => { setText(e.target.value); setResolved(false); }} placeholder="Type a message…" />
        <button className="primary">Send</button>
      </form>
    </div>
  );
}
