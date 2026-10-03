import { useEffect, useRef, useState } from 'react';
import api, { err } from './api';
import Icon from './components/Icons';
import { useSettings, servedOn, DAYS, fmtHour, telHref } from './hooks';

export default function Booking({ onClose, itemId }) {
  const set = useSettings();
  const [menu, setMenu] = useState([]), [st, setSt] = useState(null);
  const [f, setF] = useState({ name: '', phone: '', address: '', coupon: '', payment: 'COD' });
  const [qty, setQty] = useState(itemId ? { [itemId]: 1 } : {}), [msg, setMsg] = useState(''), [done, setDone] = useState(null), [cp, setCp] = useState(null), [busy, setBusy] = useState(false);
  const box = useRef(null);
  useEffect(() => {
    api.get('/menu').then((r) => setMenu(r.data)).catch(() => {});
    api.get('/booking-status').then((r) => setSt(r.data)).catch(() => setSt({ error: true }));
  }, []);
  useEffect(() => {
    const prev = document.activeElement; box.current?.focus();
    const key = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab' || !box.current) return;
      const els = box.current.querySelectorAll('a[href],button:not([disabled]),input:not([readonly]),select,textarea');
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', key); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = ''; prev?.focus?.(); };
  }, [onClose]);

  const day = st?.weekday, dayMenu = st && !st.error ? menu.filter((m) => servedOn(m, day)) : [];
  const picked = itemId && menu.find((m) => m._id === itemId), pickedOff = picked && st && !st.error && !servedOn(picked, day);
  const sel = dayMenu.filter((m) => qty[m._id] > 0);
  const sub = sel.reduce((a, m) => a + m.price * qty[m._id], 0), dis = Math.min(cp?.discount || 0, sub), total = sub - dis;
  const blocked = !st ? 'Checking availability…' : st.error ? 'Could not check availability. Please try again.'
    : !st.ordering ? 'Online ordering is not available yet. Please contact us directly.'
      : st.holiday ? `Closed on the delivery date (${st.holiday}).` : !st.open ? `Today's orders are closed (cutoff ${fmtHour(st.cutoffHour)}). Please order tomorrow.`
        : st.remaining < 1 ? 'Fully booked for tomorrow.' : !dayMenu.length ? `Nothing on the menu for ${DAYS[day]}.` : '';
  const upd = (k) => (e) => { setF({ ...f, [k]: e.target.value }); if (k === 'coupon') setCp(null); };
  const setQ = (id, n) => { setQty({ ...qty, [id]: Math.max(0, Math.min(20, n)) }); setCp(null); };
  const apply = async () => { try { setCp((await api.post('/coupons/validate', { code: f.coupon, subtotal: sub })).data); setMsg(''); } catch (e) { setCp(null); setMsg(err(e)); } };
  const submit = async (e) => {
    e.preventDefault(); setMsg(''); if (!sel.length) return setMsg('Select at least one item.'); setBusy(true);
    try {
      const r = (await api.post('/orders', { ...f, coupon: (cp && f.coupon) || undefined, items: sel.map((m) => ({ id: m._id, qty: qty[m._id] })), deliveryDate: st.date })).data;
      setDone(r); window.open(r.waUrl, '_blank', 'noopener');
    } catch (x) { setMsg(err(x)); }
    setBusy(false);
  };
  const dateTxt = st?.date && new Date(st.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (<div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="booking-title" tabIndex={-1} ref={box}>
      <button className="icon-btn x" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
      {done ? (<div className="done">
        <span className="done-ic"><Icon name="check" size={28} /></span>
        <h2 id="booking-title">Order placed</h2>
        <p>Order <b>#{done.order._id.slice(-6)}</b> · Total <b>₹{done.order.total}</b>. Please send it on WhatsApp to confirm.</p>
        <a className="btn wa big" href={done.waUrl} target="_blank" rel="noreferrer"><Icon name="chat" size={18} />Send on WhatsApp</a>
        {done.order.payment === 'UPI' && set.upiId && <p>Pay ₹{done.order.total} to UPI ID <b>{set.upiId}</b> · <a href={`upi://pay?pa=${set.upiId}&pn=${encodeURIComponent(set.businessName)}&am=${done.order.total}&cu=INR`}>Open UPI app</a></p>}
        <button className="ghost" onClick={onClose}>Close</button></div>) : (
        <form onSubmit={submit} noValidate={false}>
          <p className="eyebrow">Order today → eat tomorrow</p>
          <h2 id="booking-title">Order for tomorrow</h2>
          {dateTxt && <p className="date-line"><Icon name="calendar" size={16} />{dateTxt}{set.deliveryWindow ? `, ${set.deliveryWindow}` : ''}</p>}
          {blocked && <p className="warn" role="status">{blocked}{st && !st.ordering && set.phone && <> Call <a href={telHref(set.phone)}>{set.phone}</a>.</>}</p>}
          {pickedOff && <p className="note">{picked.name} isn't served on {DAYS[day]}. Choose from {DAYS[day]}'s menu below.</p>}
          <fieldset className="lines"><legend>{st?.weekday !== undefined ? `${DAYS[day]}'s menu` : 'Menu'}</legend>
            {dayMenu.map((m) => <div key={m._id} className="line">
              <span><b>{m.name}</b><small>₹{m.price}</small></span>
              <span className="stepper">
                <button type="button" onClick={() => setQ(m._id, (qty[m._id] || 0) - 1)} aria-label={`Remove one ${m.name}`} disabled={!qty[m._id]}><Icon name="minus" size={16} /></button>
                <output aria-live="polite" aria-label={`${m.name} quantity`}>{qty[m._id] || 0}</output>
                <button type="button" onClick={() => setQ(m._id, (qty[m._id] || 0) + 1)} aria-label={`Add one ${m.name}`}><Icon name="plus" size={16} /></button>
              </span></div>)}
          </fieldset>
          <label>Name<input autoComplete="name" value={f.name} onChange={upd('name')} required minLength={2} /></label>
          <label>Mobile number<input type="tel" autoComplete="tel-national" inputMode="numeric" maxLength={10} pattern="[6-9][0-9]{9}" placeholder="10 digits" value={f.phone} onChange={upd('phone')} required /></label>
          <label>Full address in {set.deliveryArea || 'Vailankanni'}<textarea autoComplete="street-address" value={f.address} onChange={upd('address')} required minLength={8} /></label>
          <label>Coupon code (optional)<span className="row"><input value={f.coupon} onChange={upd('coupon')} /><button type="button" className="ghost" onClick={apply} disabled={!f.coupon || !sub}>Apply</button></span></label>
          {cp && <p className="ok">Coupon {cp.code} applied: −₹{dis}</p>}
          <fieldset className="pay"><legend>Payment</legend>
            {[['COD', 'Cash on delivery'], ['UPI', 'UPI']].map(([v, l]) => <label key={v} className={f.payment === v ? 'on' : ''}>
              <input type="radio" name="payment" value={v} checked={f.payment === v} onChange={upd('payment')} />{l}</label>)}
          </fieldset>
          <div className="total"><span>Total <small>(delivery included)</small></span><b>₹{total}</b></div>
          {msg && <p className="warn" role="alert">{msg}</p>}
          <button className="btn big" disabled={busy || !!blocked}>{busy ? 'Placing order…' : 'Place order & confirm on WhatsApp'}</button>
        </form>)}
    </div></div>);
}
