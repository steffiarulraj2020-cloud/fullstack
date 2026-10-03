import { useEffect, useState } from 'react';
import api, { err } from './api';

export default function Booking({ onClose }) {
  const [menu, setMenu] = useState([]), [st, setSt] = useState(null), [set, setSet] = useState({});
  const [f, setF] = useState({ name: '', phone: '', address: '', coupon: '', payment: 'COD' });
  const [qty, setQty] = useState({}), [msg, setMsg] = useState(''), [done, setDone] = useState(null), [cp, setCp] = useState(null), [busy, setBusy] = useState(false);
  useEffect(() => {
    api.get('/menu').then((r) => setMenu(r.data)); api.get('/booking-status').then((r) => setSt(r.data)); api.get('/settings').then((r) => setSet(r.data));
  }, []);
  const sub = menu.reduce((a, m) => a + m.price * (qty[m._id] || 0), 0), dis = Math.min(cp?.discount || 0, sub), total = sub - dis;
  const items = menu.filter((m) => qty[m._id] > 0).map((m) => ({ id: m._id, qty: qty[m._id] }));
  const blocked = !st ? 'Checking availability…' : st.holiday ? `Closed on the delivery date (${st.holiday}).` : !st.open ? `Today's orders are closed (cutoff ${st.cutoffHour}:00). Please order tomorrow.` : st.remaining < 1 ? 'Fully booked for tomorrow.' : '';
  const upd = (k) => (e) => { setF({ ...f, [k]: e.target.value }); if (k === 'coupon') setCp(null); };
  const apply = async () => { try { setCp((await api.post('/coupons/validate', { code: f.coupon, subtotal: sub })).data); setMsg(''); } catch (e) { setCp(null); setMsg(err(e)); } };
  const submit = async (e) => {
    e.preventDefault(); setMsg(''); if (!items.length) return setMsg('Select at least one item.'); setBusy(true);
    try { const r = (await api.post('/orders', { ...f, coupon: f.coupon || undefined, items, deliveryDate: st.date })).data; setDone(r); window.open(r.waUrl, '_blank'); }
    catch (x) { setMsg(err(x)); } setBusy(false);
  };
  const dateTxt = st && new Date(st.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  return (<div className="overlay" role="dialog" aria-modal="true"><div className="modal">
    <button className="ghost x" onClick={onClose} aria-label="Close">✕</button>
    {done ? (<div><h2>Order placed</h2><p>Order #{done.order._id.slice(-6)} · Total ₹{done.order.total}. Please send it on WhatsApp to confirm.</p>
      <a className="btn" href={done.waUrl} target="_blank" rel="noreferrer">Send on WhatsApp</a>
      {done.order.payment === 'UPI' && set.upiId && <p>Pay ₹{done.order.total} to UPI ID <b>{set.upiId}</b> <a href={`upi://pay?pa=${set.upiId}&pn=${encodeURIComponent(set.businessName)}&am=${done.order.total}&cu=INR`}>Open UPI app</a></p>}
      <button className="ghost" onClick={onClose}>Close</button></div>) : (
    <form onSubmit={submit}><h2>Order for tomorrow</h2>
      {blocked && <p className="warn">{blocked}</p>}
      <label>Delivery date<input value={dateTxt ? `${dateTxt}, ${set.deliveryWindow || ''}` : ''} readOnly /></label>
      <input placeholder="Name" value={f.name} onChange={upd('name')} required />
      <input placeholder="Mobile number (10 digits)" inputMode="numeric" maxLength={10} value={f.phone} onChange={upd('phone')} required />
      <textarea placeholder="Full address in Vailankanni" value={f.address} onChange={upd('address')} required />
      <div className="lines">{menu.map((m) => <div key={m._id}><span>{m.name} · ₹{m.price}</span>
        <input type="number" min="0" max="20" value={qty[m._id] || 0} onChange={(e) => { setQty({ ...qty, [m._id]: Math.max(0, +e.target.value) }); setCp(null); }} aria-label={`${m.name} quantity`} /></div>)}</div>
      <div className="row"><input placeholder="Coupon code" value={f.coupon} onChange={upd('coupon')} /><button type="button" className="ghost" onClick={apply} disabled={!f.coupon || !sub}>Apply</button></div>
      {cp && <p className="ok">Coupon {cp.code} applied: −₹{dis}</p>}
      <select value={f.payment} onChange={upd('payment')}><option value="COD">Cash on delivery</option><option value="UPI">UPI</option></select>
      <p><b>Total ₹{total}</b> <small>(delivery included)</small></p>{msg && <p className="warn">{msg}</p>}
      <button className="btn big" disabled={busy || !!blocked}>{busy ? 'Placing order…' : 'Place order'}</button></form>)}
  </div></div>);
}
