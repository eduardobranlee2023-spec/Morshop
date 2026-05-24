import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Sparkles, Zap, Image, ShoppingBag, LayoutTemplate } from 'lucide-react';

export default function PlusPlan() {
  const mailToLink = "mailto:contacto@morshop.com?subject=Me interesa el Plan Plus&body=Hola! Quería anotarme en la lista de espera para el Plan Plus de Morshop.";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
        <ArrowLeft size={16} className="mr-1.5" />
        Volver al resumen
      </Link>

      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-6">
          <Sparkles size={14} className="mr-1.5" />
          Próximamente
        </div>
        <h1 className="text-4xl font-bold text-neutral-900 mb-4 tracking-tight">
          Llevá tu tienda al <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">siguiente nivel</span>
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Morshop siempre va a tener una versión gratis increíble, pero estamos preparando herramientas avanzadas para los que quieren vender más.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Free Plan */}
        <div className="bg-white border border-neutral-200 rounded-xl p-8 shadow-sm relative">
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Plan Básico</h2>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-3xl font-bold">$0</span>
            <span className="text-neutral-500">/ mes</span>
          </div>
          <p className="text-sm text-neutral-500 mb-6">Lo esencial para empezar a vender hoy mismo.</p>
          
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-sm text-neutral-700">Productos ilimitados</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-sm text-neutral-700">Diseño adaptable a móviles</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-sm text-neutral-700">Recepción de pedidos por WhatsApp</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-sm text-neutral-700">Hosting incluido</span>
            </li>
          </ul>
          
          <div className="mt-8 pt-8 border-t border-neutral-100">
            <button disabled className="w-full h-[44px] rounded-md font-medium text-sm text-neutral-500 bg-neutral-100 cursor-not-allowed">
              Tu plan actual
            </button>
          </div>
        </div>

        {/* Plus Plan */}
        <div className="bg-gradient-to-b from-amber-50 to-white border-2 border-amber-200 rounded-xl p-8 shadow-md relative overflow-hidden transform md:-translate-y-4">
          <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-lg">
            En Desarrollo
          </div>
          
          <h2 className="text-xl font-bold text-amber-900 mb-2 flex items-center gap-2">
            Plan Plus
            <Sparkles size={18} className="text-amber-500" />
          </h2>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-3xl font-bold text-neutral-900">Consultar</span>
          </div>
          <p className="text-sm text-amber-800/80 mb-6">Herramientas profesionales para escalar tus ventas.</p>
          
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <Zap size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <span className="text-sm text-neutral-800 font-medium">Todo lo del Plan Básico</span>
            </li>
            <li className="flex items-start gap-3">
              <LayoutTemplate size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <span className="text-sm text-neutral-800 font-medium">Plantillas de diseño premium exclusivas</span>
            </li>
            <li className="flex items-start gap-3">
              <Image size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <span className="text-sm text-neutral-800 font-medium">Múltiples imágenes por producto (Galería)</span>
            </li>
            <li className="flex items-start gap-3">
              <ShoppingBag size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <span className="text-sm text-neutral-800 font-medium">Variantes de producto (Talles, Colores)</span>
            </li>
          </ul>
          
          <div className="mt-8 pt-8 border-t border-amber-200/50">
            <a 
              href={mailToLink}
              target="_blank"
              rel="noreferrer"
              className="w-full h-[48px] rounded-md font-semibold text-[15px] text-white flex items-center justify-center transition-all hover:opacity-90 hover:shadow-lg shadow-amber-500/20"
              style={{ background: 'linear-gradient(to right, #f59e0b, #f97316)' }}
            >
              Avisame cuando esté disponible
            </a>
            <p className="text-center text-xs text-amber-700/60 mt-3">
              Sin compromiso. Te avisamos por mail para probarlo primero.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
