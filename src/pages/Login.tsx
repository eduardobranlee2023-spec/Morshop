import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: 'https://morshop.vercel.app/dashboard',
          },
        });
        if (error) throw error;
        setEmailSent(true);
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: 'https://morshop.vercel.app/dashboard',
        },
      });
      if (error) throw error;
      alert('Correo reenviado exitosamente.');
    } catch (err: any) {
      alert(err.message || 'Error al reenviar correo.');
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 md:p-12 rounded-2xl shadow-xl w-full max-w-[480px] text-center border border-gray-100"
        >
          <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '16px' }}>📧</div>
          
          <h2 className="text-3xl font-extrabold text-[var(--text-1)] tracking-tight mb-4">Revisá tu correo</h2>
          
          <p className="text-[var(--text-2)] font-medium mb-8">
            Te enviamos un link de verificación a <strong>{email}</strong>.<br />
            Tocá el botón del correo para activar tu cuenta y empezar a crear tu tienda.
          </p>

          <div className="text-left bg-gray-50 p-6 rounded-xl space-y-4 mb-8 border border-gray-100">
            <p className="font-medium text-gray-700">📩 Paso 1 — Abrí tu casilla de correo</p>
            <p className="font-medium text-gray-700">🔗 Paso 2 — Tocá "Confirm email address"</p>
            <p className="font-medium text-[var(--brand)]">🚀 Paso 3 — Te redirige automáticamente a Morshop</p>
          </div>

          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '16px', fontWeight: 500 }}>
            ¿No te llegó? Revisá la carpeta de spam o{' '}
            <button onClick={handleResendEmail} style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}>
              reenviá el correo
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white font-sans selection:bg-[var(--brand-light)] selection:text-[var(--brand-dark)]">
      
      {/* LEFT PANEL (Desktop only) */}
      <div className="hidden lg:flex lg:w-[40%] bg-[var(--brand)] text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] bg-[var(--brand-light)] opacity-10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-[20%] -right-[20%] w-[80%] h-[80%] bg-[var(--brand-dark)] opacity-40 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <Link to="/">
            <img src="/logo-completo-2.png" alt="Morshop" className="h-[32px] w-auto brightness-0 invert mb-20" />
          </Link>
          
          <h1 className="text-[40px] font-extrabold leading-[1.1] tracking-tight mb-10">
            Miles de emprendedores<br />ya venden con Morshop
          </h1>
          
          <ul className="space-y-6 text-lg font-medium opacity-90">
            <li className="flex items-center gap-3"><CheckCircle2 className="text-[var(--brand-light)]" size={24} /> Tu tienda lista en 10 minutos</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="text-[var(--brand-light)]" size={24} /> Sin comisiones por venta</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="text-[var(--brand-light)]" size={24} /> Tus clientes compran por WhatsApp</li>
          </ul>
        </div>
        
        <div className="relative z-10 text-sm font-medium opacity-70">
          © {new Date().getFullYear()} Morshop. Todos los derechos reservados.
        </div>
      </div>

      {/* RIGHT PANEL (Form) */}
      <div className="w-full lg:w-[60%] flex flex-col justify-center items-center p-6 md:p-12 relative">
        <Link to="/" className="lg:hidden absolute top-6 left-6">
          <img src="/logo-completo-2.png" alt="Morshop" className="h-[28px] w-auto" />
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-[400px] mt-12 lg:mt-0"
        >
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-[var(--text-1)] tracking-tight mb-2">
              {isLogin ? 'Iniciá sesión' : 'Creá tu cuenta'}
            </h2>
            <p className="text-[var(--text-2)] font-medium">
              {isLogin ? 'Bienvenido de nuevo a tu negocio.' : 'Empezá a vender online gratis hoy mismo.'}
            </p>
          </div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-xl mb-6 text-sm font-medium flex items-start gap-2"
            >
              <div className="mt-0.5">⚠️</div>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-[var(--text-1)] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 h-[48px] rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-1)] placeholder-[var(--text-3)] focus:bg-white focus:ring-0 focus:border-[var(--brand)] outline-none transition-all duration-150"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--text-1)] mb-1.5">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 h-[48px] rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-1)] placeholder-[var(--text-3)] focus:bg-white focus:ring-0 focus:border-[var(--brand)] outline-none transition-all duration-150 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#888',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--brand)] text-white font-bold h-[48px] rounded-[10px] hover:bg-[var(--brand-dark)] transition-colors duration-150 disabled:opacity-50 mt-2 shadow-[var(--shadow-sm)] hover:shadow-md"
            >
              {loading ? 'Cargando...' : isLogin ? 'Ingresar a mi tienda' : 'Registrarme gratis'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-[var(--text-2)]">
            {isLogin ? '¿No tenés cuenta? ' : '¿Ya tenés cuenta? '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-[var(--brand)] font-bold hover:underline transition-all"
            >
              {isLogin ? 'Registrate gratis' : 'Iniciá sesión'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
