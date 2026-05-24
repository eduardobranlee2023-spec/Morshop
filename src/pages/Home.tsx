import { Link } from 'react-router-dom';
import { ArrowRight, Store, ShoppingBag, MessageCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-20 px-4 text-center bg-gradient-to-b from-[#eff6ff] to-white flex flex-col items-center">
        <img src="/logo-completo-2.png" alt="Morshop" className="h-[64px] md:h-[80px] w-auto object-contain mb-8" />
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-neutral-900 mb-6">
          Tu tienda online, <span className="text-[#2563eb]">completamente gratis</span>
        </h1>
        <p className="text-xl text-neutral-600 max-w-2xl mx-auto mb-10">
          Morshop es la plataforma ideal para emprendedores argentinos. Creá tu catálogo, mostrá tus productos con tu propia identidad y cerrá ventas por WhatsApp. Sin comisiones, sin costos fijos.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/login" 
            className="inline-flex items-center justify-center gap-2 bg-[#2563eb] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#1d4ed8] transition-colors shadow-lg hover:shadow-xl"
          >
            Crear mi tienda gratis <ArrowRight size={20} />
          </Link>
          <a 
            href="#como-funciona" 
            className="inline-flex items-center justify-center px-8 py-4 rounded-full font-bold text-lg bg-white border-2 border-[#1e293b] text-[#1e293b] hover:bg-neutral-50 transition-colors"
          >
            ¿Cómo funciona?
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="como-funciona" className="py-20 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">La forma más fácil de vender online</h2>
          <p className="text-neutral-600">Olvidate de pagar mensualidades en dólares o perder tu identidad visual.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#dbeafe] text-[#1d4ed8] rounded-2xl flex items-center justify-center mb-6">
              <Store size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-3">1. Creá tu tienda</h3>
            <p className="text-neutral-600">Registrate, elegí el nombre de tu marca, subí tu logo y personalizá los colores.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#dbeafe] text-[#1d4ed8] rounded-2xl flex items-center justify-center mb-6">
              <ShoppingBag size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-3">2. Subí tus productos</h3>
            <p className="text-neutral-600">Armá tu catálogo con fotos, precios y descripciones en minutos.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-[#dbeafe] text-[#1d4ed8] rounded-2xl flex items-center justify-center mb-6">
              <MessageCircle size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-3">3. Vendé por WhatsApp</h3>
            <p className="text-neutral-600">Tus clientes ven tu tienda y te envían su pedido directamente a tu WhatsApp con un solo clic.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
