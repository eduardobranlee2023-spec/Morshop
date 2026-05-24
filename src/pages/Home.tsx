import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MessageCircle, Paintbrush, Smartphone, ShoppingCart, LayoutGrid, Check, X } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } }
};

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--surface-0)] font-sans selection:bg-[var(--brand-light)] selection:text-[var(--brand-dark)]">
      
      {/* 1A - NAVBAR */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent ${
          scrolled ? 'bg-white/90 backdrop-blur-md border-[var(--border)] shadow-sm py-3' : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
          <Link to="/">
            <img src="/logo-completo-2.png" alt="Morshop" className="h-[32px] w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-2 md:gap-6">
            <Link to="/login" className="hidden md:block font-medium text-[var(--text-2)] hover:text-[var(--brand)] transition-colors">
              Iniciar Sesión
            </Link>
            <Link to="/login" className="bg-[var(--brand)] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[var(--brand-dark)] hover:shadow-md transition-all active:scale-95 text-sm md:text-base flex items-center gap-2">
              Crear tienda gratis <ArrowRight size={16} className="hidden md:inline-block" />
            </Link>
          </div>
        </div>
      </nav>

      {/* 1B - HERO SECTION */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32 px-4 overflow-hidden relative" style={{ background: 'linear-gradient(135deg, var(--brand-light) 0%, #FFFFFF 50%, #F0FDF4 100%)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-8">
          
          <div className="flex-1 text-center md:text-left z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 bg-[var(--brand-light)] border border-[var(--brand)]/20 text-[var(--brand)] px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
            >
              <span className="text-[16px]">✦</span> La tienda online para emprendedores argentinos
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-[40px] md:text-[72px] font-extrabold leading-[1.1] text-[var(--text-1)] tracking-tight mb-6"
            >
              Tu tienda online,<br className="hidden md:block"/> completamente <span className="text-[var(--brand)]">gratis</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-[var(--text-2)] max-w-[560px] mx-auto md:mx-0 mb-10 leading-relaxed"
            >
              Mostrá tus productos con tu propia identidad y cerrá ventas por WhatsApp. Sin comisiones. Sin mensualidades en dólares.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start"
            >
              <Link to="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[var(--brand)] text-white px-8 h-[52px] rounded-xl font-bold text-[16px] hover:scale-[1.02] hover:shadow-[var(--shadow-md)] transition-all active:scale-[0.98]">
                Crear mi tienda gratis <ArrowRight size={20} />
              </Link>
              <a href="#demo" className="w-full sm:w-auto flex items-center justify-center h-[52px] px-8 rounded-xl font-bold text-[16px] border border-[var(--border-strong)] text-[var(--text-1)] hover:bg-[var(--surface-1)] transition-colors">
                Ver ejemplo de tienda
              </a>
            </motion.div>
          </div>

          <div className="flex-1 w-full max-w-[400px] md:max-w-none relative z-10 flex justify-center md:justify-end">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative w-full max-w-[340px] aspect-[1/2] rounded-[40px] border-[8px] border-[var(--text-1)] bg-white overflow-hidden shadow-[var(--shadow-lg)] animate-[float_4s_ease-in-out_infinite]"
            >
              {/* Fake UI Header */}
              <div className="h-[60px] bg-[var(--brand)] flex items-center justify-center text-white font-bold text-lg rounded-t-[32px]">
                Mi Marca
              </div>
              
              <div className="p-4 space-y-4 h-full relative">
                {/* Product Card */}
                <div className="bg-white rounded-xl shadow-sm border border-[var(--border)] overflow-hidden">
                  <div className="h-40 bg-[var(--surface-inset)] animate-pulse" />
                  <div className="p-4">
                    <div className="h-4 w-3/4 bg-[var(--surface-inset)] rounded mb-2" />
                    <div className="h-6 w-1/2 bg-[var(--brand-light)] rounded mb-4" />
                    
                    {/* Animated Buy Button Sequence */}
                    <div className="h-10 bg-[var(--whatsapp)] rounded-lg relative overflow-hidden flex items-center justify-center text-white font-medium text-sm">
                      Consultar por WhatsApp
                      
                      {/* Animated Cursor */}
                      <motion.div 
                        animate={{ x: [40, 0, 0, 40], y: [40, 0, 0, 40], opacity: [0, 1, 1, 0], scale: [1, 1, 0.9, 1] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        className="absolute right-4 bottom-2 z-20 pointer-events-none"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5.5 3.21V20.8C5.5 21.45 6.27 21.79 6.75 21.36L11.44 17.14C11.66 16.94 11.95 16.83 12.25 16.83H18.5C19.33 16.83 20 16.16 20 15.33V4.5C20 3.67 19.33 3 18.5 3H7C6.17 3 5.5 3.1 5.5 3.21Z" fill="#171717"/>
                          <path d="M5.5 3.21V20.8C5.5 21.45 6.27 21.79 6.75 21.36L11.44 17.14C11.66 16.94 11.95 16.83 12.25 16.83H18.5C19.33 16.83 20 16.16 20 15.33V4.5C20 3.67 19.33 3 18.5 3H7C6.17 3 5.5 3.1 5.5 3.21Z" stroke="white" strokeWidth="2"/>
                        </svg>
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Animated WhatsApp Bubble */}
                <motion.div 
                  animate={{ opacity: [0, 0, 1, 1, 0], y: [20, 20, 0, 0, -10] }}
                  transition={{ repeat: Infinity, duration: 4, times: [0, 0.4, 0.5, 0.9, 1] }}
                  className="absolute bottom-8 right-2 left-8 bg-[#DCF8C6] p-3 rounded-2xl rounded-br-sm shadow-md text-sm text-[var(--text-1)] z-10"
                >
                  ¡Hola! Me interesa: <strong>Remera XL - $15.000</strong>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 1C - STATS BAR */}
      <section className="bg-[var(--surface-1)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 text-sm font-medium text-[var(--text-2)] text-center">
          <div className="flex items-center gap-2"><span>🏪</span> +1.000 tiendas creadas</div>
          <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-[var(--border-strong)]" />
          <div className="flex items-center gap-2"><span>💬</span> Optimizada para WhatsApp</div>
          <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-[var(--border-strong)]" />
          <div className="flex items-center gap-2"><span>✅</span> 100% gratis para siempre</div>
        </div>
      </section>

      {/* 1D - EL PROBLEMA QUE RESOLVEMOS */}
      <section className="py-24 px-4 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-[42px] font-extrabold text-[var(--text-1)] mb-4 tracking-tight">¿Cansado de vender por foto de WhatsApp?</h2>
            <p className="text-lg text-[var(--text-2)] max-w-2xl mx-auto">Tus clientes te preguntan lo mismo una y otra vez. Con Morshop, ven todo en tu tienda y te escriben directo con el pedido listo.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-red-50 border border-red-100 rounded-3xl p-8 shadow-sm"
            >
              <div className="flex items-center gap-3 text-red-600 font-bold text-xl mb-6">
                <X className="bg-red-100 p-1 rounded-full" size={28} /> Sin Morshop
              </div>
              <ul className="space-y-4 text-red-900/80 font-medium">
                <li className="flex items-start gap-3"><span>❌</span> "¿Sigue disponible? ¿Cuánto sale?" x50 por día</li>
                <li className="flex items-start gap-3"><span>❌</span> Mandás fotos sueltas sin descripción ni orden</li>
                <li className="flex items-start gap-3"><span>❌</span> Catálogo desactualizado constantemente</li>
                <li className="flex items-start gap-3"><span>❌</span> Perdés ventas por tardar en responder</li>
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 shadow-sm relative overflow-hidden"
            >
              <div className="flex items-center gap-3 text-emerald-700 font-bold text-xl mb-6 relative z-10">
                <Check className="bg-emerald-200 p-1 rounded-full" size={28} /> Con Morshop
              </div>
              <ul className="space-y-4 text-emerald-900/80 font-medium relative z-10">
                <li className="flex items-start gap-3"><span>✅</span> Tu catálogo ordenado y siempre actualizado</li>
                <li className="flex items-start gap-3"><span>✅</span> Tus clientes ven fotos, precios y detalles</li>
                <li className="flex items-start gap-3"><span>✅</span> Te escriben con el producto exacto ya elegido</li>
                <li className="flex items-start gap-3"><span>✅</span> Vendes bajo TU propia identidad visual</li>
              </ul>
              
              {/* Decoración */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[var(--green)] opacity-5 blur-3xl rounded-full" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* 1E - CÓMO FUNCIONA */}
      <section className="py-24 px-4 bg-[var(--surface-1)] border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-[42px] font-extrabold text-[var(--text-1)] tracking-tight">Tu tienda lista en 10 minutos</h2>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto relative"
          >
            {/* Línea conectora desktop */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-[var(--brand-light)] via-[var(--border-strong)] to-[var(--brand-light)] z-0" />

            {[
              { num: '01', title: 'Creá tu cuenta', desc: 'Registrate gratis con tu email. Sin tarjeta, sin compromisos ni costos ocultos.' },
              { num: '02', title: 'Personalizá y subí', desc: 'Poné tu logo, tus colores y tu catálogo de productos con fotos y precios.' },
              { num: '03', title: 'Compartí y vendé', desc: 'Tu tienda tiene un link propio. Compartilo y recibí pedidos directo a tu WhatsApp.' }
            ].map((step, idx) => (
              <motion.div key={idx} variants={fadeInUp} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand)] text-3xl font-black mb-6 shadow-sm border border-[var(--brand)]/10">
                  {step.num}
                </div>
                <h3 className="text-2xl font-bold text-[var(--text-1)] mb-3">{step.title}</h3>
                <p className="text-[var(--text-2)] leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 1F - FEATURES */}
      <section className="py-24 px-4 bg-white border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-[42px] font-extrabold text-[var(--text-1)] tracking-tight">Todo lo que necesitás para vender online</h2>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid sm:grid-cols-2 md:grid-cols-3 gap-6"
          >
            {[
              { icon: Paintbrush, title: 'Tu identidad visual', desc: 'Tus colores, tu logo, tu tipografía. No el amarillo de otros marketplaces.' },
              { icon: Smartphone, title: 'Hecha para el celular', desc: 'Tus clientes compran desde el celu. Tu tienda se ve perfecta y rápida en cualquier pantalla.' },
              { icon: MessageCircle, title: 'Ventas por WhatsApp', desc: 'Te escriben con el producto y precio listos. Sin preguntas repetidas.' },
              { icon: ShoppingCart, title: 'Carrito virtual', desc: 'Tus clientes pueden armar su pedido completo y enviártelo en un solo mensaje.' },
              { icon: LayoutGrid, title: 'Catálogo organizado', desc: 'Categorías, precios, fotos y descripciones. Todo ordenado como una tienda real.' },
              { icon: Check, title: 'Gratis para siempre', desc: 'Podés tener tu tienda sin pagar nada. Cero comisiones por venta, todo tuyo.' }
            ].map((feat, idx) => (
              <motion.div 
                key={idx}
                variants={fadeInUp}
                whileHover={{ scale: 1.02, y: -4 }}
                className="p-8 rounded-3xl bg-[var(--surface-0)] border border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center mb-6">
                  <feat.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-1)] mb-3">{feat.title}</h3>
                <p className="text-[var(--text-2)] leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 1G - FINAL CTA */}
      <section className="py-24 px-4 bg-[var(--brand)] text-center relative overflow-hidden">
        {/* Decoraciones de fondo abstracto */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute -top-[50%] -left-[10%] w-[70%] h-[200%] bg-white rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[100%] bg-[var(--brand-dark)] rounded-full blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-[56px] font-extrabold text-white mb-6 tracking-tight leading-[1.1]"
          >
            ¿Seguís vendiendo por foto de WhatsApp?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-[var(--brand-light)] max-w-2xl mx-auto mb-12 opacity-90"
          >
            Creá tu tienda gratis en menos de 10 minutos y empezá a vender como un negocio de verdad.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link 
              to="/login" 
              className="inline-flex items-center justify-center bg-white text-[var(--brand)] px-10 h-[60px] rounded-2xl font-extrabold text-lg transition-transform hover:scale-105 animate-[pulse-cta_3s_infinite]"
            >
              Crear mi tienda gratis →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 1H - FOOTER */}
      <footer className="bg-[#020617] text-white py-16 px-4">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <img src="/logo-completo-2.png" alt="Morshop" className="h-8 mb-4 brightness-0 invert opacity-90" />
          <p className="text-lg font-medium text-slate-300 mb-12">Tu tienda. Tu marca.</p>
          <div className="w-full h-px bg-slate-800 mb-8" />
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} Morshop — Hecho para emprendedores argentinos</p>
        </div>
      </footer>
    </div>
  );
}
