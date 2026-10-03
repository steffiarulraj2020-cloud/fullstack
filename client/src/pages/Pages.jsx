import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api, { err } from '../api';

const useGet = (u, d) => { const [v, setV] = useState(d); useEffect(() => { api.get(u).then((r) => setV(r.data)).catch(() => {}); }, [u]); return v; };
const Sec = ({ t, sub, children }) => <section className="sec"><h1>{t}</h1>{sub && <p className="sub">{sub}</p>}{children}</section>;
const Dish = ({ m }) => (
  <article className="dish">
    {m.image ? <img src={m.image} alt={m.name} loading="lazy" /> : <div className="noimg">🥣</div>}
    <div className="dbody"><h3><span className={m.veg ? 'dot veg' : 'dot nv'} title={m.veg ? 'Vegetarian' : 'Non-veg'} />{m.name}</h3>
      <p>{m.description}</p>{m.nutrition && <p className="nut">{m.nutrition}</p>}
      <div className="tags">{m.tags?.map((t) => <span key={t}>{t}</span>)}</div><strong>₹{m.price} <small>delivery included</small></strong></div>
  </article>);

export function Home() {
  const { book } = useOutletContext();
  const menu = useGet('/menu', []);
  return (<>
    <section className="hero"><h1>Order today. Breakfast at your door tomorrow, 8:30 to 10:00.</h1>
      <p>Homemade millet idlis, upma and dosas, cooked fresh each morning in Vailankanni. Delivery is already in the price.</p>
      <button className="btn big" onClick={book}>Pre-order for tomorrow</button></section>
    <Sec t="Popular this week"><div className="grid">{menu.slice(0, 3).map((m) => <Dish key={m._id} m={m} />)}</div></Sec>
  </>);
}
export function Menu() {
  const menu = useGet('/menu', []);
  return <Sec t="Menu" sub="All prices include delivery within Vailankanni.">{!menu.length && <p>Menu is being updated. Please check back soon.</p>}<div className="grid">{menu.map((m) => <Dish key={m._id} m={m} />)}</div></Sec>;
}
const D = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export function Weekly() {
  const menu = useGet('/menu', []);
  return <Sec t="Weekly menu" sub="What we cook on each day.">{D.map((d, i) => {
    const list = menu.filter((m) => !m.weekdays?.length || m.weekdays.includes(i));
    return <div className="day" key={d}><h3>{d}</h3><p>{list.map((m) => m.name).join(', ') || 'Closed'}</p></div>;
  })}</Sec>;
}
export const How = () => <Sec t="How it works"><ol className="steps">
  <li>Pick your dishes and tap “Order for tomorrow”.</li><li>Order before the daily cutoff time shown in the order form.</li>
  <li>Confirm on WhatsApp; we cook fresh the next morning.</li><li>Receive breakfast between 8:30 and 10:00 AM. Pay by UPI or cash on delivery.</li></ol></Sec>;
export const Areas = () => <Sec t="Delivery areas" sub="We deliver only inside Vailankanni, next morning between 8:30 and 10:00 AM.">
  <p>Not sure if your street is covered? Send us your address on WhatsApp before ordering. We do not deliver outside Vailankanni.</p></Sec>;
export function Reviews() {
  const list = useGet('/reviews', []);
  const [f, setF] = useState({ name: '', rating: 5, comment: '' }), [m, setM] = useState('');
  const send = async (e) => { e.preventDefault(); try { await api.post('/reviews', { ...f, rating: +f.rating }); setM('Thank you! Your review will appear after approval.'); setF({ name: '', rating: 5, comment: '' }); } catch (x) { setM(err(x)); } };
  return <Sec t="Reviews">{list.map((r) => <blockquote key={r._id}>{'★'.repeat(r.rating)}<p>{r.comment}</p><cite>{r.name}</cite></blockquote>)}
    <form className="form" onSubmit={send}><h3>Share your experience</h3>
      <input placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
      <select value={f.rating} onChange={(e) => setF({ ...f, rating: e.target.value })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}</select>
      <textarea placeholder="Your review" value={f.comment} onChange={(e) => setF({ ...f, comment: e.target.value })} required />
      <button className="btn">Send review</button>{m && <p>{m}</p>}</form></Sec>;
}
const faqs = [['Can I get delivery today?', 'No. All orders are pre-orders and are delivered the next day only.'], ['What time is delivery?', 'Between 8:30 AM and 10:00 AM.'],
  ['Is there a delivery charge?', 'No. Delivery is already included in each item price.'], ['How do I pay?', 'UPI or cash on delivery.'], ['Where do you deliver?', 'Only inside Vailankanni.']];
export const FAQ = () => <Sec t="FAQ">{faqs.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</Sec>;
export const About = () => <Sec t="About us"><p>Gnanam's Healthy Kitchen is a home kitchen in Vailankanni. We cook light, millet-rich breakfasts with little oil, in small batches, and deliver them fresh the next morning.</p></Sec>;
export function Contact() {
  const s = useGet('/settings', {});
  return <Sec t="Contact"><p>Fastest way to reach us is WhatsApp.</p>{s.whatsapp && <a className="btn" href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer">Chat on WhatsApp</a>}</Sec>;
}
