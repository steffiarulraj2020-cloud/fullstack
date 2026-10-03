import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import api, { err } from '../api';
import Icon from '../components/Icons';
import DishCard from '../components/DishCard';
import { useGet, useSettings, useTitle, DAYS, servedOn, fmtHour, telHref, waHref } from '../hooks';

const PageHead = ({ eyebrow, title, sub }) => (
  <section className="page-head"><div className="wrap">
    {eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{sub && <p className="sub">{sub}</p>}
  </div></section>);
const Sec = ({ children, className = '' }) => <section className={`sec ${className}`}><div className="wrap">{children}</div></section>;
const area = (s) => s.deliveryArea || 'Vailankanni';
const useTomorrow = () => useGet('/booking-status', null);

const FEATURES = [['heart', 'Made with Love', 'Every meal cooked as if for family.'], ['leaf', 'Fresh Ingredients', 'Bought fresh for each day’s cooking.'],
  ['shield', 'Hygienic Kitchen', 'Clean preparation, safe handling.'], ['rupee', 'Delivery Included', 'The price you see is the price you pay.'],
  ['truck', 'Next-Day Delivery', 'Pre-book today, breakfast tomorrow morning.'], ['calendar', 'Pre-Booking Only', 'We cook only what is ordered. Zero waste.'],
  ['sparkles', 'Millet-Rich & Light', 'Millets, oats and little oil.'], ['flame', 'Daily Specials', 'A different dish every day of the week.']];

export function Home() {
  useTitle('');
  const { book } = useOutletContext(), s = useSettings();
  const menu = useGet('/menu', []), st = useTomorrow(), reviews = useGet('/reviews', []);
  const tomorrow = st ? menu.filter((m) => servedOn(m, st.weekday)) : [];
  const special = tomorrow.find((m) => m.special) || menu.find((m) => m.special);
  const avg = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : null;
  return (<>
    <section className="hero"><div className="wrap hero-grid">
      <div>
        <p className="badge"><span className="dotlive" />PRE-BOOKING ONLY · {area(s).toUpperCase()}</p>
        <h1>Fresh Homemade Breakfast, Cooked with <span className="warm-text">Love</span></h1>
        <p className="lead">Homemade millet idlis, upma and dosas, cooked fresh after your order and delivered next morning{s.deliveryWindow ? ` (${s.deliveryWindow})` : ''} in {area(s)}. Delivery is already in the price.</p>
        <button className="btn grad big" onClick={() => book()}>ORDER TODAY → EAT TOMORROW</button>
        <div className="hero-ctas"><Link className="btn" to="/menu">View Menu</Link>
          {s.whatsapp && <a className="btn outline" href={waHref(s.whatsapp, `Hi ${s.businessName}, I'd like to pre-book a meal.`)} target="_blank" rel="noreferrer">Book on WhatsApp</a>}</div>
        <dl className="facts">
          <div><dt>{s.deliveryWindow || 'Next morning'}</dt><dd>Delivery time</dd></div>
          {st && <div><dt>{fmtHour(st.cutoffHour)}</dt><dd>Order cut-off</dd></div>}
          {avg && <div><dt>{avg}★</dt><dd>{reviews.length} review{reviews.length > 1 ? 's' : ''}</dd></div>}
        </dl>
      </div>
      <div className="hero-art">
        <picture><source srcSet="/hero-meal.webp" type="image/webp" /><img src="/hero-meal.jpg" alt="Home-cooked South Indian meal on a banana leaf" width="1200" height="900" fetchpriority="high" /></picture>
        {special && <div className="special-card"><span className="ic"><Icon name="flame" size={18} /></span><span><small>TODAY'S SPECIAL</small><b>{special.name}</b></span></div>}
      </div>
    </div></section>
    <Sec><p className="eyebrow center-t">Why families choose us</p><h2 className="h2 center-t">Homemade in every sense of the word</h2>
      <div className="features">{FEATURES.map(([i, t, d]) => <div className="feature" key={t}><span className="ic"><Icon name={i} /></span><h3>{t}</h3><p>{d}</p></div>)}</div>
    </Sec>
    {!!tomorrow.length && <Sec className="alt"><div className="sec-head"><div><p className="eyebrow">{DAYS[st.weekday]}</p><h2 className="h2">On tomorrow's menu</h2></div>
      <Link to="/weekly-menu">Full weekly menu →</Link></div>
      <div className="grid">{tomorrow.slice(0, 3).map((m) => <DishCard key={m._id} m={m} onOrder={book} badge="Available tomorrow" />)}</div></Sec>}
    <Sec><div className="cta-band"><h2>Ready to eat homemade tomorrow?</h2><p>Browse the menu, pick your dishes and confirm on WhatsApp. We take care of the rest.</p>
      <div className="hero-ctas"><Link className="btn light" to="/menu">View menu</Link><button className="btn warm" onClick={() => book()}>Order now</button></div></div></Sec>
  </>);
}

export function Menu() {
  useTitle('Menu');
  const { book } = useOutletContext(), s = useSettings();
  const menu = useGet('/menu', null), st = useTomorrow();
  const [q, setQ] = useState(''), [veg, setVeg] = useState('all');
  const list = (menu || []).filter((m) => (veg === 'all' || (veg === 'veg') === !!m.veg)
    && `${m.name} ${m.description || ''} ${(m.tags || []).join(' ')}`.toLowerCase().includes(q.toLowerCase()));
  return (<>
    <PageHead eyebrow="Menu" title="Freshly cooked, just for you" sub={`Order today — we cook fresh tomorrow. All prices include delivery within ${area(s)}.`} />
    <Sec>
      <div className="toolbar">
        <label className="search"><Icon name="search" size={18} /><span className="sr">Search dishes</span>
          <input type="search" placeholder="Search by name or tag…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <div className="chips" role="group" aria-label="Diet">{[['all', 'All'], ['veg', 'Veg'], ['nv', 'Non-veg']].map(([v, l]) =>
          <button key={v} className={veg === v ? 'chip on' : 'chip'} aria-pressed={veg === v} onClick={() => setVeg(v)}>{l}</button>)}</div>
      </div>
      {menu && !menu.length && <p className="empty">Menu is being updated. Please check back soon.</p>}
      {menu && !!menu.length && !list.length && <p className="empty">No dishes match your search.</p>}
      <div className="grid">{list.map((m) => {
        const ok = st && servedOn(m, st.weekday);
        return <DishCard key={m._id} m={m} onOrder={ok ? book : null} badge={ok && m.weekdays?.length ? 'Available tomorrow' : null}
          note={st && !ok ? `Not served on ${DAYS[st.weekday]}` : null} />;
      })}</div>
    </Sec></>);
}

