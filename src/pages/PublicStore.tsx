import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { X, ImageIcon, ShoppingCart, Minus, Plus, Trash2, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { getContrastColor } from '../utils/color';

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [matches, query]);
  return matches;
}

function AutoplayBanner({ count, activeIndex, setActiveIndex }: { count: number; activeIndex: number; setActiveIndex: (i: number) => void; }) {
  const indexRef = useRef(activeIndex);
  useEffect(() => { indexRef.current = activeIndex; }, [activeIndex]);

  useEffect(() => {
    if (count <= 1) return;
    const interval = setInterval(() => {
      const next = (indexRef.current + 1) % count;
      setActiveIndex(next);
    }, 4000);
    return () => clearInterval(interval);
  }, [count, setActiveIndex]);
  return null;
}

export default function PublicStore() {
  const { slug } = useParams();
  const [store, setStore] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const [addedMessageId, setAddedMessageId] = useState<string | null>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const bannerScrollRef = useRef<HTMLDivElement>(null);

  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState({ name: '', payment_method: '', address: '', note: '' });
  
  const isDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    async function fetchStore() {
      if (!slug) return;
      
      const { data: storeData } = await supabase.from('stores').select('*').eq('slug', slug).eq('is_published', true).single();

      if (storeData) {
        setStore(storeData);
        if (storeData.font_family && storeData.font_family !== 'Inter') {
          const link = document.createElement('link');
          link.href = `https://fonts.googleapis.com/css2?family=${storeData.font_family.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
        
        const savedCart = localStorage.getItem(`morshop_cart_${slug}`);
        if (savedCart) { try { setCart(JSON.parse(savedCart)); } catch (e) {} }
        
        const { data: categoriesData } = await supabase.from('store_categories').select('*').eq('store_id', storeData.id).order('name', { ascending: true });
        setCategories(categoriesData || []);
        
        const { data: productsData } = await supabase.from('products').select('*').eq('store_id', storeData.id).order('display_order', { ascending: true }).order('created_at', { ascending: false });
        setAllProducts(productsData || []);
      }
      setLoading(false);
    }
    fetchStore();
  }, [slug]);

  useEffect(() => {
    if (store && cart.length >= 0) localStorage.setItem(`morshop_cart_${store.slug}`, JSON.stringify(cart));
  }, [cart, store]);

  useEffect(() => {
    if (store) {
      document.documentElement.style.setProperty('--store-primary', store.primary_color || '#1136EE');
      document.documentElement.style.setProperty('--store-secondary', store.secondary_color || '#ffffff');
    }
    return () => {
      document.documentElement.style.removeProperty('--store-primary');
      document.documentElement.style.removeProperty('--store-secondary');
    };
  }, [store]);

  useEffect(() => { 
    if (selectedProduct) {
      setModalQuantity(1);
      setActiveImage(selectedProduct.image_url);
    } 
  }, [selectedProduct]);

  useEffect(() => {
    if (store?.id) {
      supabase.from('store_views').insert({ store_id: store.id }).then(() => {});
    }
  }, [store?.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-sans">Cargando tienda...</div>;
  if (!store) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-4 font-sans">
      <h1 className="text-2xl font-bold mb-2">Tienda no encontrada</h1>
      <p className="text-neutral-600">La tienda no existe o no está publicada.</p>
    </div>
  );

  const handleWhatsAppProduct = (product: any, qty: number) => {
    if (!store.whatsapp_number || !product.available) return;
    
    supabase.from('stores').update({ whatsapp_clicks: (store.whatsapp_clicks || 0) + 1 }).eq('id', store.id).then(() => {});

    const template = store.whatsapp_message_template || 'Hola! Me interesa: {{producto}} - ${{precio}}';
    const mensaje = template.replace('{{producto}}', product.name).replace('{{precio}}', product.price);
    const mensajeFinal = `${mensaje}\nCantidad: ${qty}`;
    window.open(`https://wa.me/${store.whatsapp_number}?text=${encodeURIComponent(mensajeFinal)}`, '_blank');
  };

  const handleWhatsAppCart = () => {
    if (!store.whatsapp_number || cart.length === 0) return;
    
    if (store.plan === 'plus' && store.order_form_enabled) {
      setShowOrderForm(true);
      return;
    }
    
    supabase.from('stores').update({ whatsapp_clicks: (store.whatsapp_clicks || 0) + 1 }).eq('id', store.id).then(() => {});

    const items = cart.map(i => `• ${i.name} x${i.quantity} — $${i.price * i.quantity}`).join('\n');
    const total = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const mensaje = `Hola! Te hago el siguiente pedido:\n\n${items}\n\nTotal: $${total}`;
    window.open(`https://wa.me/${store.whatsapp_number}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const handleSubmitOrderForm = () => {
    supabase.from('stores').update({ whatsapp_clicks: (store.whatsapp_clicks || 0) + 1 }).eq('id', store.id).then(() => {});

    const productsList = cart.map(item =>
      `• ${item.name} x${item.quantity} — $${(item.price * item.quantity).toLocaleString('es-AR')}`
    ).join('\n');

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const message = `
🛍️ *Nuevo pedido desde Morshop*

*Productos:*
${productsList}

💰 *Total: $${total.toLocaleString('es-AR')}*

━━━━━━━━━━━━━━
👤 *Cliente:* ${orderForm.name}
💳 *Método de pago:* ${orderForm.payment_method}
${orderForm.address ? `📍 *Dirección:* ${orderForm.address}` : '🏪 *Retira en persona*'}
${orderForm.note ? `📝 *Nota:* ${orderForm.note}` : ''}
━━━━━━━━━━━━━━
    `.trim();

    const whatsappUrl = `https://wa.me/${store.whatsapp_number}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    setShowOrderForm(false);
    setIsCartOpen(false);
  };

  const addToCart = (product: any, quantity: number = 1, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!product.available) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      return [...prev, { ...product, quantity }];
    });
    if (!selectedProduct) {
      setAddedMessageId(product.id);
      setTimeout(() => setAddedMessageId(null), 1500); // feedback anim
    } else {
      setSelectedProduct(null);
    }
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };
  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const storeTheme = { fontFamily: store.font_family ? `"${store.font_family}", sans-serif` : 'Inter, sans-serif' } as React.CSSProperties;

  const displayedProducts = activeCategoryId 
    ? allProducts.filter(p => p.category_id === activeCategoryId && !p.is_featured)
    : allProducts.filter(p => !p.is_featured);
  const featuredProducts = allProducts.filter(p => p.is_featured);

  let paymentMethods: string[] = [];
  try { if (store.payment_methods) paymentMethods = typeof store.payment_methods === 'string' ? JSON.parse(store.payment_methods) : store.payment_methods; } catch (e) {}

  let bannerUrls: string[] = [];
  if (store.banner_urls) { bannerUrls = Array.isArray(store.banner_urls) ? store.banner_urls : []; }
  else if (store.banner_url) {
    try { const parsed = JSON.parse(store.banner_url); bannerUrls = Array.isArray(parsed) ? parsed.filter(Boolean) : [store.banner_url]; } catch { bannerUrls = [store.banner_url]; }
  }
  
  const primaryColor = store.primary_color || '#1136EE';
  const contrastColor = getContrastColor(primaryColor);

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } }
  };

  const ProductCard = ({ product }: { product: any }) => {
    const isAdded = addedMessageId === product.id;
    return (
      <motion.div 
        whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
        transition={{ duration: 0.18 }}
        onClick={() => setSelectedProduct(product)}
        className="bg-white rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-200 cursor-pointer flex flex-col h-full overflow-hidden"
      >
        <div className="w-full aspect-square bg-neutral-100 relative shrink-0 overflow-hidden">
          {product.original_price && (
            <div className="absolute top-2 left-2 z-10 bg-black text-white text-[10px] font-bold tracking-wider px-2 py-1 uppercase">
              OFERTA
            </div>
          )}
          {product.is_featured && (
            <div className="absolute top-2 right-2 z-10 bg-[#D4A017] text-[#1a1a1a] text-[10px] font-bold tracking-wider px-2 py-1 uppercase">
              DESTACADO
            </div>
          )}
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="absolute inset-0 w-full h-full" style={{ objectFit: product.image_fit || 'cover', objectPosition: 'center', background: '#f5f5f5' }} />
          ) : (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center text-neutral-300"><ImageIcon size={24} /></div>
          )}
        </div>
        
        <div className="p-[10px] flex flex-col flex-1">
          <h3 className="text-[13px] font-bold text-[var(--text-1)] mb-1 line-clamp-2 leading-snug">{product.name}</h3>
          <div className="mt-auto flex flex-col pt-1">
            {product.original_price && <div className="text-[11px] text-neutral-400 line-through mb-0.5">${product.original_price}</div>}
            <div className="text-[16px] font-bold leading-none" style={{ color: 'var(--store-primary)' }}>${product.price}</div>
          </div>
        </div>

        <div className="mt-2 shrink-0">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={(e) => addToCart(product, 1, e)}
            disabled={!product.available}
            className="w-full h-[38px] text-[12px] font-bold flex items-center justify-center rounded-none"
            style={{ 
              backgroundColor: product.available ? (isAdded ? '#137333' : primaryColor) : '#f5f5f5',
              color: product.available ? (isAdded ? '#ffffff' : contrastColor) : '#a3a3a3',
              border: 'none',
              cursor: product.available ? 'pointer' : 'not-allowed'
            }}
          >
            {product.available ? (isAdded ? '✓ Agregado' : 'Agregar al carrito') : 'Sin stock'}
          </motion.button>
        </div>
      </motion.div>
    );
  };

  const announcements = store ? [
    store.announcement_1,
    store.announcement_2,
    store.announcement_3,
  ].filter(Boolean) : [];

  return (
    <div style={storeTheme} className="min-h-screen flex flex-col bg-white">
      
      {/* 1. Announcement Bar con Animación Loop */}
      {announcements.length > 0 && (
        <div style={{ overflow: 'hidden', background: primaryColor, padding: '8px 0', width: '100%' }}>
          <motion.div
            style={{ display: 'flex', whiteSpace: 'nowrap', width: 'fit-content' }}
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            {/* Repetir 8 veces para loop infinito sin espacios */}
            {Array(8).fill(null).map((_, i) => (
              announcements.map((text, j) => (
                <span
                  key={`${i}-${j}`}
                  style={{
                    color: contrastColor,
                    marginRight: '60px',
                    fontSize: '13px',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  ✦ {text}
                </span>
              ))
            ))}
          </motion.div>
        </div>
      )}

      {/* 2. Header (64px) */}
      <header className="sticky top-0 z-40 shadow-[0_2px_8px_rgba(0,0,0,0.06)]" style={{ height: '64px', backgroundColor: 'var(--store-secondary)' }}>
        <div className="h-full px-4 md:px-8 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center min-w-0">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="h-[44px] w-auto object-contain mr-3 shrink-0" />
            ) : (
              <div className="h-[40px] w-[40px] shrink-0 rounded-full flex items-center justify-center font-bold text-lg mr-3" style={{ backgroundColor: primaryColor, color: contrastColor }}>
                {store.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="font-bold truncate text-[16px] md:text-[18px] text-[var(--text-1)] m-0 leading-tight">{store.name}</h1>
              {store.description && (
                <p className="text-[13px] text-neutral-500 m-0 italic mt-0.5 truncate">{store.description}</p>
              )}
            </div>
          </div>
          <button onClick={() => setIsCartOpen(true)} className="relative p-2 shrink-0 ml-2 text-[var(--text-1)]">
            <ShoppingCart size={24} />
            {cartCount > 0 && (
              <motion.div 
                key={cartCount}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="absolute top-0 right-0 w-[20px] h-[20px] rounded-full flex items-center justify-center text-[11px] font-bold shadow-sm" 
                style={{ backgroundColor: primaryColor, color: contrastColor }}
              >
                {cartCount}
              </motion.div>
            )}
          </button>
        </div>
      </header>

      {/* Payment Methods */}
      {paymentMethods.length > 0 && (
        <div className="w-full bg-white py-3 overflow-x-auto no-scrollbar border-b border-[#f0f0f0]">
          <div className="payment-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', flexWrap: 'nowrap', minWidth: 'max-content', maxWidth: '80rem', margin: '0 auto' }}>
            <span className="payment-label" style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>💳 Aceptamos:</span>
            {paymentMethods.map(pm => (
              <span key={pm} className="payment-chip" style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', border: `1.5px solid ${primaryColor}`, color: primaryColor, background: 'transparent', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {pm}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3. Banners */}
      {bannerUrls.length > 0 && (
        <div className="relative w-full overflow-hidden bg-neutral-100 h-[180px] md:h-[260px]">
          <div ref={bannerScrollRef} className="flex w-full h-full overflow-x-auto no-scrollbar" style={{ scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }} onScroll={(e) => setActiveBannerIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.offsetWidth))}>
            {bannerUrls.map((url, i) => (
              <div key={i} className="w-full h-full shrink-0" style={{ scrollSnapAlign: 'start' }}>
                <img src={url} alt={`Banner ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          {bannerUrls.length > 1 && (
            <>
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-10">
                {bannerUrls.map((_, i) => (
                  <button key={i} onClick={() => { const el = bannerScrollRef.current; if (el) { el.scrollTo({ left: i * el.offsetWidth, behavior: 'smooth' }); setActiveBannerIndex(i); } }} className="rounded-full transition-all h-[6px]" style={{ width: activeBannerIndex === i ? '18px' : '6px', backgroundColor: activeBannerIndex === i ? 'var(--store-primary)' : 'rgba(255,255,255,0.7)' }} />
                ))}
              </div>
              <AutoplayBanner count={bannerUrls.length} activeIndex={activeBannerIndex} setActiveIndex={(i) => { setActiveBannerIndex(i); const el = bannerScrollRef.current; if (el) el.scrollTo({ left: i * el.offsetWidth, behavior: 'smooth' }); }} />
            </>
          )}
        </div>
      )}

      {/* 4. Categorías */}
      {categories.length > 0 && (
        <div className="w-full overflow-x-auto no-scrollbar py-4 bg-white border-b border-[var(--border)]">
          <div className="flex items-center gap-2 px-4 min-w-max max-w-7xl mx-auto">
            <button
              onClick={() => setActiveCategoryId(null)}
              className="px-5 h-[36px] rounded-full text-[14px] font-bold border transition-colors flex items-center justify-center shrink-0"
              style={{ backgroundColor: activeCategoryId === null ? primaryColor : 'transparent', color: activeCategoryId === null ? contrastColor : primaryColor, borderColor: primaryColor }}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className="px-5 h-[36px] rounded-full text-[14px] font-bold border transition-colors flex items-center justify-center shrink-0"
                style={{ backgroundColor: activeCategoryId === cat.id ? primaryColor : 'transparent', color: activeCategoryId === cat.id ? contrastColor : primaryColor, borderColor: primaryColor }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full pb-12">
        {/* Destacados */}
        {featuredProducts.length > 0 && activeCategoryId === null && (
          <div className="mt-8 mb-10 px-4 md:px-6 overflow-hidden">
            <h2 className="text-[18px] font-extrabold text-[var(--text-1)] mb-4">⭐ Destacados</h2>
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex overflow-x-auto no-scrollbar gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0">
              {featuredProducts.map(p => (
                <motion.div key={p.id} variants={cardVariants} className="w-[160px] md:w-[220px] shrink-0">
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

        {/* Grilla principal */}
        <div className="mt-8 px-4 md:px-6">
          {featuredProducts.length > 0 && activeCategoryId === null && <h2 className="text-[18px] font-extrabold text-[var(--text-1)] mb-4">Todos los productos</h2>}
          {displayedProducts.length === 0 ? (
            <div className="text-center py-16 text-[var(--text-2)] font-medium">No hay productos en esta sección.</div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategoryId || 'all'}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[10px] sm:gap-[12px] lg:gap-[16px]"
              >
                {displayedProducts.map(p => (
                  <motion.div key={p.id} variants={cardVariants}>
                    <ProductCard product={p} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Sobre la tienda */}
        {store.about_text && (
          <div className="mt-16 px-4 md:px-6 max-w-3xl mx-auto">
            <button onClick={() => setIsAboutExpanded(!isAboutExpanded)} className="w-full flex items-center justify-between py-5 border-t border-[var(--border)]">
              <h2 className="text-[16px] font-bold">ℹ️ Sobre esta tienda</h2>
              {isAboutExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {isAboutExpanded && <div className="pb-8 text-[14px] text-[var(--text-2)] whitespace-pre-wrap leading-relaxed animate-in fade-in">{store.about_text}</div>}
          </div>
        )}
      </main>

      {/* Redes sociales — solo si el plan es Plus y hay al menos una red configurada */}
      {store.plan === 'plus' && 
       (store.instagram_url || store.tiktok_url || store.facebook_url) && (
        <div style={{
          padding: '24px 16px',
          textAlign: 'center',
          borderTop: '1px solid #f0f0f0',
        }}>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>
            Seguinos en redes
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            
            {store.instagram_url && (
              <a href={store.instagram_url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', borderRadius: '20px',
                  border: '1.5px solid #e5e7eb', color: '#1a1a1a',
                  textDecoration: 'none', fontSize: '14px', fontWeight: 500,
                }}
              >
                📸 Instagram
              </a>
            )}

            {store.tiktok_url && (
              <a href={store.tiktok_url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', borderRadius: '20px',
                  border: '1.5px solid #e5e7eb', color: '#1a1a1a',
                  textDecoration: 'none', fontSize: '14px', fontWeight: 500,
                }}
              >
                🎵 TikTok
              </a>
            )}

            {store.facebook_url && (
              <a href={store.facebook_url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', borderRadius: '20px',
                  border: '1.5px solid #e5e7eb', color: '#1a1a1a',
                  textDecoration: 'none', fontSize: '14px', fontWeight: 500,
                }}
              >
                👥 Facebook
              </a>
            )}

          </div>
        </div>
      )}

      {/* Footer Público */}
      <footer className="bg-[#F8FAFC] py-8 text-center mt-auto border-t border-[var(--border)]">
        <p className="font-bold text-[14px] text-[var(--text-1)] mb-1">{store.name}</p>
        {store.plan !== 'plus' && (
          <p className="text-[12px] text-[var(--text-3)] font-medium">Creá tu tienda gratis en <a href="https://morshop.vercel.app" className="underline text-[var(--brand)] hover:text-[var(--brand-dark)]">morshop.com</a></p>
        )}
      </footer>

      {/* Modal de Producto (REDISEÑADO + SCROLLABLE + ANIMADO) */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            className="modal-container"
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: isDesktop ? 'center' : 'flex-end', justifyContent: 'center', zIndex: 1000
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div 
              className="modal-box"
              style={{
                background: 'white', width: '100%', maxWidth: '480px', maxHeight: '90vh',
                borderRadius: isDesktop ? '16px' : '20px 20px 0 0',
                display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative'
              }}
              initial={isDesktop ? { scale: 0.95, opacity: 0 } : { y: '100%' }}
              animate={isDesktop ? { scale: 1, opacity: 1 } : { y: 0 }}
              exit={isDesktop ? { scale: 0.95, opacity: 0 } : { y: '100%' }}
              transition={isDesktop ? { duration: 0.18 } : { type: 'spring', damping: 28, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-20 w-[40px] h-[40px] bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-md text-black hover:bg-white"><X size={20} /></button>
              
              {/* Imagen (Fija arriba) */}
              <div className="modal-image" style={{ height: '280px', flexShrink: 0, background: '#f5f5f5', overflow: 'hidden' }}>
                {activeImage ? (
                  <img src={activeImage} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: selectedProduct.image_fit || 'cover', objectPosition: 'center', background: '#f5f5f5' }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-300"><ImageIcon size={48} /></div>
                )}
              </div>

              {/* Miniaturas si hay 2 imágenes */}
              {selectedProduct.image_url_2 && (
                <div style={{ display: 'flex', gap: '8px', padding: '8px 16px' }}>
                  <img
                    src={selectedProduct.image_url}
                    onClick={() => setActiveImage(selectedProduct.image_url)}
                    style={{
                      width: '56px', height: '56px', objectFit: selectedProduct.image_fit || 'cover', borderRadius: '8px',
                      border: activeImage === selectedProduct.image_url ? `2px solid ${primaryColor}` : '2px solid #e5e7eb',
                      cursor: 'pointer', background: '#f5f5f5'
                    }}
                  />
                  <img
                    src={selectedProduct.image_url_2}
                    onClick={() => setActiveImage(selectedProduct.image_url_2)}
                    style={{
                      width: '56px', height: '56px', objectFit: selectedProduct.image_fit || 'cover', borderRadius: '8px',
                      border: activeImage === selectedProduct.image_url_2 ? `2px solid ${primaryColor}` : '2px solid #e5e7eb',
                      cursor: 'pointer', background: '#f5f5f5'
                    }}
                  />
                </div>
              )}

              {/* Contenido scrolleable */}
              <div className="modal-content" style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>{selectedProduct.name}</h2>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '26px', fontWeight: 700, color: primaryColor }}>${selectedProduct.price}</span>
                  {selectedProduct.original_price && <span style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'line-through' }}>${selectedProduct.original_price}</span>}
                </div>

                <span style={{
                  display: 'inline-block', alignSelf: 'flex-start',
                  padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700,
                  background: selectedProduct.available ? '#ecfdf5' : '#fef2f2',
                  color: selectedProduct.available ? '#059669' : '#dc2626'
                }}>
                  {selectedProduct.available ? '● Stock disponible' : '✕ Sin stock'}
                </span>

                {selectedProduct.description && (
                  <div className="modal-description" style={{ marginTop: '8px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', marginBottom: '8px', letterSpacing: '0.05em' }}>DESCRIPCIÓN</p>
                    <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{selectedProduct.description}</p>
                  </div>
                )}

                {/* Botones — pegados al final dentro del scroll para evitar bugs de height */}
                <div className="modal-actions" style={{ marginTop: 'auto', paddingTop: '24px' }}>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', height: '50px', width: '120px', flexShrink: 0 }}>
                      <button onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}><Minus size={18} /></button>
                      <div style={{ fontWeight: 700, fontSize: '16px', width: '30px', textAlign: 'center' }}>{modalQuantity}</div>
                      <button onClick={() => setModalQuantity(modalQuantity + 1)} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}><Plus size={18} /></button>
                    </div>
                    <motion.button 
                      whileTap={{ scale: 0.96 }}
                      onClick={(e) => addToCart(selectedProduct, modalQuantity, e)}
                      disabled={!selectedProduct.available}
                      style={{ 
                        flex: 1, height: '50px', borderRadius: '12px', fontWeight: 700, fontSize: '15px', border: 'none',
                        backgroundColor: selectedProduct.available ? primaryColor : '#f5f5f5',
                        color: selectedProduct.available ? contrastColor : '#a3a3a3',
                        opacity: selectedProduct.available ? 1 : 0.5,
                        cursor: selectedProduct.available ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      Agregar al carrito
                    </motion.button>
                  </div>
                  <motion.button 
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleWhatsAppProduct(selectedProduct, modalQuantity)}
                    disabled={!selectedProduct.available}
                    style={{
                      width: '100%', height: '50px', borderRadius: '12px', fontWeight: 700, fontSize: '15px', border: 'none',
                      backgroundColor: '#25D366', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      opacity: selectedProduct.available ? 1 : 0.5,
                      cursor: selectedProduct.available ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <MessageCircle size={20} />
                    Consultar por WhatsApp
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 animate-in fade-in" onClick={() => setIsCartOpen(false)}>
          <div className="bg-white w-full md:w-[400px] h-[100vh] flex flex-col animate-in slide-in-from-right" onClick={e => e.stopPropagation()}>
            <div className="h-[72px] border-b border-[var(--border)] flex items-center justify-between px-6 shrink-0">
              <h2 className="font-extrabold text-[18px]">Tu pedido</h2>
              <button onClick={() => setIsCartOpen(false)} className="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-[var(--surface-1)]"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[var(--text-3)]">
                  <ShoppingCart size={48} className="mb-4 opacity-50" />
                  <p className="font-bold text-[16px]">Tu carrito está vacío</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-[72px] h-[72px] rounded-xl bg-neutral-100 overflow-hidden shrink-0">
                        {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={24} /></div>}
                      </div>
                      <div className="flex-1 flex flex-col">
                        <h4 className="font-bold text-[14px] leading-snug mb-1">{item.name}</h4>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="font-bold text-[16px]" style={{ color: primaryColor }}>${item.price}</span>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center bg-[var(--surface-1)] rounded-lg h-[32px] border border-[var(--border)]">
                              <button onClick={() => updateCartQuantity(item.id, -1)} className="w-8 h-full flex items-center justify-center font-bold">-</button>
                              <span className="text-[13px] font-bold w-4 text-center">{item.quantity}</span>
                              <button onClick={() => updateCartQuantity(item.id, 1)} className="w-8 h-full flex items-center justify-center font-bold">+</button>
                            </div>
                            <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-600"><Trash2 size={18} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-6 border-t border-[var(--border)] shadow-[0_-8px_20px_rgba(0,0,0,0.04)]">
                <div className="flex justify-between items-end mb-4">
                  <span className="font-bold text-[var(--text-2)]">Total</span>
                  <span className="font-extrabold text-[24px]">${cartTotal}</span>
                </div>
                <button onClick={handleWhatsAppCart} className="w-full h-[56px] rounded-xl font-bold text-white text-[16px] flex items-center justify-center gap-2 mb-3" style={{ backgroundColor: '#25D366' }}>
                  <MessageCircle size={22} /> Enviar pedido por WhatsApp
                </button>
                <button onClick={() => setIsCartOpen(false)} className="w-full py-2 font-bold text-[14px]" style={{ color: primaryColor }}>Seguir comprando</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Formulario de pedido (Plus) */}
      <AnimatePresence>
        {showOrderForm && (
          <motion.div
            className="order-form-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="order-form-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            >
              <div className="order-form-header">
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1a1a1a' }}>Completá tu pedido</h3>
                <button onClick={() => setShowOrderForm(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}>✕</button>
              </div>

              <div className="order-form-body">
                {/* Campo: Nombre */}
                <div className="form-field">
                  <label>Tu nombre *</label>
                  <input
                    type="text"
                    placeholder="Ej: María García"
                    value={orderForm.name}
                    onChange={e => setOrderForm({...orderForm, name: e.target.value})}
                  />
                </div>

                {/* Campo: Método de pago */}
                <div className="form-field">
                  <label>¿Cómo vas a abonar? *</label>
                  <div className="payment-options">
                    {paymentMethods.map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setOrderForm({...orderForm, payment_method: method})}
                        className={`payment-option-btn ${orderForm.payment_method === method ? 'selected' : ''}`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Campo: Dirección de entrega */}
                <div className="form-field">
                  <label>¿Dónde querés recibirlo?</label>
                  <input
                    type="text"
                    placeholder="Ej: Av. Corrientes 1234, CABA"
                    value={orderForm.address}
                    onChange={e => setOrderForm({...orderForm, address: e.target.value})}
                  />
                  <p style={{ fontSize: '12px', color: '#888', marginTop: '4px', margin: 0 }}>
                    Opcional — dejalo vacío si retirás vos
                  </p>
                </div>

                {/* Campo: Nota adicional */}
                <div className="form-field">
                  <label>¿Algo más que quieras aclarar?</label>
                  <textarea
                    placeholder="Ej: talle, color, horario de entrega..."
                    value={orderForm.note}
                    onChange={e => setOrderForm({...orderForm, note: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>

              {/* Botón de enviar */}
              <div className="order-form-footer">
                <button
                  className="whatsapp-submit-btn"
                  disabled={!orderForm.name || !orderForm.payment_method}
                  onClick={handleSubmitOrderForm}
                >
                  <span>💬</span> Enviar pedido por WhatsApp
                </button>
                {(!orderForm.name || !orderForm.payment_method) && (
                  <p style={{ fontSize: '12px', color: '#e53e3e', textAlign: 'center', marginTop: '6px', marginBottom: 0, fontWeight: 500 }}>
                    Completá tu nombre y método de pago para continuar
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
