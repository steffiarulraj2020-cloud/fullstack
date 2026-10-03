import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { err } from '../api';

export default function Login() {
  const { user, login, register } = useAuth(), nav = useNavigate();
  const [reg, setReg] = useState(false), [f, setF] = useState({ name: '', email: '', password: '' }), [m, setM] = useState('');
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  const go = async (e) => {
    e.preventDefault(); setM('');
    try { const u = reg ? await register(f.name, f.email, f.password) : await login(f.email, f.password); nav(u.role === 'admin' ? '/admin' : '/'); }
    catch (x) { setM(err(x)); }
  };
  return (<section className="sec narrow"><h1>{reg ? 'Create account' : 'Sign in'}</h1>
    <form className="form" onSubmit={go}>
      {reg && <input placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />}
      <input type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
      <input type="password" placeholder="Password (8+ characters)" minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
      {m && <p className="warn">{m}</p>}<button className="btn">{reg ? 'Create account' : 'Sign in'}</button>
      <button type="button" className="ghost" onClick={() => setReg(!reg)}>{reg ? 'I already have an account' : 'Create a customer account'}</button></form></section>);
}
