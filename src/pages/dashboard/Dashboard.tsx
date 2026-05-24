import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { Package, Star, Eye, Copy, Check, ExternalLink, Settings, Plus } from 'lucide-react';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';

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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] p-6 hover:shadow-[var(--shadow-md)] hover:border-[var(--brand)]/30 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <Package size={24} />
              </div>
              <p className="text-[var(--text-2)] font-medium mb-1">Total de productos</p>
              <div className="text-4xl font-extrabold text-[var(--text-1)]">
                <CountUp end={stats.products} duration={0.8} />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-white border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] p-6 hover:shadow-[var(--shadow-md)] hover:border-amber-500/30 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4">
                <Star size={24} />
              </div>
              <p className="text-[var(--text-2)] font-medium mb-1">Destacados activos</p>
              <div className="text-4xl font-extrabold text-[var(--text-1)]">
                <CountUp end={stats.featured} duration={0.8} /><span className="text-[var(--text-3)] text-2xl">/3</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}
              className="bg-white border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] p-6 hover:shadow-[var(--shadow-md)] hover:border-[var(--green)]/30 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-emerald-50 text-[var(--green)] rounded-full flex items-center justify-center mb-4">
                <Eye size={24} />
              </div>
              <p className="text-[var(--text-2)] font-medium mb-1">Estado actual</p>
              <div className="mt-2 inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                {store.is_published ? 'Tienda Pública' : 'Borrador'}
              </div>
            </motion.div>
          </div>

          {/* Acciones Rápidas */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }}
            className="bg-white border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] p-6 sm:p-8"
          >
            <h3 className="font-bold text-[var(--text-1)] text-lg mb-6">Acciones rápidas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link to="/dashboard/products" className="flex items-center justify-center gap-3 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white rounded-xl px-6 py-4 font-bold transition-all shadow-[var(--shadow-sm)] hover:shadow-md hover:scale-[1.01] active:scale-95">
                <Plus size={20} />
                Agregar Producto
              </Link>
              <Link to="/dashboard/store" className="flex items-center justify-center gap-3 bg-white border-2 border-[var(--border-strong)] hover:bg-[var(--surface-1)] text-[var(--text-1)] rounded-xl px-6 py-4 font-bold transition-all hover:scale-[1.01] active:scale-95">
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