const WEEK = [1, 2, 3, 4, 5, 6, 0];
export function Weekly() {
  useTitle('Weekly menu');
  const { book } = useOutletContext();
  const menu = useGet('/menu', []), st = useTomorrow();
  const [day, setDay] = useState(null), [tag, setTag] = useState('');
  const d = day ?? st?.weekday ?? new Date().getDay();
  const tags = useMemo(() => [...new Set(menu.flatMap((m) => m.tags || []))], [menu]);
  const list = menu.filter((m) => servedOn(m, d) && (!tag || m.tags?.includes(tag)));
  const isTomorrow = st && d === st.weekday;
  return (<>
    <PageHead eyebrow="Weekly healthy menu" title="A healthy dish every day" sub="What we cook on each day of the week. Order today, eat tomorrow." />
    <Sec>
      <div className="tabs" role="tablist" aria-label="Day of week">{WEEK.map((i) =>
        <button key={i} role="tab" aria-selected={d === i} className={d === i ? 'tab on' : 'tab'} onClick={() => setDay(i)}>
          {DAYS[i]}{st && i === st.weekday && <small>TOMORROW</small>}</button>)}</div>
      {!!tags.length && <div className="chips filter" role="group" aria-label="Filter by tag"><span className="muted">Filter:</span>
        {tags.map((t) => <button key={t} className={tag === t ? 'chip on' : 'chip'} aria-pressed={tag === t} onClick={() => setTag(tag === t ? '' : t)}>{t}</button>)}</div>}
      {!list.length && <p className="empty">{tag ? 'No dishes with this tag on this day.' : `No dishes on ${DAYS[d]}.`}</p>}
      <div className="grid">{list.map((m) => <DishCard key={m._id} m={m} onOrder={isTomorrow ? book : null}
        badge={isTomorrow ? 'Available tomorrow' : null} note={isTomorrow ? null : `Order on ${DAYS[(d + 6) % 7]} for ${DAYS[d]}`} />)}</div>
      <p className="note">Health note: please consult your doctor or dietitian before choosing meals if you have diabetes or any medical condition. Nutrition values are approximate.</p>
    </Sec></>);
}

