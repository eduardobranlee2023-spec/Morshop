import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { Package, Star, Eye, Copy, Check, ExternalLink, Settings, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const duration = 600;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(progress * value));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);
  return <>{display}</>;
}

export default function Dashboard() {
  const [store, setStore] = useState<any>(null);
  const [stats, setStats] = useState({ products: 0, featured: 0 });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadStoreAndStats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (storeData) {
        setStore(storeData);
        
        // Load stats
        const { data: products } = await supabase
          .from('products')
          .select('id, is_featured')
          .eq('store_id', storeData.id);
          
        if (products) {
          setStats({
            products: products.length,
            featured: products.filter(p => p.is_featured).length
          });
        }
      }
      setLoading(false);
    }
    loadStoreAndStats();
  }, []);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/tienda/${store.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="p-8 flex justify-center items-center h-40">
      <div className="w-8 h-8 border-4 border-[var(--brand-light)] border-t-[var(--brand)] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl space-y-8 font-sans">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-extrabold text-[var(--text-1)] mb-1 tracking-tight">Resumen de tu tienda</h1>
        <p className="text-[var(--text-2)] font-medium">Monitoreá el estado y las métricas de tu catálogo.</p>
      </motion.div>

      {store && store.plan_expires_at && (() => {
        const daysLeft = Math.ceil((new Date(store.plan_expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysLeft <= 3 && daysLeft >= 0) {
          return (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 font-medium flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <p>
                Tu Plan Plus vence el {new Date(store.plan_expires_at).toLocaleDateString('es-AR')}. 
                Mercado Pago renovará automáticamente. Si hay algún problema, <Link to="/dashboard/plus" className="underline font-bold text-yellow-900">avisanos acá</Link>.
              </p>
            </div>
          );
        }
        
        if (daysLeft < 0) {
          return (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 font-medium flex items-center gap-3">
              <span className="text-xl">🔴</span>
              <p>
                Tu Plan Plus venció. Tus funciones Plus están pausadas. <Link to="/dashboard/plus" className="underline font-bold text-red-900">Renovar ahora</Link>
              </p>
            </div>
          );
        }
        
        return null;
      })()}
      
      {!store ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] p-12 text-center"
        >
          <div className="w-16 h-16 bg-[var(--brand-light)] text-[var(--brand)] rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings size={32} />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-1)] mb-3">¡Bienvenido a Morshop!</h2>
          <p className="text-[var(--text-2)] mb-8 max-w-md mx-auto text-lg">Parece que todavía no configuraste tu tienda. Empezá ahora y vendé hoy mismo.</p>
          <Link to="/dashboard/store" className="bg-[var(--brand)] text-white px-8 py-3 rounded-xl font-bold transition-all hover:bg-[var(--brand-dark)] hover:shadow-md inline-flex items-center gap-2">
            Crear mi tienda ahora <ExternalLink size={18} />
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Quick Link Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
            style={{
              background: 'linear-gradient(135deg, var(--brand-light) 0%, #FFFFFF 100%)',
              border: '1px solid rgba(17, 54, 238, 0.2)'
            }}
          >
            <div>
              <h3 className="font-bold text-[var(--text-1)] text-lg mb-2">Tu tienda pública</h3>
              <p className="text-[var(--text-2)] text-sm mb-3">Compartí este enlace con tus clientes para que puedan comprarte.</p>
              <a href={`/tienda/${store.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[var(--brand)] font-semibold hover:underline bg-white/50 px-3 py-1.5 rounded-lg">
                {window.location.host}/tienda/{store.slug}
                <ExternalLink size={16} />
              </a>
            </div>
            <button 
              onClick={handleCopyLink}
              className={`shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                copied 
                  ? 'bg-[var(--green)] text-white shadow-md transform scale-105' 
                  : 'bg-white border border-[var(--border-strong)] text-[var(--text-1)] hover:bg-[var(--surface-1)] hover:shadow-sm'
              }`}
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
              {copied ? '¡Enlace copiado!' : 'Copiar enlace'}
            </button>
          </motion.div>

          {/* Metrics */}
          <div className="bg-white border border-[var(--line)] rounded-[17px] p-6 shadow-[0_18px_45px_#0b285512] mb-6">
            <h3 className="m-0 text-[21px] font-display font-bold text-[var(--navy-950)]">Resumen de actividad</h3>
            
            <div className="h-[100px] mt-[15px] rounded-[11px] relative overflow-hidden" style={{ background: 'linear-gradient(180deg,#dce7ff,#f8faff)' }}>
              <svg viewBox="0 0 500 130" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                <path d="M0,99 C60,88 80,104 130,80 C180,55 190,88 250,51 C302,19 338,68 390,33 C430,7 455,31 500,8" fill="none" stroke="#284cff" strokeWidth="4"/>
                <path d="M0,99 C60,88 80,104 130,80 C180,55 190,88 250,51 C302,19 338,68 390,33 C430,7 455,31 500,8 L500,130 L0,130Z" fill="#284cff12"/>
              </svg>
            </div>
            
            <div className="grid grid-cols-3 gap-[9px] mt-[12px]">
              <div className="p-[10px] border border-[#e2e9f3] rounded-[9px] text-[9px] color-[#6b788c]">
                PRODUCTOS
                <b className="block font-display font-bold text-[16px] text-[var(--navy-950)] mt-[3px]">
                  <AnimatedNumber value={stats.products} />
                </b>
              </div>
              <div className="p-[10px] border border-[#e2e9f3] rounded-[9px] text-[9px] color-[#6b788c]">
                DESTACADOS
                <b className="block font-display font-bold text-[16px] text-[var(--navy-950)] mt-[3px]">
                  <AnimatedNumber value={stats.featured} /><span className="text-gray-400 font-normal">/3</span>
                </b>
              </div>
              <div className="p-[10px] border border-[#e2e9f3] rounded-[9px] text-[9px] color-[#6b788c]">
                ESTADO
                <b className="block font-display font-bold text-[14px] text-[var(--success)] mt-[3px] flex items-center">
                  <span className="w-[6px] h-[6px] bg-[var(--success)] rounded-full mr-[4px]"></span>
                  {store.is_published ? 'Activa' : 'Borrador'}
                </b>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }}
            className="bg-white border border-[var(--line)] rounded-[17px] shadow-[0_18px_45px_#0b285512] p-6 sm:p-8"
          >
            <h3 className="font-display font-bold text-[var(--navy-950)] text-lg mb-6">Acciones rápidas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link to="/dashboard/products" className="btn btn-primary w-full justify-center py-4 text-[15px]">
                <Plus size={20} />
                Agregar Producto
              </Link>
              <Link to="/dashboard/store" className="btn btn-secondary w-full justify-center py-4 text-[15px]">
                <Settings size={20} />
                Configurar Tienda
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
