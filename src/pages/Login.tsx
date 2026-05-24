import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
        });
        if (error) throw error;
        alert('Registro exitoso. Por favor iniciá sesión.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-20 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-neutral-200">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Cargando...' : isLogin ? 'Ingresar' : 'Registrarme'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-neutral-600">
          {isLogin ? '¿No tenés cuenta? ' : '¿Ya tenés cuenta? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 font-medium hover:underline"
          >
            {isLogin ? 'Registrate gratis' : 'Iniciá sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}
