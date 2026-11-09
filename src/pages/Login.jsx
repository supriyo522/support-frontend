import { useState } from 'react';
import { api, setToken } from '../api.js';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { token, user } = await api('/auth/login', { method: 'POST', body: { email, password }, token: null });
      setToken(token);
      onLogin(user);
    } catch (err) { setError(err.message); }
  };

  return (
    <form className="card login" onSubmit={submit}>
      <h1>SupportGen AI</h1>
      <p className="muted">Agent & admin sign in</p>
      <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error && <p className="error">{error}</p>}
      <button className="primary">Sign in</button>
    </form>
  );
}
