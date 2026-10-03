import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Admin from './pages/Admin';
import * as P from './pages/Pages';

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center">Loading…</p>;
  return user?.role === 'admin' ? children : <Navigate to="/login" replace />;
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
      <Route path="*" element={<P.NotFound />} />
    </Route>
    <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
  </Routes>);
}
