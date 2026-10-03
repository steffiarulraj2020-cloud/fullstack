import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import Booking from '../Booking';
import Icon from './Icons';
import { useSettings, telHref, waHref } from '../hooks';

const links = [['/', 'Home'], ['/menu', 'Menu'], ['/weekly-menu', 'Weekly Menu'], ['/how-it-works', 'How It Works'],
  ['/delivery-areas', 'Delivery'], ['/reviews', 'Reviews'], ['/faq', 'FAQ'], ['/about', 'About'], ['/contact', 'Contact']];

export function Brand({ name }) {
  return (<Link to="/" className="brand">
    <span className="logo" aria-hidden="true">{(name || 'G')[0]}</span>
    <span><b>{name}</b><small>Order Today → Eat Tomorrow</small></span>
  </Link>);
}

export default function Layout() {
  const s = useSettings(), name = s.businessName || "Gnanam's Healthy Kitchen";
  const [order, setOrder] = useState(null), [nav, setNav] = useState(false), loc = useLocation();
  useEffect(() => { setNav(false); window.scrollTo(0, 0); }, [loc.pathname]);
  const book = (itemId) => setOrder({ itemId: typeof itemId === 'string' ? itemId : null });
  return (<>
    <a href="#main" className="skip">Skip to content</a>
    <header className="top">
      <div className="wrap top-in">
        <Brand name={name} />
        <nav id="site-nav" className={nav ? 'show' : ''} aria-label="Main">
          {links.map(([to, t]) => <NavLink key={to} to={to} end={to === '/'}>{t}</NavLink>)}
        </nav>
        <button className="btn warm order-btn" onClick={() => book()}>Order Now</button>
        <button className="icon-btn menu-btn" onClick={() => setNav(!nav)} aria-label={nav ? 'Close menu' : 'Open menu'}
          aria-expanded={nav} aria-controls="site-nav"><Icon name={nav ? 'x' : 'menu'} size={22} /></button>
      </div>
    </header>
    <main id="main"><Outlet context={{ book }} /></main>
    <footer className="foot">
      <div className="wrap foot-grid">
        <div><Brand name={name} />
          <p className="muted">Freshly prepared home-cooked breakfast from our kitchen to your table. Every dish is made only after we receive your order.</p>
          <p className="warm-text"><b>Order Today → Eat Tomorrow</b></p></div>
        <div><h2 className="foot-h">Explore</h2><ul className="plain">
          {links.slice(1).map(([to, t]) => <li key={to}><Link to={to}>{t}</Link></li>)}</ul></div>
        <div><h2 className="foot-h">Contact</h2><ul className="plain contact-list">
          {s.address && <li><Icon name="pin" size={16} />{s.address}</li>}
          {s.phone && <li><Icon name="phone" size={16} /><a href={telHref(s.phone)}>{s.phone}</a></li>}
          {s.email && <li><Icon name="mail" size={16} /><a href={`mailto:${s.email}`}>{s.email}</a></li>}
          {s.hours && <li><Icon name="clock" size={16} />{s.hours}</li>}
          {s.deliveryWindow && <li><Icon name="truck" size={16} />Delivery {s.deliveryWindow}</li>}
        </ul>
          <p className="socials">{s.instagramUrl && <a href={s.instagramUrl} target="_blank" rel="noreferrer">Instagram</a>}
            {s.facebookUrl && <a href={s.facebookUrl} target="_blank" rel="noreferrer">Facebook</a>}</p></div>
      </div>
      <div className="wrap foot-bottom">© {new Date().getFullYear()} {name}. Made with love in {s.deliveryArea || 'Vailankanni'}.</div>
    </footer>
    {s.whatsapp && <a className="fab" href={waHref(s.whatsapp, `Hi ${name}, I'd like to pre-book a meal.`)} target="_blank" rel="noreferrer"
      aria-label="Chat with us on WhatsApp"><Icon name="chat" size={26} /></a>}
    {order && <Booking itemId={order.itemId} onClose={() => setOrder(null)} />}
  </>);
}
