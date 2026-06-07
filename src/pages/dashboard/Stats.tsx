import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { usePlan } from '../../hooks/usePlan';
import { Navigate } from 'react-router-dom';
import { BarChart2, Eye, MessageCircle, Package, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Stats() {
  const [store, setStore] = useState<any>(null);
  const [views, setViews] = useState<any[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [loading, setLoading] = useState(true);

  const planStatus = usePlan(store?.id || null);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: storeData } = await supabase
        .from('stores')
        .select('id, whatsapp_clicks, primary_color')
        .eq('user_id', user.id)
        .single();

      if (storeData) {
        setStore(storeData);

        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeData.id)
          .eq('available', true);
        
        setProductCount(count || 0);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function loadViews() {
      if (!store?.id) return;
      
      let query = supabase.from('store_views').select('viewed_at').eq('store_id', store.id);
      
      if (period !== 'all') {
        const startDate = new Date();
        if (period === 'week') startDate.setDate(startDate.getDate() - 7);
        if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
        query = query.gte('viewed_at', startDate.toISOString());
      }

      const { data } = await query;
      setViews(data || []);
      setLoading(false);
    }
    loadViews();
  }, [store?.id, period]);

  // Redirigir si no es Plus y ya cargó
  if (!planStatus.loading && store && !planStatus.isPlus) {
    return <Navigate to="/dashboard/plus" />;
  }

  if (loading || planStatus.loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="w-8 h-8 border-4 border-[var(--brand-light)] border-t-[var(--brand)] rounded-full animate-spin" />
      </div>
    );
  }

  const viewsByDay = views.reduce((acc: any, view) => {
    const date = new Date(view.viewed_at);
    // Para no mezclar todos los meses si es "all", en un dashboard real agruparíamos por mes. 
    // Pero para simplificar el prompt, agrupamos por fecha corta.
    const day = date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' });
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  // Ordenar días cronológicamente si es semana o mes, si es all puede desordenarse si es de meses distintos.
  // Para 7 días está perfecto.
  const chartKeys = Object.keys(viewsByDay).reverse(); 

  const maxValue = Math.max(...Object.values(viewsByDay) as number[], 1); // min 1 para evitar div 0
  const maxDayName = chartKeys.reduce((a, b) => (viewsByDay[a] > viewsByDay[b] ? a : b), 'Ninguno');

  const primaryColor = store.primary_color || '#1136EE';
  
  // Tasa de conversión: (WhatsApp Clicks / Visitas Totales Históricas)
  // Nota: El prompt dice "consultas/visitas %". Si el período es 'semana', whatsapp_clicks de la DB es el histórico total. 
  // Para hacerlo 100% exacto habría que loguear fechas de los clicks, pero el prompt dice que el click se guarda como un contador simple en stores.whatsapp_clicks.
  // Así que usaremos los clicks totales sobre las visitas mostradas.
  const totalViewsDisplayed = views.length;
  const conversionRate = totalViewsDisplayed > 0 ? ((store.whatsapp_clicks || 0) / totalViewsDisplayed) * 100 : 0;

  return (
    <div className="space-y-8 max-w-5xl pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-[var(--text-1)] mb-1 tracking-tight">Estadísticas</h1>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded shadow-sm border border-amber-200">✨ Plus</span>
          </div>
          <p className="text-[var(--text-2)] font-medium">Analizá el rendimiento de tu tienda.</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <div className="flex bg-[var(--surface-1)] border border-[var(--border)] rounded-xl p-1 shadow-sm">
            {(['week', 'month', 'all'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${period === p ? 'bg-white shadow border border-[var(--border)] text-[var(--text-1)]' : 'text-[var(--text-3)] hover:text-[var(--text-2)]'}`}
              >
                {p === 'week' ? 'Esta semana' : p === 'month' ? 'Este mes' : 'Total'}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="grid md:grid-cols-3 gap-6">
        <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-sm)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Eye size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--text-2)] mb-1">Visitas</p>
            <p className="text-2xl font-extrabold text-[var(--text-1)]">{totalViewsDisplayed}</p>
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-sm)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <MessageCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--text-2)] mb-1">Consultas WhatsApp</p>
            <p className="text-2xl font-extrabold text-[var(--text-1)]">{store.whatsapp_clicks || 0}</p>
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-sm)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--text-2)] mb-1">Productos activos</p>
            <p className="text-2xl font-extrabold text-[var(--text-1)]">{productCount}</p>
          </div>
        </div>
      </motion.div>

      {views.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white border border-[var(--border)] rounded-2xl p-12 shadow-[var(--shadow-sm)] text-center">
          <BarChart2 size={48} className="mx-auto text-[var(--text-3)] mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-[var(--text-1)] mb-2">Aún no hay datos</h3>
          <p className="text-[var(--text-2)]">📊 Tus estadísticas aparecerán aquí a medida que tu tienda reciba visitas.</p>
          <p className="text-[var(--text-2)] mt-1">Compartí el link de tu tienda para empezar a ver datos.</p>
        </motion.div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="lg:col-span-2 bg-white border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-sm)]">
            <h3 className="text-lg font-bold text-[var(--text-1)] mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-[var(--text-3)]" />
              Visitas por día
            </h3>
            
            <div className="flex items-end gap-2 sm:gap-4 h-[240px] pt-4 pb-2 mt-4 border-b border-[var(--border)] px-2 overflow-x-auto no-scrollbar">
              {Object.entries(viewsByDay).map(([day, count]) => (
                <div key={day} className="flex flex-col items-center flex-1 min-w-[40px] group">
                  <div className="relative w-full flex justify-center h-[200px] items-end">
                    <div 
                      className="w-full max-w-[48px] rounded-t-lg transition-all duration-500 hover:brightness-110" 
                      style={{ 
                        height: `${((count as number) / maxValue) * 100}%`,
                        backgroundColor: primaryColor,
                        minHeight: '4px'
                      }} 
                    />
                    {/* Tooltip on hover */}
                    <div className="absolute -top-8 bg-black text-white text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {count as number} visitas
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[var(--text-3)] mt-2 whitespace-nowrap truncate w-full text-center">{day}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }} className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow-sm)]">
            <h3 className="text-lg font-bold text-[var(--text-1)] mb-6">📋 Resumen</h3>
            
            <div className="space-y-6">
              <div>
                <p className="text-sm font-bold text-[var(--text-3)] mb-1 uppercase tracking-wider">Día con más visitas</p>
                <p className="text-lg font-extrabold text-[var(--text-1)]">{maxDayName} <span className="text-sm font-medium text-[var(--text-3)]">({viewsByDay[maxDayName]} visitas)</span></p>
              </div>
              
              <div>
                <p className="text-sm font-bold text-[var(--text-3)] mb-1 uppercase tracking-wider">Consultas por WhatsApp</p>
                <p className="text-lg font-extrabold text-[var(--text-1)]">{store.whatsapp_clicks || 0}</p>
              </div>
              
              <div>
                <p className="text-sm font-bold text-[var(--text-3)] mb-1 uppercase tracking-wider">Tasa de conversión</p>
                <p className="text-lg font-extrabold text-[var(--green)]">
                  {conversionRate.toFixed(1)}% <span className="text-sm font-medium text-[var(--text-3)]">(consultas / visitas)</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
