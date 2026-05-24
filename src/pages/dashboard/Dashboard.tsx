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
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-xl font-bold mb-2">¡Bienvenido a Morshop!</h2>
          <p className="text-[var(--text-secondary)] mb-6">Parece que todavía no configuraste tu tienda.</p>
          <Link to="/dashboard/store" className="bg-[var(--brand-primary)] text-white px-6 py-2.5 rounded-md font-medium transition-colors hover:bg-blue-700 inline-block">
            Crear mi tienda ahora
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Link Card */}
          <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-neutral-900 text-[16px] mb-1.5">Tu tienda pública</h3>
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <a href={`/tienda/${store.slug}`} target="_blank" rel="noreferrer" className="text-blue-600 font-medium hover:underline flex items-center gap-1.5">
                  {window.location.host}/tienda/{store.slug}
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
            <button 
              onClick={handleCopyLink}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                copied 
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                  : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 shadow-sm'
              }`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? '¡Copiado!' : 'Copiar enlace'}
            </button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6 flex flex-col relative overflow-hidden group hover:border-blue-200 hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-6 text-neutral-100 group-hover:text-blue-50 transition-colors">
                <Package size={80} />
              </div>
              <span className="text-sm font-medium text-neutral-500 mb-2 z-10 flex items-center gap-1.5"><Package size={16}/> Productos</span>
              <span className="text-4xl font-bold text-neutral-900 mb-1 z-10 tracking-tight">{stats.products}</span>
              <span className="text-[13px] text-neutral-400 z-10 font-medium">en tu catálogo</span>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6 flex flex-col relative overflow-hidden group hover:border-amber-200 hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity" style={{ color: 'var(--color-warning)' }}>
                <Star size={80} />
              </div>
              <span className="text-sm font-medium text-neutral-500 mb-2 z-10 flex items-center gap-1.5"><Star size={16} style={{ color: 'var(--color-warning)' }}/> Destacados</span>
              <span className="text-4xl font-bold text-neutral-900 mb-1 z-10 tracking-tight">{stats.featured}<span className="text-neutral-300 text-2xl font-medium">/3</span></span>
              <span className="text-[13px] text-neutral-400 z-10 font-medium">destacados activos</span>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6 flex flex-col relative overflow-hidden group hover:border-emerald-200 hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-6 text-neutral-100 group-hover:text-emerald-50 transition-colors">
                <Eye size={80} />
              </div>
              <span className="text-sm font-medium text-neutral-500 mb-2 z-10 flex items-center gap-1.5"><Eye size={16}/> Estado de Tienda</span>
              <span className="text-2xl font-bold text-neutral-900 mt-2 mb-2.5 z-10 tracking-tight">
                {store.is_published ? 'Pública' : 'Borrador'}
              </span>
              <span className={`text-[12px] font-semibold inline-flex items-center self-start px-2.5 py-1 rounded-md z-10 ${
                store.is_published ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
              }`}>
                {store.is_published ? 'Visible para todos' : 'Oculta al público'}
              </span>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-[16px] mb-5 text-neutral-900">Acciones rápidas</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/dashboard/products" className="bg-neutral-900 hover:bg-black text-white rounded-md px-5 py-2.5 text-sm font-medium text-center flex-1 transition-colors shadow-sm">
                Gestionar productos
              </Link>
              <Link to="/dashboard/store" className="bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-md px-5 py-2.5 text-sm font-medium text-center flex-1 transition-colors shadow-sm">
                Personalizar diseño
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
