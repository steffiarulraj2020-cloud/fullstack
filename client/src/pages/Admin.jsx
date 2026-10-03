import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { err } from '../api';
import { useAuth } from '../AuthContext';

function Dashboard() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/admin/stats').then((r) => setS(r.data)); }, []);
  if (!s) return <p>Loading…</p>;
  return <div className="stats"><div><b>{s.placedToday}</b>Orders placed today</div><div><b>₹{s.revenueToday}</b>Revenue today</div>
    <div><b>{s.tomorrowOrders}</b>To deliver on {s.tomorrowDate}</div><div><b>{s.pending}</b>Pending orders</div></div>;
}
const STAT = ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'];
function Orders() {
  const [rows, setRows] = useState([]), [date, setDate] = useState('');
  const load = () => api.get('/admin/orders', { params: { date: date || undefined } }).then((r) => setRows(r.data));
  useEffect(() => { load(); }, [date]);
  const set = async (id, status) => { await api.patch(`/admin/orders/${id}`, { status }); load(); };
  return (<div><label>Delivery date <input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
    {!rows.length && <p>No orders found.</p>}
    {rows.map((o) => <div className="card" key={o._id}><b>#{o._id.slice(-6)} · {o.name}</b> · {o.phone}<br />{o.address}
      <ul>{o.items.map((i) => <li key={i.item}>{i.name} × {i.qty}</li>)}</ul>
      <p>₹{o.total}{o.coupon ? ` (coupon ${o.coupon})` : ''} · {o.payment} · deliver {o.deliveryDate}</p>
      <select value={o.status} onChange={(e) => set(o._id, e.target.value)}>{STAT.map((x) => <option key={x}>{x}</option>)}</select></div>)}</div>);
}
function Crud({ path, fields, show, hint }) {
  const blank = Object.fromEntries(fields.map((x) => [x.k, x.t === 'check' ? x.d ?? false : '']));
  const [rows, setRows] = useState([]), [f, setF] = useState(blank), [id, setId] = useState(null), [m, setM] = useState('');
  const load = () => api.get(path).then((r) => setRows(r.data));
  useEffect(() => { load(); }, [path]);
  const toForm = (r) => Object.fromEntries(fields.map((x) => [x.k, Array.isArray(r[x.k]) ? r[x.k].join(', ') : x.t === 'date' && r[x.k] ? String(r[x.k]).slice(0, 10) : r[x.k] ?? (x.t === 'check' ? false : '')]));
  const body = () => Object.fromEntries(fields.filter((x) => f[x.k] !== '').map((x) => [x.k,
    x.t === 'csv' ? f[x.k].split(',').map((v) => v.trim()).filter(Boolean) : x.t === 'nums' ? f[x.k].split(',').filter((v) => v.trim()).map(Number) : f[x.k]]));
  const save = async (e) => { e.preventDefault(); setM('');
    try { id ? await api.put(`${path}/${id}`, body()) : await api.post(path, body()); setF(blank); setId(null); load(); } catch (x) { setM(err(x)); } };
  const upload = async (e, k) => { const fd = new FormData(); fd.append('image', e.target.files[0]); setM('Uploading…');
    try { const r = await api.post('/admin/upload', fd); setF({ ...f, [k]: r.data.url }); setM(''); } catch (x) { setM(err(x)); } };
  return (<div>
    <form className="form" onSubmit={save}>{hint && <small>{hint}</small>}
      {fields.map((x) => x.t === 'check' ? <label key={x.k}><input type="checkbox" checked={!!f[x.k]} onChange={(e) => setF({ ...f, [x.k]: e.target.checked })} /> {x.l}</label>
        : x.t === 'select' ? <select key={x.k} value={f[x.k]} onChange={(e) => setF({ ...f, [x.k]: e.target.value })} required><option value="">{x.l}</option>{x.o.map((o) => <option key={o}>{o}</option>)}</select>
        : x.t === 'img' ? <div key={x.k}><label>{x.l} <input type="file" accept="image/*" onChange={(e) => upload(e, x.k)} /></label>{f[x.k] && <img className="thumb" src={f[x.k]} alt="" />}</div>
        : <input key={x.k} type={x.t === 'number' ? 'number' : x.t === 'date' ? 'date' : 'text'} step="any" placeholder={x.l} title={x.l} aria-label={x.l} value={f[x.k]} onChange={(e) => setF({ ...f, [x.k]: e.target.value })} required={x.r} />)}
      {m && <p className="warn">{m}</p>}<div className="row"><button className="btn">{id ? 'Save changes' : 'Add'}</button>{id && <button type="button" className="ghost" onClick={() => { setId(null); setF(blank); }}>Cancel</button>}</div></form>
    {rows.map((r) => <div className="card row" key={r._id}><span>{show(r)}</span><span><button className="ghost" onClick={() => { setId(r._id); setF(toForm(r)); }}>Edit</button>
      <button className="ghost" onClick={async () => { if (confirm('Delete this?')) { await api.delete(`${path}/${r._id}`); load(); } }}>Delete</button></span></div>)}</div>);
}
function Reviews() {
  const [rows, setRows] = useState([]); const load = () => api.get('/admin/reviews').then((r) => setRows(r.data)); useEffect(() => { load(); }, []);
  return <div>{!rows.length && <p>No reviews yet.</p>}{rows.map((r) => <div className="card" key={r._id}>{'★'.repeat(r.rating)} <b>{r.name}</b> · {r.approved ? 'Visible' : 'Hidden'}<p>{r.comment}</p>
    <button className="ghost" onClick={async () => { await api.put(`/admin/reviews/${r._id}`, { approved: !r.approved }); load(); }}>{r.approved ? 'Hide' : 'Approve'}</button>
    <button className="ghost" onClick={async () => { await api.delete(`/admin/reviews/${r._id}`); load(); }}>Delete</button></div>)}</div>;
}
const SF = [['businessName', 'Business name'], ['whatsapp', 'WhatsApp number for orders (country code + number, e.g. 919876543210)'], ['upiId', 'UPI ID'],
  ['cutoffHour', 'Order cutoff hour (0–23, IST)'], ['maxOrdersPerDay', 'Max orders per day'], ['deliveryWindow', 'Delivery time window (e.g. 8:30 AM – 10:00 AM)'],
  ['deliveryArea', 'Delivery area (e.g. Vailankanni)'], ['phone', 'Phone (shown on Contact page)'], ['email', 'Email'], ['address', 'Kitchen address'],
  ['hours', 'Opening hours (e.g. 8:00 AM – 8:00 PM)'], ['mapsUrl', 'Google Maps link'], ['instagramUrl', 'Instagram link'], ['facebookUrl', 'Facebook link']];
