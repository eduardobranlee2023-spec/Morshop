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
      <aside className="w-[220px] shrink-0 border-r flex flex-col" style={{ backgroundColor: 'var(--surface-1)', borderColor: 'var(--border-subtle)' }}>
        <div className="h-[64px] flex items-center px-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <Link to="/" className="flex items-center">
            <img src="/logo-solo.png" alt="Morshop" className="h-[28px] w-auto object-contain" />
          </Link>
        </div>
        
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(item => {
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 px-3 h-[40px] rounded-[4px] text-[14px] font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? 'var(--surface-inset)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? '700' : '500'
                }}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 h-[40px] w-full rounded-[4px] text-[14px] font-medium transition-colors text-left"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-destructive)'; (e.currentTarget as HTMLElement).style.backgroundColor = '#fef2f2'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
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
