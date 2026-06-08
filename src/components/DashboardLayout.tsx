import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, Settings, Package, LogOut, Menu, X, Sparkles, BarChart2, Shield } from 'lucide-react';
import { usePlan } from '../hooks/usePlan';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [store, setStore] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

  useEffect(() => {
    async function loadStore() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? null);
        const { data: storeData } = await supabase
          .from('stores')
          .select('id, slug, plan, plan_expires_at')
          .eq('user_id', user.id)
          .single();
        if (storeData) {
          setStore(storeData);
        }
      }
    }
    loadStore();
  }, []);

  const planStatus = usePlan(store?.id || null);

  const renderPlanIndicator = () => {
    if (planStatus.loading) {
      return (
        <div className="pt-6 mt-6 border-t border-[var(--border)] animate-pulse px-3">
          <div className="h-4 bg-neutral-200 rounded w-24 mb-2"></div>
          <div className="h-8 bg-neutral-100 rounded w-full"></div>
        </div>
      );
    }

    if (planStatus.isPlus) {
      const formattedDate = planStatus.planExpiresAt
        ? new Date(planStatus.planExpiresAt).toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
          })
        : 'Sin límite';

      return (
        <div className="pt-6 mt-6 border-t border-[var(--border)] px-1">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-1">
              <Sparkles size={16} className="text-amber-500 animate-[pulse_2s_infinite]" />
              <span>✨ Morshop Plus</span>
            </div>
            <p className="text-xs text-amber-700/80 font-medium">
              Activo hasta {formattedDate}
            </p>
          </div>
        </div>
      );
    }

    // Plan Free
    const percentage = Math.min(100, (planStatus.productCount / 15) * 100);
    const remaining = Math.max(0, 15 - planStatus.productCount);
    
    let barColor = 'bg-[var(--brand)]'; // blue
    let textColor = 'text-[var(--text-3)]';
    let warningText = `${planStatus.productCount}/15 prod`;

    if (planStatus.productCount >= 15) {
      barColor = 'bg-red-500';
      textColor = 'text-red-600 font-bold';
      warningText = 'Límite alcanzado';
    } else if (planStatus.productCount >= 13) {
      barColor = 'bg-amber-500';
      textColor = 'text-amber-600 font-bold';
      warningText = `Te queda${remaining === 1 ? '' : 'n'} ${remaining} prod`;
    }

    return (
      <div className="pt-6 mt-6 border-t border-[var(--border)] px-1">
        <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-1)] mb-2">
            <span>Plan Gratuito</span>
            <span className={textColor}>{warningText}</span>
          </div>
          
          {/* Progress Bar Container */}
          <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden mb-4">
            <div 
              className={`h-full ${barColor} transition-all duration-500 rounded-full`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <Link
            to="/dashboard/plus"
            className="group flex items-center justify-center gap-1.5 h-[36px] w-full rounded-xl text-xs font-bold text-amber-900 bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200 active:scale-[0.98] transition-all shadow-sm border border-amber-200"
          >
            <Sparkles size={13} className="text-amber-700 group-hover:scale-110 transition-transform" />
            <span>✨ Mejorar a Plus</span>
          </Link>
        </div>
      </div>
    );
  };

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
    { to: planStatus.isPlus ? '/dashboard/stats' : '/dashboard/plus', icon: BarChart2, label: 'Estadísticas', locked: !planStatus.isPlus }
  ];

  if (userEmail && userEmail === ADMIN_EMAIL) {
    navItems.push({ to: '/dashboard/admin', icon: Shield, label: 'Admin', exact: false, locked: false });
  }

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
                key={item.label}
                to={item.to}
                className={`group relative flex items-center gap-3 px-3 h-[44px] rounded-xl text-[14px] font-medium transition-all duration-200 ${item.locked ? 'opacity-80' : ''}`}
                style={{
                  color: isActive && !item.locked ? 'var(--brand)' : 'var(--text-2)',
                  backgroundColor: isActive && !item.locked ? 'var(--brand-light)' : 'transparent',
                }}
              >
                {isActive && !item.locked && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ backgroundColor: 'var(--brand)', boxShadow: '0 0 8px rgba(17,54,238,0.3)' }} />
                )}
                
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                  ${isActive && !item.locked ? 'bg-white shadow-sm' : 'group-hover:bg-[var(--surface-2)] group-active:scale-95'}
                `} style={{ color: isActive && !item.locked ? 'var(--brand)' : undefined }}>
                  <item.icon size={18} strokeWidth={isActive && !item.locked ? 2.5 : 2} />
                </div>
                
                <span className={`flex-1 flex items-center justify-between transition-transform duration-200 ${isActive && !item.locked ? 'translate-x-0.5 font-bold' : 'group-hover:translate-x-1'}`}>
                  {item.label}
                  {item.locked && <span title="Disponible en Plan Plus" className="text-[10px]">🔒</span>}
                </span>
              </Link>
            );
          })}

          {renderPlanIndicator()}
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
