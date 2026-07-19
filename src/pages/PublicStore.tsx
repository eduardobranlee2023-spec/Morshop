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
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  
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

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans", sans-serif', background: '#f6f8ff', flexDirection: 'column', gap: '12px' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #284cff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}></div>
      <p style={{ color: '#53627a', fontSize: '14px', margin: 0 }}>Cargando tienda...</p>
    </div>
  );
  if (!store) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f6f8ff', padding: '16px', fontFamily: '"DM Sans", sans-serif' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏪</div>
      <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '24px', fontWeight: 700, margin: '0 0 8px', color: '#061a40' }}>Tienda no encontrada</h1>
      <p style={{ color: '#53627a', margin: 0 }}>La tienda no existe o no está publicada.</p>
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
    const catName = categories.find(c => c.id === product.category_id)?.name;
    return (
      <motion.div
        whileHover={{ y: -4, boxShadow: '0 18px 40px rgba(11,40,85,0.12)' }}
        transition={{ duration: 0.2 }}
        onClick={() => setSelectedProduct(product)}
        style={{
          cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%',
          background: 'white', border: '1px solid #dbe4f4', borderRadius: '14px',
          overflow: 'hidden', boxShadow: '0 6px 17px rgba(12,42,86,0.04)', position: 'relative'
        }}
      >
        {product.original_price && (
          <div style={{
            position: 'absolute', top: '10px', left: '10px', zIndex: 10,
            background: '#061a40', color: 'white', fontSize: '9px', fontWeight: 700,
            letterSpacing: '0.08em', padding: '4px 9px', borderRadius: '6px', textTransform: 'uppercase'
          }}>OFERTA</div>
        )}
        {product.is_featured && (
          <div style={{
            position: 'absolute', top: '10px', right: '10px', zIndex: 10,
            background: '#e7edff', color: '#284cff', fontSize: '9px', fontWeight: 700,
            letterSpacing: '0.06em', padding: '4px 9px', borderRadius: '6px', textTransform: 'uppercase'
          }}>✦ DEST.</div>
        )}

        <div style={{ height: '160px', flexShrink: 0, background: '#f6f8ff', overflow: 'hidden' }}>
          {product.image_url ? (
            <img src={product.image_url} alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: product.image_fit || 'cover', objectPosition: 'center', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c8d3e8' }}>
              <ImageIcon size={28} />
            </div>
          )}
        </div>

        <div style={{ padding: '12px 13px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          {catName && <span style={{ fontSize: '10px', color: '#68768b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{catName}</span>}
          <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '14px', margin: 0, lineHeight: 1.3, color: '#0e2142', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</p>
          <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
            {product.original_price && <div style={{ fontSize: '11px', color: '#9ca3af', textDecoration: 'line-through', marginBottom: '2px' }}>${product.original_price}</div>}
            <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '16px', color: primaryColor, margin: 0 }}>${product.price}</p>
          </div>
        </div>

        <button
          onClick={(e) => addToCart(product, 1, e)}
          disabled={!product.available}
          style={{
            width: '100%', height: '42px', border: 'none', cursor: product.available ? 'pointer' : 'not-allowed',
            fontFamily: '"DM Sans", sans-serif', fontWeight: 700, fontSize: '13px',
            borderRadius: '0 0 14px 14px',
            transition: 'all 0.2s',
            backgroundColor: !product.available ? '#f1f5f9' : isAdded ? '#26c768' : primaryColor,
            color: !product.available ? '#94a3b8' : '#ffffff',
          }}
        >
          {!product.available ? 'Sin stock' : isAdded ? '✓ Agregado' : 'Agregar al carrito'}
        </button>
      </motion.div>
    );
  };

  const announcements = store ? [
    store.announcement_1,
    store.announcement_2,
    store.announcement_3,
  ].filter(Boolean) : [];

  return (
    <div style={{ ...storeTheme, minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f6f8ff', fontFamily: '"DM Sans", sans-serif' }}>
      
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

      {/* 2. Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40, height: '64px',
        background: store.secondary_color || '#ffffff',
        borderBottom: '1px solid #dbe4f4',
        boxShadow: '0 2px 12px rgba(11,40,85,0.06)'
      }}>
        <div style={{ height: '100%', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, gap: '12px' }}>
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} style={{ height: '40px', width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
            ) : (
              <div style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '18px', backgroundColor: primaryColor, color: contrastColor }}>
                {store.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '17px', margin: 0, lineHeight: 1.2, color: '#0e2142', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{store.name}</h1>
              {store.description && (
                <p style={{ fontSize: '12px', color: '#53627a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{store.description}</p>
              )}
            </div>
          </div>
          <button onClick={() => setIsCartOpen(true)} style={{ position: 'relative', padding: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#0e2142', flexShrink: 0 }}>
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <motion.div
                key={cartCount}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                style={{
                  position: 'absolute', top: '4px', right: '4px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 700,
                  backgroundColor: primaryColor, color: contrastColor
                }}
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
        <div style={{ width: '100%', overflowX: 'auto', background: '#ffffff', borderBottom: '1px solid #dbe4f4', padding: '12px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', minWidth: 'max-content', maxWidth: '1280px', margin: '0 auto' }}>
            {[{ id: null, name: 'Todos' }, ...categories].map((cat: any) => {
              const isActive = activeCategoryId === cat.id;
              return (
                <button
                  key={cat.id ?? 'all'}
                  onClick={() => setActiveCategoryId(cat.id)}
                  style={{
                    height: '36px', padding: '0 18px', borderRadius: '99px',
                    border: `1.5px solid ${isActive ? primaryColor : '#dbe4f4'}`,
                    background: isActive ? primaryColor : 'white',
                    color: isActive ? contrastColor : '#53627a',
                    fontFamily: '"DM Sans", sans-serif', fontWeight: 700, fontSize: '13px',
                    cursor: 'pointer', flexShrink: 0, transition: 'all 0.18s'
                  }}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <main style={{ flex: 1, maxWidth: '1280px', margin: '0 auto', width: '100%', paddingBottom: '80px' }}>
        {/* Destacados */}
        {featuredProducts.length > 0 && activeCategoryId === null && (
          <div style={{ marginTop: '28px', marginBottom: '24px', padding: '0 16px', overflow: 'hidden' }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px', fontWeight: 700, color: '#0e2142', margin: '0 0 16px', letterSpacing: '-0.03em' }}>✦ Destacados</h2>
            <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'flex', overflowX: 'auto', gap: '12px', paddingBottom: '12px', marginLeft: '-16px', paddingLeft: '16px', marginRight: '-16px', paddingRight: '16px' }}>
              {featuredProducts.map(p => (
                <motion.div key={p.id} variants={cardVariants} style={{ width: '160px', flexShrink: 0 }}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

        {/* Grilla principal */}
        <div style={{ marginTop: featuredProducts.length > 0 && activeCategoryId === null ? '0' : '28px', padding: '0 16px' }}>
          {featuredProducts.length > 0 && activeCategoryId === null && (
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px', fontWeight: 700, color: '#0e2142', margin: '0 0 16px', letterSpacing: '-0.03em' }}>Todos los productos</h2>
          )}
          {displayedProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: '#53627a', fontWeight: 600 }}>No hay productos en esta sección.</div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategoryId || 'all'}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}
                className="sm:grid-cols-3 lg:grid-cols-4"
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
          <div style={{ marginTop: '40px', padding: '0 16px', maxWidth: '760px', margin: '40px auto 0' }}>
            <button
              onClick={() => setIsAboutExpanded(!isAboutExpanded)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 20px', border: '1px solid #dbe4f4', borderRadius: '14px',
                background: 'white', cursor: 'pointer', boxShadow: '0 6px 17px rgba(12,42,86,0.04)'
              }}
            >
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '16px', color: '#0e2142' }}>ℹ️ Sobre esta tienda</span>
              {isAboutExpanded ? <ChevronUp size={18} color="#53627a" /> : <ChevronDown size={18} color="#53627a" />}
            </button>
            {isAboutExpanded && (
              <div style={{ marginTop: '1px', padding: '20px', border: '1px solid #dbe4f4', borderTop: 'none', borderRadius: '0 0 14px 14px', background: 'white', fontSize: '14px', color: '#53627a', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                {store.about_text}
              </div>
            )}
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
      <footer style={{ background: '#061a40', padding: '28px 16px', textAlign: 'center', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '15px', color: 'white', margin: '0 0 4px' }}>{store.name}</p>
        {store.plan !== 'plus' && (
          <p style={{ fontSize: '12px', color: '#8fa5cc', margin: 0 }}>
            Tienda creada con{' '}
            <a href="https://morshop.vercel.app" style={{ color: '#6f8cff', fontWeight: 600, textDecoration: 'none' }}>Morshop</a>
            {' '}— Tu tienda. Tu marca.
          </p>
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
              <div className="modal-image" style={{ height: '280px', flexShrink: 0, background: '#f5f5f5', overflow: 'hidden', position: 'relative' }}>
                {activeImage ? (
                  <>
                    <img src={activeImage} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: selectedProduct.image_fit || 'cover', objectPosition: 'center', background: '#f5f5f5' }} />
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedImage(activeImage); }}
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        zIndex: 10,
                      }}
                    >
                      🔍
                    </button>
                  </>
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
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end', background: 'rgba(6,26,64,0.55)', backdropFilter: 'blur(3px)' }}
          onClick={() => setIsCartOpen(false)}
        >
          <div
            style={{ background: 'white', width: '100%', maxWidth: '400px', height: '100vh', display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 60px rgba(6,26,64,0.15)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Cart Header */}
            <div style={{ height: '68px', borderBottom: '1px solid #dbe4f4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '18px', margin: 0, color: '#0e2142' }}>Tu pedido</h2>
              <button onClick={() => setIsCartOpen(false)} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '1px solid #dbe4f4', background: 'white', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            {/* Cart Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {cart.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#94a3b8' }}>
                  <ShoppingCart size={44} strokeWidth={1.5} />
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '16px', margin: 0, color: '#53627a' }}>Tu carrito está vacío</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {cart.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <div style={{ width: '68px', height: '68px', borderRadius: '12px', background: '#f6f8ff', overflow: 'hidden', flexShrink: 0, border: '1px solid #dbe4f4' }}>
                        {item.image_url ? <img src={item.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={22} color="#c8d3e8" /></div>}
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: '14px', margin: '0 0 8px', lineHeight: 1.3, color: '#0e2142', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '16px', color: primaryColor }}>${item.price}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #dbe4f4', borderRadius: '9px', height: '32px', overflow: 'hidden' }}>
                              <button onClick={() => updateCartQuantity(item.id, -1)} style={{ width: '30px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: '#0e2142' }}>-</button>
                              <span style={{ fontSize: '13px', fontWeight: 700, width: '24px', textAlign: 'center', color: '#0e2142' }}>{item.quantity}</span>
                              <button onClick={() => updateCartQuantity(item.id, 1)} style={{ width: '30px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: '#0e2142' }}>+</button>
                            </div>
                            <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#df5e69', display: 'flex' }}><Trash2 size={17} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div style={{ padding: '20px 24px', borderTop: '1px solid #dbe4f4', boxShadow: '0 -8px 24px rgba(11,40,85,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: '#53627a' }}>Total</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '26px', color: '#0e2142' }}>${cartTotal.toLocaleString('es-AR')}</span>
                </div>
                <button onClick={handleWhatsAppCart} style={{
                  width: '100%', height: '52px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: '#25D366', color: 'white', fontFamily: '"DM Sans", sans-serif', fontWeight: 700, fontSize: '15px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px'
                }}>
                  <MessageCircle size={20} /> Enviar pedido por WhatsApp
                </button>
                <button onClick={() => setIsCartOpen(false)} style={{ width: '100%', padding: '10px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '14px', color: primaryColor }}>Seguir comprando</button>
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

      {/* Overlay de imagen expandida */}
      {expandedImage && (
        <div
          onClick={() => setExpandedImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.95)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          {/* Botón cerrar */}
          <button
            onClick={() => setExpandedImage(null)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>

          {/* Imagen expandida */}
          <img
            src={expandedImage}
            style={{
              maxWidth: '100%',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: '8px',
            }}
            onClick={e => e.stopPropagation()}
          />

          <p style={{
            position: 'absolute',
            bottom: '16px',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '13px',
          }}>
            Tocá en cualquier lado para cerrar
          </p>
        </div>
      )}

      {/* Floating WhatsApp CTA */}
      {!isCartOpen && store.whatsapp_number && cartCount === 0 && (
        <a 
          href={`https://wa.me/${store.whatsapp_number}`} 
          target="_blank" 
          rel="noreferrer"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--success)] text-white font-display font-bold px-6 py-[14px] rounded-full shadow-[0_8px_24px_rgba(37,211,102,0.3)] flex items-center gap-2 z-30 transition-transform hover:scale-105 text-[15px]"
        >
          <span className="w-2 h-2 rounded-full bg-white block mr-1 animate-pulse" /> Consultar por WhatsApp
        </a>
      )}
    </div>
  );
}
