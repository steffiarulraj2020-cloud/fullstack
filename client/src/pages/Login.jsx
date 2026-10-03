import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { err } from '../api';
import { useTitle } from '../hooks';

export default function Login() {
  useTitle('Admin sign in');
  const { user, login } = useAuth(), nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' }), [m, setM] = useState(''), [busy, setBusy] = useState(false);
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  const go = async (e) => {
    e.preventDefault(); setM(''); setBusy(true);
    try { const u = await login(f.email, f.password); nav(u.role === 'admin' ? '/admin' : '/'); }
    catch (x) { setM(err(x)); }
    setBusy(false);
  };
  return (<section className="sec narrow"><div className="panel">
    <h1 className="h2">Admin sign in</h1><p className="muted">For kitchen staff only.</p>
    <form className="form" onSubmit={go}>
      <label>Email<input type="email" autoComplete="username" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></label>
      <label>Password<input type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required /></label>
      {m && <p className="warn" role="alert">{m}</p>}<button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form></div></section>);
}
