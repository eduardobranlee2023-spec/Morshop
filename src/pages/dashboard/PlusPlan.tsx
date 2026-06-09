import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { usePlan } from '../../hooks/usePlan';
import {
  ArrowLeft,
  Check,
  X,
  Sparkles,
  Clock,
  ChevronDown,
  Shield,
  Zap,
  Star,
  ExternalLink,
} from 'lucide-react';


// ─── Types ───────────────────────────────────────────────────────────────────

interface PaymentModalProps {
  storeId: string | null;
  onClose: () => void;
}

function PaymentModal({ storeId, onClose }: PaymentModalProps) {
  const [notified, setNotified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const MP_SUBSCRIPTION_LINK = 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=02f92afbfec44ee09976d86a16301ae5';

  const handleNotifyPayment = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { data: storeData, error: storeError } = await supabase.from('stores').select('name').eq('id', storeId).single();
      if (storeError || !storeData) throw new Error("Tienda no encontrada");

      const { error } = await supabase
        .from('payment_requests')
        .insert({
          store_id: storeId,
          user_id: user.id,
          store_name: storeData.name,
          user_email: user.email,
          amount: 18900,
          status: 'pending',
        });

      if (error) throw error;

      // Llamar Edge Function para enviar email de confirmación al vendedor
      await supabase.functions.invoke('send-payment-notice', {
        body: { email: user.email, store_name: storeData.name },
      });
      
      setNotified(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Ocurrió un error al enviar el aviso.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        backgroundColor: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '32px 28px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
          animation: 'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111', margin: '0 0 8px' }}>
            ⭐ Plan Plus — $18.400/mes
          </h2>
          <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>
            Cobro automático mensual por Mercado Pago. Cancelás cuando querés.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Paso 1 */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{
              width: '32px', height: '32px', borderRadius: '50%', background: '#1136EE', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0
            }}>1</span>
            <div>
              <p style={{ margin: '0 0 4px', fontWeight: 'bold', color: '#111' }}>Suscribite en Mercado Pago</p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 12px' }}>
                Se abre MP con el plan ya cargado. Elegís tu medio de pago y listo.
              </p>
              <button
                onClick={() => window.open(MP_SUBSCRIPTION_LINK, '_blank')}
                style={{
                  background: '#009ee3', color: '#fff', border: 'none', borderRadius: '10px',
                  padding: '12px 20px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                💳 Suscribirme con Mercado Pago
              </button>
            </div>
          </div>

          <div style={{ height: '1px', background: '#f3f4f6' }} />

          {/* Paso 2 */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{
              width: '32px', height: '32px', borderRadius: '50%', background: '#1136EE', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0
            }}>2</span>
            <div>
              <p style={{ margin: '0 0 4px', fontWeight: 'bold', color: '#111' }}>Avisanos que pagaste</p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 12px' }}>
                En pocas horas activamos tu plan y te avisamos por email.
              </p>
              <button
                onClick={handleNotifyPayment}
                disabled={notified || loading}
                style={{
                  background: notified ? '#10b981' : '#111', color: '#fff', border: 'none', borderRadius: '10px',
                  padding: '12px 20px', fontSize: '14px', fontWeight: 'bold',
                  cursor: (notified || loading) ? 'not-allowed' : 'pointer',
                  width: '100%', opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Enviando...' : notified ? '✓ Aviso enviado' : 'Ya pagué, activar mi Plus'}
              </button>
              {errorMsg && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px', marginBottom: 0 }}>{errorMsg}</p>}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{ background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer', fontWeight: 500 }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: '1px solid #f3f4f6',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 0', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', gap: '16px',
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#111', lineHeight: 1.4 }}>{q}</span>
        <div style={{
          flexShrink: 0,
          width: '28px', height: '28px',
          borderRadius: '50%',
          background: open ? 'var(--brand)' : '#f3f4f6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s',
        }}>
          <ChevronDown
            size={16}
            color={open ? '#fff' : '#6b7280'}
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }}
          />
        </div>
      </button>
      <div style={{
        maxHeight: open ? '200px' : '0px',
        overflow: 'hidden',
        transition: 'max-height 0.3s ease',
      }}>
        <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: 1.6, margin: '0 0 18px', paddingRight: '44px' }}>
          {a}
        </p>
      </div>
    </div>
  );
}

