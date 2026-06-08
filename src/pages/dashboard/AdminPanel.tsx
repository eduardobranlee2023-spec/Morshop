import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [activeStores, setActiveStores] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  // Filtros del historial
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

  useEffect(() => {
    async function checkAuth() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser || authUser.email !== ADMIN_EMAIL) {
        navigate('/dashboard');
      } else {
        setUser(authUser);
        await loadData();
      }
      setLoading(false);
    }
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [filterStatus, searchTerm, user]);

  const loadData = async () => {
    // Cargar pendientes
    const { data: pending } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (pending) setPendingRequests(pending);

    // Cargar activos
    const { data: active } = await supabase
      .from('stores')
      .select('*')
      .eq('plan', 'plus')
      .order('plan_expires_at', { ascending: true });
    if (active) setActiveStores(active);
  };

  const loadHistory = async () => {
    let query = supabase.from('payment_requests').select('*').order('created_at', { ascending: false });
    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }
    if (searchTerm) {
      query = query.or(`store_name.ilike.%${searchTerm}%,user_email.ilike.%${searchTerm}%`);
    }
    const { data } = await query;
    if (data) setHistory(data);
  };

  const handleActivate = async (req: any) => {
    if (!confirm(`¿Activar plan Plus para ${req.store_name}?`)) return;
    try {
      await supabase.functions.invoke('activate-plus', {
        body: {
          payment_request_id: req.id,
          store_id: req.store_id,
          user_email: req.user_email,
          store_name: req.store_name
        }
      });
      await loadData();
      await loadHistory();
      alert('Plan activado exitosamente.');
    } catch (err: any) {
      alert('Error activando plan: ' + err.message);
    }
  };

  const handleReject = async (req: any) => {
    if (!confirm(`¿Rechazar pago de ${req.store_name}?`)) return;
    try {
      await supabase.functions.invoke('reject-payment', {
        body: {
          payment_request_id: req.id,
          user_email: req.user_email,
          store_name: req.store_name
        }
      });
      await loadData();
      await loadHistory();
      alert('Pago rechazado.');
    } catch (err: any) {
      alert('Error rechazando pago: ' + err.message);
    }
  };

  const handleSendReminders = async () => {
    if (!confirm('¿Ejecutar envío masivo de recordatorios?')) return;
    try {
      const { data, error } = await supabase.functions.invoke('send-expiry-reminders');
      if (error) throw error;
      alert(`Se enviaron ${data.sent} recordatorios.`);
    } catch (err: any) {
      alert('Error al enviar recordatorios: ' + err.message);
    }
  };

  const getDaysLeft = (dateString: string) => {
    if (!dateString) return 0;
    return Math.ceil((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) return <div className="p-8">Cargando panel...</div>;
  if (!user) return null;

  return (
    <div className="max-w-6xl space-y-8 font-sans pb-16">
      <div>
        <h1 className="text-3xl font-extrabold text-[#111] mb-2 flex items-center gap-3">
          Panel de Administración
          {pendingRequests.length > 0 && (
            <span className="text-sm font-bold bg-red-100 text-red-600 px-3 py-1 rounded-full animate-pulse border border-red-200">
              🔴 {pendingRequests.length} pendientes
            </span>
          )}
        </h1>
        <p className="text-gray-600 font-medium">Gestión de pagos y suscripciones Plus</p>
      </div>

      {/* SECCIÓN 1: PENDIENTES */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">📋 Pagos pendientes de activar</h2>
        {pendingRequests.length === 0 ? (
          <p className="text-gray-500 italic">No hay pagos pendientes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="py-3 px-2">Tienda</th>
                  <th className="py-3 px-2">Email</th>
                  <th className="py-3 px-2">Monto</th>
                  <th className="py-3 px-2">Hace</th>
                  <th className="py-3 px-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map(req => {
                  const hoursAgo = Math.floor((new Date().getTime() - new Date(req.created_at).getTime()) / (1000 * 60 * 60));
                  return (
                    <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium">{req.store_name}</td>
                      <td className="py-3 px-2 text-gray-600">{req.user_email}</td>
                      <td className="py-3 px-2 font-medium">${req.amount.toLocaleString('es-AR')}</td>
                      <td className="py-3 px-2 text-gray-600">{hoursAgo} horas</td>
                      <td className="py-3 px-2 flex gap-2">
                        <button onClick={() => handleActivate(req)} className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-lg hover:bg-green-200">✅ Activar</button>
                        <button onClick={() => handleReject(req)} className="bg-red-100 text-red-700 font-bold px-3 py-1 rounded-lg hover:bg-red-200">🔴 Rechazar</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SECCIÓN 2: ACTIVOS */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">⭐ Planes Plus activos</h2>
        {activeStores.length === 0 ? (
          <p className="text-gray-500 italic">No hay tiendas con plan Plus activo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="py-3 px-2">Tienda</th>
                  <th className="py-3 px-2">Activado</th>
                  <th className="py-3 px-2">Vence</th>
                  <th className="py-3 px-2">Días</th>
                  <th className="py-3 px-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {activeStores.map(store => {
                  const daysLeft = getDaysLeft(store.plan_expires_at);
                  let badge = <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">✅ Activo</span>;
                  if (daysLeft < 0) {
                    badge = <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">🔴 Vencido</span>;
                  } else if (daysLeft <= 3) {
                    badge = <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">⚠️ Pronto</span>;
                  }
                  return (
                    <tr key={store.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium">{store.name}</td>
                      <td className="py-3 px-2 text-gray-600">{new Date(store.plan_activated_at).toLocaleDateString('es-AR')}</td>
                      <td className="py-3 px-2 text-gray-600">{new Date(store.plan_expires_at).toLocaleDateString('es-AR')}</td>
                      <td className="py-3 px-2 font-medium">{daysLeft}</td>
                      <td className="py-3 px-2">{badge}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SECCIÓN 3: HISTORIAL */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-xl font-bold">📚 Historial de Pagos</h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobados</option>
              <option value="rejected">Rechazados</option>
            </select>
            <input 
              type="text" 
              placeholder="Buscar tienda o email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="py-3 px-2">Fecha</th>
                <th className="py-3 px-2">Tienda</th>
                <th className="py-3 px-2">Email</th>
                <th className="py-3 px-2">Monto</th>
                <th className="py-3 px-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {history.map(req => (
                <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2 text-gray-600">{new Date(req.created_at).toLocaleDateString('es-AR')}</td>
                  <td className="py-3 px-2 font-medium">{req.store_name}</td>
                  <td className="py-3 px-2 text-gray-600">{req.user_email}</td>
                  <td className="py-3 px-2 font-medium">${req.amount.toLocaleString('es-AR')}</td>
                  <td className="py-3 px-2">
                    {req.status === 'pending' && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">Pendiente</span>}
                    {req.status === 'approved' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Aprobado</span>}
                    {req.status === 'rejected' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Rechazado</span>}
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 px-2 text-center text-gray-500 italic">No hay resultados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECCIÓN 4: ACCIONES GLOBALES */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">⚙️ Acciones Globales</h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleSendReminders}
            className="bg-[#111] hover:bg-gray-800 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            📧 Enviar recordatorios de vencimiento
          </button>
          <p className="text-sm text-gray-500">Ejecuta la función Edge para enviar emails a quienes vencen en 3 días o menos.</p>
        </div>
      </section>
    </div>
  );
}