export function How() {
  useTitle('How it works');
  const { book } = useOutletContext(), s = useSettings(), st = useTomorrow();
  const steps = [['Browse the menu', 'See what we are cooking tomorrow and pick your dishes.'],
    ['Place your order', 'Fill in your name, phone and address, then confirm on WhatsApp.'],
    ['We cook fresh', 'Your breakfast is prepared from scratch on the morning of delivery.'],
    ['At your door', `Delivered in ${area(s)}${s.deliveryWindow ? ` between ${s.deliveryWindow}` : ''}. Pay by UPI or cash on delivery.`]];
  return (<>
    <PageHead eyebrow="How it works" title="Order today → Eat tomorrow" sub="We only cook what is ordered. That means zero waste, and never a reheated meal on your plate." />
    <Sec><ol className="steps">{steps.map(([t, d], i) => <li key={t}><span className="num">{i + 1}</span><h3>{t}</h3><p>{d}</p></li>)}</ol>
      {st && <div className="callout"><Icon name="clock" size={28} /><div><h2 className="h3">Order cut-off is {fmtHour(st.cutoffHour)}</h2>
        <p>Orders for tomorrow close at {fmtHour(st.cutoffHour)} today. After that, please order the next day.</p></div>
        <button className="btn" onClick={() => book()}>Start ordering</button></div>}
    </Sec></>);
}

export function Areas() {
  useTitle('Delivery areas');
  const s = useSettings(), st = useTomorrow();
  return (<>
    <PageHead eyebrow="Delivery" title={`Serving ${area(s)}`} sub={`We deliver only inside ${area(s)}, next morning${s.deliveryWindow ? ` between ${s.deliveryWindow}` : ''}.`} />
    <Sec><div className="info-grid">
      <div className="info"><Icon name="truck" size={26} /><h3>Delivery time</h3><p>{s.deliveryWindow || 'Next morning'}, next day only</p></div>
      <div className="info"><Icon name="pin" size={26} /><h3>Kitchen location</h3><p>{s.address || area(s)}</p>
        {s.mapsUrl && <a href={s.mapsUrl} target="_blank" rel="noreferrer">Open in Google Maps</a>}</div>
      <div className="info"><Icon name="check" size={26} /><h3>Good to know</h3><ul className="plain ticks">
        <li>Delivery is included in every item price</li><li>Cash on delivery or UPI</li>{st && <li>Order cut-off: {fmtHour(st.cutoffHour)} daily</li>}</ul></div>
    </div>
      <p className="note">Not sure if your street is covered? Message us your address on WhatsApp before ordering. We do not deliver outside {area(s)}.</p>
    </Sec></>);
}

export function Reviews() {
  useTitle('Reviews');
  const s = useSettings(), list = useGet('/reviews', []);
  const [f, setF] = useState({ name: '', rating: 5, comment: '' }), [m, setM] = useState('');
  const send = async (e) => { e.preventDefault(); try { await api.post('/reviews', { ...f, rating: +f.rating }); setM('Thank you! Your review will appear after approval.'); setF({ name: '', rating: 5, comment: '' }); } catch (x) { setM(err(x)); } };
  return (<>
    <PageHead eyebrow="Reviews" title={`Loved by ${area(s)} families`} />
    <Sec><div className="rev-layout">
      <div>{!list.length && <p className="empty">No reviews yet — be the first to share your experience.</p>}
        <div className="reviews">{list.map((r) => <blockquote key={r._id} className="review">
          <span className="stars" aria-label={`${r.rating} out of 5 stars`}>{'★'.repeat(r.rating)}<span className="dim">{'★'.repeat(5 - r.rating)}</span></span>
          <p>{r.comment}</p><cite>{r.name}</cite></blockquote>)}</div></div>
      <form className="form panel" onSubmit={send}><h2 className="h3">Leave a review</h2>
        <label>Your name<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required minLength={2} /></label>
        <label>Rating<select value={f.rating} onChange={(e) => setF({ ...f, rating: e.target.value })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}</select></label>
        <label>Comment<textarea value={f.comment} onChange={(e) => setF({ ...f, comment: e.target.value })} required minLength={3} /></label>
        <button className="btn">Submit review</button>{m && <p role="status">{m}</p>}
        <small className="muted">Reviews are visible after admin approval.</small></form>
    </div></Sec></>);
}