function Settings() {
  const [f, setF] = useState(null), [m, setM] = useState('');
  useEffect(() => { api.get('/admin/settings').then((r) => setF(r.data)); }, []);
  if (!f) return <p>Loading…</p>;
  const save = async (e) => { e.preventDefault(); try { setF((await api.put('/admin/settings', f)).data); setM('Saved'); } catch (x) { setM(err(x)); } };
  return <form className="form" onSubmit={save}>{SF.map(([k, l]) => <label key={k}>{l}<input value={f[k] ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>)}<button className="btn">Save settings</button>{m && <p role="status">{m}</p>}</form>;
}
const TABS = {
  Dashboard: () => <Dashboard />, Orders: () => <Orders />,
  Menu: () => <Crud path="/admin/menu" hint="Weekdays: 0=Sun … 6=Sat, comma separated. Empty = every day." show={(r) => `${r.name} · ₹${r.price}${r.special ? ' · special' : ''}${r.available ? '' : ' (hidden)'}`}
    fields={[{ k: 'name', l: 'Name', r: 1 }, { k: 'description', l: 'Description' }, { k: 'price', l: 'Price ₹ (delivery included)', t: 'number', r: 1 }, { k: 'image', l: 'Image', t: 'img' },
      { k: 'nutrition', l: 'Nutrition (e.g. 210 kcal · 7g protein)' }, { k: 'tags', l: 'Diet tags, comma separated', t: 'csv' }, { k: 'weekdays', l: 'Weekdays (0-6)', t: 'nums' },
      { k: 'veg', l: 'Vegetarian', t: 'check', d: true }, { k: 'available', l: 'Available', t: 'check', d: true },
      { k: 'special', l: "Today's special (highlighted on the home page)", t: 'check' }]} />,
  Holidays: () => <Crud path="/admin/holidays" show={(r) => `${r.date} ${r.reason || ''}`} fields={[{ k: 'date', l: 'Date', t: 'date', r: 1 }, { k: 'reason', l: 'Reason' }]} />,
  Coupons: () => <Crud path="/admin/coupons" hint="Max uses: total number of orders that can use the code (0 or empty = unlimited)."
    show={(r) => `${r.code} · ${r.type === 'percent' ? r.value + '%' : '₹' + r.value} off${r.minOrder ? ` · min ₹${r.minOrder}` : ''} · used ${r.usedCount || 0}${r.maxUses ? '/' + r.maxUses : ''}${r.expiry ? ' · till ' + String(r.expiry).slice(0, 10) : ''}${r.active ? '' : ' (off)'}`}
    fields={[{ k: 'code', l: 'Code', r: 1 }, { k: 'type', l: 'Type', t: 'select', o: ['percent', 'flat'] }, { k: 'value', l: 'Value (% or ₹)', t: 'number', r: 1 },
      { k: 'minOrder', l: 'Minimum order ₹', t: 'number' }, { k: 'maxUses', l: 'Max uses', t: 'number' }, { k: 'expiry', l: 'Expiry date', t: 'date' }, { k: 'active', l: 'Active', t: 'check', d: true }]} />,
  Reviews: () => <Reviews />, Settings: () => <Settings />,
};
export default function Admin() {
  const [tab, setTab] = useState('Dashboard'), { user, logout } = useAuth();
  return (<div className="admin"><aside><b>Admin</b><small>{user.email}</small>
    {Object.keys(TABS).map((t) => <button key={t} className={t === tab ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}
    <Link to="/">View site</Link><button onClick={logout}>Sign out</button></aside>
    <section key={tab}><h1>{tab}</h1>{TABS[tab]()}</section></div>);
}
