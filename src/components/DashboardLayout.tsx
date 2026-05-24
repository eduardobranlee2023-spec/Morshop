import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, Settings, Package, LogOut } from 'lucide-react';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Resumen', exact: true },
    { to: '/dashboard/store', icon: Settings, label: 'Mi Tienda' },
    { to: '/dashboard/products', icon: Package, label: 'Productos' },
  ];

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--surface-base)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside className="w-[240px] shrink-0 border-r flex flex-col bg-white shadow-[1px_0_10px_rgb(0,0,0,0.02)]" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="h-[72px] flex items-center px-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <Link to="/" className="flex items-center">
            <img src="/logo-completo-2.png" alt="Morshop" className="h-[28px] w-auto object-contain" />
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map(item => {
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 px-3 h-[42px] rounded-md text-[14px] transition-colors"
                style={{
                  backgroundColor: isActive ? '#f3f4f6' : 'transparent',
                  color: isActive ? '#111827' : '#4b5563',
                  fontWeight: isActive ? '600' : '500'
                }}
                onMouseEnter={e => { if(!isActive) { (e.currentTarget as HTMLElement).style.backgroundColor = '#f9fafb'; (e.currentTarget as HTMLElement).style.color = '#111827'; } }}
                onMouseLeave={e => { if(!isActive) { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#4b5563'; } }}
              >
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-neutral-100">
            <Link
              to="/dashboard/plus"
              className="flex items-center justify-between px-3 h-[42px] rounded-md text-[14px] font-semibold transition-colors bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 hover:from-amber-100 hover:to-orange-100 border border-amber-200/50"
            >
              <div className="flex items-center gap-2">
                <span>✨</span>
                <span>Plan Plus</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-sm">Próximamente</span>
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 h-[42px] w-full rounded-md text-[14px] font-medium transition-colors text-left text-neutral-500 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
