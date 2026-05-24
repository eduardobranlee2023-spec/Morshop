import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';

// Layouts
import MainLayout from './components/MainLayout';
import DashboardLayout from './components/DashboardLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/dashboard/Dashboard';
import StoreSettings from './pages/dashboard/StoreSettings';
import Products from './pages/dashboard/Products';
import PublicStore from './pages/PublicStore';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        </Route>

        <Route path="/dashboard" element={user ? <DashboardLayout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="store" element={<StoreSettings />} />
          <Route path="products" element={<Products />} />
        </Route>

        {/* Public Store Route */}
        <Route path="/tienda/:slug" element={<PublicStore />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
