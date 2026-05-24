import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, Settings, Package, LogOut, Menu, X, Sparkles } from 'lucide-react';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [sidebarOpen]);

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
    <div className="min-h-screen flex bg-[var(--surface-1)]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Mobile Header (Glassmorphism) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-[60px] bg-white/80 backdrop-blur-md border-b border-[var(--border)] z-30 flex items-center justify-between px-4">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-center text-[var(--text-2)] rounded-full hover:bg-[var(--surface-2)] active:bg-[var(--surface-inset)] transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={24} />
        </button>
        <Link to="/" className="flex items-center">
          <img src="/logo-completo-2.png" alt="Morshop" className="h-[24px] w-auto object-contain" />
        </Link>
        <div className="w-10 h-10" /> {/* Spacer to perfectly center the logo */}
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-[var(--border)]
          flex flex-col transform transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0
        `}
      >
        <div className="h-[60px] md:h-[72px] flex items-center justify-between px-6 border-b border-[var(--border)] shrink-0">
          <Link to="/" className="flex items-center group">
            <img src="/logo-completo-2.png" alt="Morshop" className="h-[26px] w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
          </Link>
          <button 
            className="md:hidden w-8 h-8 flex items-center justify-center text-[var(--text-3)] hover:text-[var(--text-1)] rounded-full hover:bg-[var(--surface-2)] transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
          {navItems.map(item => {
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className="group relative flex items-center gap-3 px-3 h-[44px] rounded-xl text-[14px] font-medium transition-all duration-200"
                style={{
                  color: isActive ? 'var(--brand)' : 'var(--text-2)',
                  backgroundColor: isActive ? 'var(--brand-light)' : 'transparent',
                }}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ backgroundColor: 'var(--brand)', boxShadow: '0 0 8px rgba(17,54,238,0.3)' }} />
                )}
                
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                  ${isActive ? 'bg-white shadow-sm' : 'group-hover:bg-[var(--surface-2)] group-active:scale-95'}
                `} style={{ color: isActive ? 'var(--brand)' : undefined }}>
                  <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                
                <span className={`transition-transform duration-200 ${isActive ? 'translate-x-0.5 font-bold' : 'group-hover:translate-x-1'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          <div className="pt-6 mt-6 border-t border-[var(--border)]">
            <Link
              to="/dashboard/plus"
              className="relative overflow-hidden group flex items-center justify-between px-3 h-[48px] rounded-xl text-[14px] font-semibold transition-all duration-300 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 hover:shadow-[0_4px_12px_rgba(245,158,11,0.1)] hover:border-amber-300 active:scale-[0.98]"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              
              <div className="flex items-center gap-2 text-amber-800 z-10 relative">
                <Sparkles size={16} className="text-amber-500 animate-[pulse_2s_ease-in-out_infinite]" />
                <span className="group-hover:translate-x-0.5 transition-transform duration-200">Plan Plus</span>
              </div>
              <span className="z-10 relative text-[10px] uppercase font-bold tracking-wider bg-gradient-to-r from-amber-200 to-orange-200 text-amber-900 px-2 py-1 rounded-md shadow-sm">
                Pronto
              </span>
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-[var(--border)] shrink-0">
          <button
            onClick={handleLogout}
            className="group flex items-center gap-3 px-3 h-[44px] w-full rounded-xl text-[14px] font-medium transition-all duration-200 text-[var(--text-2)] hover:text-red-600 hover:bg-red-50 active:scale-[0.98]"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors group-hover:bg-red-100">
              <LogOut size={18} />
            </div>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto pt-[60px] md:pt-0 scroll-smooth">
        <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto w-full min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
