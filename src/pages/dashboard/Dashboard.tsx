import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { Package, Star, Eye, Copy, Check, ExternalLink } from 'lucide-react';

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

  if (loading) return <div className="p-8 text-[var(--text-tertiary)] font-medium">Cargando resumen...</div>;

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Resumen de tu tienda</h1>
        <p className="text-[var(--text-secondary)] text-sm">Monitoreá el estado y las métricas de tu catálogo.</p>
      </div>
      
      {!store ? (
        <div className="bg-[var(--surface-1)] tactile-card p-8 text-center">
          <h2 className="text-xl font-bold mb-2">¡Bienvenido a Morshop!</h2>
          <p className="text-[var(--text-secondary)] mb-6">Parece que todavía no configuraste tu tienda.</p>
          <Link to="/dashboard/store" className="bg-[var(--brand-primary)] text-white px-6 py-2.5 tactile-btn font-bold inline-block">
            Crear mi tienda ahora
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Link Card */}
          <div className="bg-[var(--surface-1)] tactile-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-[var(--text-primary)] text-[15px] mb-1">Tu tienda pública</h3>
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <a href={`/tienda/${store.slug}`} target="_blank" rel="noreferrer" className="text-[var(--brand-primary)] font-medium hover:underline flex items-center gap-1.5">
                  {window.location.host}/tienda/{store.slug}
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
            <button 
              onClick={handleCopyLink}
              className={`flex items-center gap-2 px-4 py-2 tactile-btn text-sm font-bold transition-all ${
                copied 
                  ? 'bg-[var(--color-success)] text-white' 
                  : 'bg-[var(--surface-base)] text-[var(--text-primary)]'
              }`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? '¡Copiado!' : 'Copiar enlace'}
            </button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[var(--surface-1)] tactile-card p-5 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-5 text-[var(--surface-inset)]">
                <Package size={64} />
              </div>
              <span className="text-sm font-bold text-[var(--text-secondary)] mb-1 z-10 flex items-center gap-1.5"><Package size={16}/> Productos</span>
              <span className="text-3xl font-bold text-[var(--text-primary)] mb-1 z-10">{stats.products}</span>
              <span className="text-[13px] text-[var(--text-tertiary)] z-10">en tu tienda</span>
            </div>

            <div className="bg-[var(--surface-1)] tactile-card p-5 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-5 opacity-20" style={{ color: 'var(--color-warning)' }}>
                <Star size={64} />
              </div>
              <span className="text-sm font-bold text-[var(--text-secondary)] mb-1 z-10 flex items-center gap-1.5"><Star size={16} style={{ color: 'var(--color-warning)' }}/> Destacados</span>
              <span className="text-3xl font-bold text-[var(--text-primary)] mb-1 z-10">{stats.featured}<span className="text-[var(--text-tertiary)] text-xl font-medium">/3</span></span>
              <span className="text-[13px] text-[var(--text-tertiary)] z-10">destacados</span>
            </div>

            <div className="bg-[var(--surface-1)] tactile-card p-5 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-5 text-[var(--surface-inset)]">
                <Eye size={64} />
              </div>
              <span className="text-sm font-bold text-[var(--text-secondary)] mb-1 z-10 flex items-center gap-1.5"><Eye size={16}/> Estado</span>
              <span className="text-2xl font-bold text-[var(--text-primary)] mt-1 mb-1.5 z-10">
                {store.is_published ? 'Pública' : 'Borrador'}
              </span>
              <span className={`text-[12px] font-bold inline-flex items-center self-start px-2 py-0.5 rounded z-10 ${
                store.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-600'
              }`}>
                {store.is_published ? 'Visible para todos' : 'Oculta'}
              </span>
            </div>
          </div>

          <div className="bg-[var(--surface-1)] tactile-card p-6">
            <h3 className="font-bold text-[15px] mb-4 text-[var(--text-primary)]">Acciones rápidas</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/dashboard/products" className="bg-[var(--brand-dark)] text-white tactile-btn px-5 py-2.5 text-sm font-bold text-center flex-1">
                Gestionar productos
              </Link>
              <Link to="/dashboard/store" className="bg-[var(--surface-base)] text-[var(--text-primary)] tactile-btn px-5 py-2.5 text-sm font-bold text-center flex-1">
                Personalizar diseño
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