// ─── Feature Row ──────────────────────────────────────────────────────────────

function FeatureRow({ label, free, plus }: { label: string; free: boolean | 'coming'; plus: boolean | 'coming' }) {
  const renderCell = (val: boolean | 'coming') => {
    if (val === 'coming') {
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '13px', fontWeight: 600 }}>
          <Clock size={13} /> Próximamente
        </span>
      );
    }
    return val
      ? <Check size={18} color="#22c55e" strokeWidth={2.5} />
      : <X size={16} color="#d1d5db" strokeWidth={2.5} />;
  };

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto auto',
      alignItems: 'center', gap: '8px',
      padding: '12px 0',
      borderBottom: '1px solid #f9fafb',
    }}>
      <span style={{ fontSize: '14px', color: '#374151' }}>{label}</span>
      <div style={{ width: '72px', display: 'flex', justifyContent: 'center' }}>{renderCell(free)}</div>
      <div style={{ width: '72px', display: 'flex', justifyContent: 'center' }}>{renderCell(plus)}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PlusPlan() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<'plus' | null>(null);

  const planStatus = usePlan(storeId);

  useEffect(() => {
    async function loadStore() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('stores')
        .select('id, plan_expires_at')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setStoreId(data.id);
        setPlanExpiresAt(data.plan_expires_at);
      }
    }
    loadStore();
  }, []);

  const formattedExpiry = planExpiresAt
    ? new Date(planExpiresAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const faqItems = [
    {
      q: '¿Puedo cancelar cuando quiera?',
      a: 'Sí. Podés cancelar tu suscripción en cualquier momento desde tu panel. No hay permanencia mínima ni penalidades.',
    },
    {
      q: '¿Qué pasa con mis productos si cancelo?',
      a: 'Si volvés al plan gratuito, tus productos quedan guardados pero solo los primeros 15 serán visibles en tu tienda. No perdés ningún dato.',
    },
    {
      q: '¿El plan gratuito es realmente gratis para siempre?',
      a: 'Sí. El plan gratuito no tiene vencimiento. Podés tener tu tienda con hasta 15 productos sin pagar nada, por siempre.',
    },
    {
      q: '¿Cómo se procesa el pago?',
      a: 'Los pagos se procesan de forma segura a través de Mercado Pago. Aceptamos tarjetas de débito, crédito y dinero en cuenta de Mercado Pago.',
    },
  ];

  // ── Vista para usuarios Plus activos ────────────────────────────────────────
  if (!planStatus.loading && planStatus.isPlus) {
    return (
      <>
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.9) translateY(10px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes badgePulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
            50% { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
          }
        `}</style>

        <div style={{ maxWidth: '680px', margin: '0 auto', paddingBottom: '48px' }}>
          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              color: '#6b7280', fontSize: '14px', fontWeight: 500,
              textDecoration: 'none', marginBottom: '32px',
              transition: 'color 0.2s',
            }}
          >
            <ArrowLeft size={16} /> Volver al resumen
          </Link>

          {/* Active Plus Card */}
          <div style={{
            background: 'linear-gradient(135deg, #1136EE 0%, #0A25C4 100%)',
            borderRadius: '24px',
            padding: '48px 40px',
            color: '#fff',
            textAlign: 'center',
            marginBottom: '24px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decorative circles */}
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ position: 'absolute', bottom: '-60px', left: '-30px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
              Ya sos Morshop Plus
            </h1>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)',
              borderRadius: '100px', padding: '6px 16px',
              marginBottom: '20px',
              animation: 'badgePulse 2.5s infinite',
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#4ade80' }}>ACTIVO</span>
            </div>

            {formattedExpiry && (
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.75)', margin: '0 0 0' }}>
                Tu suscripción está activa hasta el <strong style={{ color: '#fff' }}>{formattedExpiry}</strong>
              </p>
            )}
          </div>

          {/* Benefits */}
          <div style={{
            background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: '20px', padding: '28px 32px',
            marginBottom: '20px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111', margin: '0 0 20px' }}>
              Lo que tenés incluido
            </h3>
            {[
              'Productos ilimitados',
              'Sin branding de Morshop en tu tienda',
              'Redes sociales visibles en tu tienda',
              'Colores y logo personalizados',
              'Carrito virtual',
              'Consultas por WhatsApp',
              'Soporte prioritario',
            ].map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1136EE, #0A25C4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Check size={13} color="#fff" strokeWidth={3} />
                </div>
                <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>{f}</span>
              </div>
            ))}
          </div>

          {/* Manage */}
          <a
            href="mailto:soporte@morshop.com?subject=Gestionar suscripción Plus"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              width: '100%', padding: '14px',
              background: '#f9fafb', border: '1px solid #e5e7eb',
              borderRadius: '14px', color: '#374151',
              fontSize: '14px', fontWeight: 600,
              textDecoration: 'none', cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#f3f4f6'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#f9fafb'; }}
          >
            <ExternalLink size={16} /> Gestionar suscripción
          </a>
        </div>
      </>
    );
  }

  // ── Vista de pricing para usuarios Free ─────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .plus-card-hover {
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s;
        }
        .plus-card-hover:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 60px rgba(17,54,238,0.15) !important;
        }
        @media (max-width: 640px) {
          .plan-grid { grid-template-columns: 1fr !important; }
          .header-title { font-size: 28px !important; }
          .header-subtitle { font-size: 16px !important; }
          .comparison-table { display: none !important; }
          .header-pad { padding: 40px 24px !important; }
        }
      `}</style>

      <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '64px' }}>

        {/* Back link */}
        <Link
          to="/dashboard"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            color: '#6b7280', fontSize: '14px', fontWeight: 500,
            textDecoration: 'none', marginBottom: '32px',
            transition: 'color 0.2s',
          }}
        >
          <ArrowLeft size={16} /> Volver al resumen
        </Link>

        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <div
          className="header-pad"
          style={{
            background: 'linear-gradient(135deg, #1136EE 0%, #0A25C4 100%)',
            borderRadius: '24px',
            padding: '60px 40px',
            textAlign: 'center',
            marginBottom: '40px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative blobs */}
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '-40px', width: '260px', height: '260px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '40px', left: '60px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

          <div style={{ fontSize: '44px', marginBottom: '16px', animation: 'float 3s ease-in-out infinite' }}>✨</div>
          <h1
            className="header-title"
            style={{ fontSize: '48px', fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: '-1px', lineHeight: 1.1 }}
          >
            Morshop Plus
          </h1>
          <p
            className="header-subtitle"
            style={{ fontSize: '18px', color: 'rgba(255,255,255,0.85)', margin: '0 0 24px', fontWeight: 400 }}
          >
            Llevá tu tienda al siguiente nivel
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '100px', padding: '8px 20px',
            color: '#fff', fontSize: '15px', fontWeight: 700,
          }}>
            <Zap size={15} fill="#fff" />
            Solo $18.400/mes · Cancelá cuando quieras
          </div>
        </div>

        {/* ── PLAN CARDS ────────────────────────────────────────────────────── */}
        <div
          className="plan-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '48px',
            alignItems: 'start',
          }}
        >
          {/* Free Card */}
          <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '20px',
            padding: '32px 28px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111', margin: '0 0 4px' }}>
              Plan Gratuito
            </h2>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '0 0 8px' }}>
              <span style={{ fontSize: '36px', fontWeight: 900, color: '#111' }}>$0</span>
              <span style={{ color: '#9ca3af', fontSize: '15px' }}> / mes</span>
            </div>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 24px' }}>
              Lo esencial para empezar
            </p>

            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '20px' }}>
              {[
                { label: 'Hasta 15 productos', ok: true },
                { label: 'Colores y logo personalizados', ok: true },
                { label: 'Carrito virtual', ok: true },
                { label: 'Consultas por WhatsApp', ok: true },
                { label: 'Link público de tu tienda', ok: true },
                { label: 'Banner de portada', ok: true },
                { label: 'Redes sociales en la tienda', ok: false },
                { label: 'Sin branding de Morshop', ok: false },
                { label: 'Productos ilimitados', ok: false },
              ].map(({ label, ok }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '7px 0',
                }}>
                  {ok
                    ? <Check size={16} color="#22c55e" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    : <X size={15} color="#d1d5db" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                  }
                  <span style={{ fontSize: '14px', color: ok ? '#374151' : '#9ca3af' }}>{label}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '28px' }}>
              <button
                disabled
                style={{
                  width: '100%', padding: '13px',
                  background: '#f3f4f6', color: '#9ca3af',
                  border: 'none', borderRadius: '12px',
                  fontSize: '14px', fontWeight: 600,
                  cursor: 'not-allowed',
                }}
              >
                Tu plan actual
              </button>
            </div>
          </div>

          {/* Plus Card */}
          <div
            className="plus-card-hover"
            onMouseEnter={() => setHoveredCard('plus')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              background: 'linear-gradient(160deg, #eef2ff 0%, #f0f4ff 100%)',
              border: '2px solid var(--brand, #1136EE)',
              borderRadius: '20px',
              padding: '32px 28px',
              boxShadow: '0 8px 32px rgba(17,54,238,0.10)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Most popular badge */}
            <div style={{
              position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #1136EE, #0A25C4)',
              color: '#fff', fontSize: '11px', fontWeight: 800,
              letterSpacing: '0.08em', padding: '5px 18px',
              borderRadius: '0 0 12px 12px',
            }}>
              MÁS POPULAR
            </div>

            <div style={{ marginTop: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Sparkles size={20} color="#1136EE" />
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1136EE', margin: 0 }}>
                  Morshop Plus
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '4px 0 8px' }}>
                <span style={{ fontSize: '36px', fontWeight: 900, color: '#111' }}>$18.400</span>
                <span style={{ color: '#6b7280', fontSize: '15px' }}> / mes</span>
              </div>
              <p style={{ color: '#4b5563', fontSize: '14px', margin: '0 0 24px' }}>
                Todo lo que necesitás para vender más
              </p>

              <div style={{ borderTop: '1px solid rgba(17,54,238,0.12)', paddingTop: '20px' }}>
                {[
                  { label: 'Productos ilimitados', type: 'check' },
                  { label: 'Formulario de pedido avanzado', type: 'check' },
                  { label: 'Tipografías premium', type: 'check' },
                  { label: 'Hasta 2 imágenes por producto', type: 'check' },
                  { label: 'Estadísticas de tu tienda', type: 'check' },
                  { label: 'Estilos visuales avanzados', type: 'check' },
                  { label: 'Sin branding de Morshop', type: 'check' },
                  { label: 'Redes sociales en tu tienda', type: 'check' },
                  { label: 'Colores y logo personalizados', type: 'check' },
                  { label: 'Carrito virtual', type: 'check' },
                  { label: 'Consultas por WhatsApp', type: 'check' },
                  { label: 'Soporte prioritario', type: 'check' },
                ].map(({ label, type }) => (
                  <div key={label} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '7px 0',
                  }}>
                    {type === 'check' ? (
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #1136EE, #0A25C4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={12} color="#fff" strokeWidth={3} />
                      </div>
                    ) : (
                      <Clock size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
                    )}
                    <span style={{
                      fontSize: '14px',
                      color: type === 'coming' ? '#92400e' : '#1e3a8a',
                      fontWeight: type === 'check' ? 500 : 400,
                    }}>
                      {label}
                      {type === 'coming' && (
                        <span style={{ fontSize: '12px', color: '#b45309', marginLeft: '6px', fontStyle: 'italic' }}>
                          (próximamente)
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '28px' }}>
                <button
                  onClick={() => setShowModal(true)}
                  style={{
                    width: '100%',
                    background: hoveredCard === 'plus'
                      ? 'linear-gradient(135deg, #2545f5 0%, #1136EE 100%)'
                      : 'linear-gradient(135deg, #1136EE 0%, #0A25C4 100%)',
                    color: '#fff', border: 'none',
                    borderRadius: '14px', padding: '15px',
                    fontSize: '15px', fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(17,54,238,0.35)',
                    transition: 'background 0.2s, transform 0.15s, box-shadow 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  <Sparkles size={16} />
                  Suscribirme ahora →
                </button>
                <p style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', margin: '10px 0 0' }}>
                  Sin compromisos · Cancelá cuando quieras
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── COMPARACIÓN DETALLADA (desktop) ──────────────────────────────── */}
        <div
          className="comparison-table"
          style={{
            background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: '20px', padding: '32px',
            marginBottom: '48px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111', margin: '0 0 4px' }}>
            Comparación detallada
          </h3>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 24px' }}>
            Todo lo que incluye cada plan
          </p>

          {/* Header row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto auto',
            padding: '10px 0 12px',
            borderBottom: '2px solid #e5e7eb',
            gap: '8px',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Función</span>
            <div style={{ width: '72px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>Gratis</div>
            <div style={{
              width: '72px', textAlign: 'center', fontSize: '13px', fontWeight: 800,
              color: '#1136EE',
            }}>Plus ✨</div>
          </div>

          <FeatureRow label="Hasta 15 productos" free={true} plus={true} />
          <FeatureRow label="Productos ilimitados" free={false} plus={true} />
          <FeatureRow label="Formulario de pedido avanzado" free={false} plus={true} />
          <FeatureRow label="Tipografías premium" free={false} plus={true} />
          <FeatureRow label="Hasta 2 imágenes por producto" free={false} plus={true} />
          <FeatureRow label="Estadísticas de tu tienda" free={false} plus={true} />
          <FeatureRow label="Estilos visuales avanzados" free={false} plus={true} />
          <FeatureRow label="Colores y logo personalizados" free={true} plus={true} />
          <FeatureRow label="Carrito virtual" free={true} plus={true} />
          <FeatureRow label="Consultas por WhatsApp" free={true} plus={true} />
          <FeatureRow label="Banner de portada" free={true} plus={true} />
          <FeatureRow label="Redes sociales en la tienda" free={false} plus={true} />
          <FeatureRow label="Sin branding de Morshop" free={false} plus={true} />
          <FeatureRow label="Soporte prioritario" free={false} plus={true} />
        </div>

        {/* ── GARANTÍA ─────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: '8px', padding: '28px', background: '#f9fafb',
          borderRadius: '16px', marginBottom: '48px',
          border: '1px solid #f3f4f6',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #1136EE, #0A25C4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Shield size={18} color="#fff" />
            </div>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#111' }}>
              Pago seguro con Mercado Pago
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Cancelá cuando quieras', 'Sin compromisos', 'Soporte en español'].map((text) => (
              <span key={text} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '13px', fontWeight: 500 }}>
                <Check size={13} color="#22c55e" strokeWidth={3} />
                {text}
              </span>
            ))}
          </div>
        </div>

        {/* ── SOCIAL PROOF ─────────────────────────────────────────────────── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px', marginBottom: '48px',
        }}>
          {[
            { icon: '🛍️', value: '+500', label: 'tiendas activas' },
            { icon: '⭐', value: '4.9', label: 'valoración promedio' },
            { icon: '💬', value: '24hs', label: 'soporte promedio' },
          ].map(({ icon, value, label }) => (
            <div key={label} style={{
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: '16px', padding: '20px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{icon}</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#111', marginBottom: '2px' }}>{value}</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb',
          borderRadius: '20px', padding: '32px',
          marginBottom: '40px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <Star size={20} color="#1136EE" />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111', margin: 0 }}>
              Preguntas frecuentes
            </h3>
          </div>
          {faqItems.map((item) => (
            <FAQItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>

        {/* ── BOTTOM CTA ───────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #1136EE 0%, #0A25C4 100%)',
          borderRadius: '20px', padding: '36px 32px',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>
            ¿Listo para vender más?
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', margin: '0 0 24px' }}>
            Sumate a los vendedores que ya eligieron Morshop Plus
          </p>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: '#fff', color: '#1136EE',
              border: 'none', borderRadius: '14px',
              padding: '14px 32px', fontSize: '15px', fontWeight: 800,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              transition: 'transform 0.15s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'; }}
          >
            <Sparkles size={16} color="#1136EE" />
            Empezar ahora
          </button>
        </div>
      </div>

      {/* ── PAYMENT MODAL ───────────────────────────────────────────────────── */}
      {showModal && (
        <PaymentModal storeId={storeId} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
