import { useState } from 'react';
import { Routes, Route, Navigate, NavLink, Link, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Booking from './Booking';
import Login from './pages/Login';
import Admin from './pages/Admin';
import * as P from './pages/Pages';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center">Loading…</p>;
  return user ? children : <Navigate to="/login" replace />;
}
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center">Loading…</p>;
  return user?.role === 'admin' ? children : <Navigate to="/login" replace />;
}
const links = [['/', 'Home'], ['/menu', 'Menu'], ['/weekly-menu', 'Weekly menu'], ['/how-it-works', 'How it works'],
  ['/delivery-areas', 'Delivery areas'], ['/reviews', 'Reviews'], ['/faq', 'FAQ'], ['/about', 'About'], ['/contact', 'Contact']];
function Layout() {
  const [open, setOpen] = useState(false), [nav, setNav] = useState(false);
  return (<>
    <header className="top"><Link to="/" className="brand">Gnanam's Healthy Kitchen</Link>
      <button className="ghost menu-btn" onClick={() => setNav(!nav)} aria-label="Menu">☰</button>
      <nav className={nav ? 'show' : ''} onClick={() => setNav(false)}>{links.map(([to, t]) => <NavLink key={to} to={to} end={to === '/'}>{t}</NavLink>)}</nav>
      <button className="btn" onClick={() => setOpen(true)}>Order for tomorrow</button></header>
    <main><Outlet context={{ book: () => setOpen(true) }} /></main>
    <footer>Homemade breakfast · Vailankanni · Delivery 8:30–10:00 AM · <Link to="/login">Admin</Link></footer>
    {open && <Booking onClose={() => setOpen(false)} />}
  </>);
}
export default function App() {
  return (<Routes>
    <Route element={<Layout />}>
      <Route index element={<P.Home />} />
      <Route path="menu" element={<P.Menu />} /><Route path="weekly-menu" element={<P.Weekly />} />
      <Route path="how-it-works" element={<P.How />} /><Route path="delivery-areas" element={<P.Areas />} />
      <Route path="reviews" element={<P.Reviews />} /><Route path="faq" element={<P.FAQ />} />
      <Route path="about" element={<P.About />} /><Route path="contact" element={<P.Contact />} />
      <Route path="login" element={<Login />} />
    </Route>
    <Route path="/admin" element={<ProtectedRoute><AdminRoute><Admin /></AdminRoute></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>);
}