export function FAQ() {
  useTitle('FAQ');
  const s = useSettings(), st = useTomorrow();
  const faqs = [['Why pre-booking only?', 'We cook only what is ordered, so every meal is fresh and nothing is wasted.'],
    ['Can I get delivery today?', 'No. All orders are pre-orders and are delivered the next day only.'],
    ['When do I need to place my order?', st ? `Before ${fmtHour(st.cutoffHour)} on the day before delivery.` : 'Before the daily cut-off time shown in the order form.'],
    ['What time is delivery?', s.deliveryWindow ? `Between ${s.deliveryWindow}.` : 'In the morning, next day.'],
    ['Is there a delivery charge?', 'No. Delivery is already included in each item price.'],
    ['How do I pay?', 'UPI or cash on delivery.'], ['Where do you deliver?', `Only inside ${area(s)}.`],
    ['Can I cancel or change my order?', s.whatsapp ? 'Message us on WhatsApp as early as possible with your order number.' : 'Contact us as early as possible with your order number.']];
  return (<>
    <PageHead eyebrow="FAQ" title="Questions, answered" />
    <Sec><div className="faq">{faqs.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></Sec></>);
}

export function About() {
  useTitle('About us');
  const s = useSettings();
  return (<>
    <PageHead eyebrow="Our story" title="A home kitchen with old-fashioned care." />
    <Sec><div className="prose">
      <p>{s.businessName || "Gnanam's Healthy Kitchen"} is a home kitchen in {area(s)}. We cook light, millet-rich breakfasts with little oil, in small batches, and deliver them fresh the next morning.</p>
      <p>We cook only after you order. Nothing sits and nothing is reheated. Each meal leaves the kitchen the way it would leave a family table: hot, honest and made with love.</p>
    </div>
      <div className="info-grid">{[['leaf', 'Millet-rich', 'Ragi, kambu, thinai and oats in everyday dishes.'], ['heart', 'Little oil', 'Light cooking, made for every day.'],
        ['chef', 'Cooked to order', 'Small batches, prepared fresh each morning.']].map(([i, t, d]) =>
        <div className="info" key={t}><Icon name={i} size={26} /><h3>{t}</h3><p>{d}</p></div>)}</div>
    </Sec></>);
}

export function Contact() {
  useTitle('Contact');
  const s = useSettings();
  const cards = [s.whatsapp && ['chat', 'WhatsApp', 'Chat with us', waHref(s.whatsapp, `Hi ${s.businessName}`)], s.phone && ['phone', 'Call us', s.phone, telHref(s.phone)],
    s.email && ['mail', 'Email', s.email, `mailto:${s.email}`], s.address && ['pin', 'Address', s.address, s.mapsUrl || null], s.hours && ['clock', 'Hours', s.hours, null]].filter(Boolean);
  return (<>
    <PageHead eyebrow="Contact" title="Talk to the kitchen" sub={s.whatsapp ? 'Fastest reply on WhatsApp.' : undefined} />
    <Sec>
      {!cards.length && <p className="empty">Contact details will be added soon.</p>}
      <div className="info-grid">{cards.map(([i, t, v, href]) => <div className="info" key={t}><Icon name={i} size={26} /><h3>{t}</h3>
        {href ? <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{v}</a> : <p>{v}</p>}</div>)}</div>
      {s.whatsapp && <div className="cta-band small"><h2>Ready to order?</h2><p>Send us your order on WhatsApp — we'll take care of the rest.</p>
        <a className="btn warm" href={waHref(s.whatsapp, `Hi ${s.businessName}, I'd like to pre-book a meal.`)} target="_blank" rel="noreferrer">Chat on WhatsApp</a></div>}
    </Sec></>);
}

export function NotFound() {
  useTitle('Page not found');
  return <Sec className="center-t"><p className="eyebrow">404</p><h1 className="h2">Page not found</h1><p>The page you are looking for doesn't exist.</p><Link className="btn" to="/">Go home</Link></Sec>;
}
