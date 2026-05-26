import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { X, ImageIcon, ShoppingCart, Minus, Plus, Trash2, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';

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
  
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const [addedMessageId, setAddedMessageId] = useState<string | null>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const bannerScrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => { if (selectedProduct) setModalQuantity(1); }, [selectedProduct]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-sans">Cargando tienda...</div>;
  if (!store) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-4 font-sans">
      <h1 className="text-2xl font-bold mb-2">Tienda no encontrada</h1>
      <p className="text-neutral-600">La tienda no existe o no está publicada.</p>
    </div>
  );

  const handleWhatsAppProduct = (product: any, qty: number) => {
    if (!store.whatsapp_number || !product.available) return;
    const template = store.whatsapp_message_template || 'Hola! Me interesa: {{producto}} - ${{precio}}';
    const mensaje = template.replace('{{producto}}', product.name).replace('{{precio}}', product.price);
    const mensajeFinal = `${mensaje}\nCantidad: ${qty}`;
    window.open(`https://wa.me/${store.whatsapp_number}?text=${encodeURIComponent(mensajeFinal)}`, '_blank');
  };

  const handleWhatsAppCart = () => {
    if (!store.whatsapp_number || cart.length === 0) return;
    const items = cart.map(i => `• ${i.name} x${i.quantity} — $${i.price * i.quantity}`).join('\n');
    const total = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const mensaje = `Hola! Te hago el siguiente pedido:\n\n${items}\n\nTotal: $${total}`;
    window.open(`https://wa.me/${store.whatsapp_number}?text=${encodeURIComponent(mensaje)}`, '_blank');
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
      setTimeout(() => setAddedMessageId(null), 1200);
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

  const ProductCard = ({ product }: { product: any }) => {
    const isAdded = addedMessageId === product.id;
    return (
      <div 
        onClick={() => setSelectedProduct(product)}
        className="bg-white rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] md:hover:-translate-y-1 md:hover:shadow-[0_8px_16px_rgba(0,0,0,0.12)] transition-all duration-200 cursor-pointer flex flex-col h-full overflow-hidden"
      >
        {/* Imagen cuadrada perfecta */}
        <div className="w-full aspect-square bg-neutral-100 relative shrink-0">
          {product.original_price && (
            <div className="absolute top-2 left-2 z-10 bg-black text-white text-[10px] font-bold tracking-wider px-2 py-1 uppercase">
              OFERTA
            </div>
          )}
          {product.is_featured && (
            <div className="absolute top-2 right-2 z-10 bg-[#D4A017] text-white text-[10px] font-bold tracking-wider px-2 py-1 uppercase">
              DESTACADO
            </div>
          )}
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-300"><ImageIcon size={24} /></div>
          )}
        </div>
        
        {/* Contenido (Textos) */}
        <div className="p-[10px] flex flex-col flex-1">
          <h3 className="text-[13px] font-bold text-[var(--text-1)] mb-1 line-clamp-2 leading-snug">{product.name}</h3>
          <div className="mt-auto flex flex-col pt-1">
            {product.original_price && <div className="text-[11px] text-neutral-400 line-through mb-0.5">${product.original_price}</div>}
            <div className="text-[16px] font-bold leading-none" style={{ color: 'var(--store-primary)' }}>${product.price}</div>
          </div>
        </div>

        {/* Botón anclado abajo */}
        <div className="mt-2 shrink-0">
          <button
            onClick={(e) => addToCart(product, 1, e)}
            disabled={!product.available}
            className="w-full h-[38px] text-[12px] font-bold flex items-center justify-center transition-colors rounded-none"
            style={{ 
              backgroundColor: product.available ? (isAdded ? '#137333' : 'var(--store-primary)') : '#f5f5f5',
              color: product.available ? 'white' : '#a3a3a3',
            }}
          >
            {product.available ? (isAdded ? '✓ Agregado' : 'Agregar al carrito') : 'Sin stock'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={storeTheme} className="min-h-screen flex flex-col bg-white">
      
      {/* 1. Announcement Bar */}
      {store.announcement_text && (
        <div className="w-full py-1.5 px-4 flex items-center justify-center" style={{ backgroundColor: 'var(--store-primary)' }}>
          <p className="text-white text-[12px] font-medium truncate">{store.announcement_text}</p>
        </div>
      )}

      {/* 2. Header (64px) */}
      <header className="sticky top-0 z-40 shadow-[0_2px_8px_rgba(0,0,0,0.06)]" style={{ height: '64px', backgroundColor: 'var(--store-secondary)' }}>
        <div className="h-full px-4 md:px-8 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center min-w-0">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="h-[44px] w-auto object-contain mr-3 shrink-0" />
            ) : (
              <div className="h-[40px] w-[40px] shrink-0 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3" style={{ backgroundColor: 'var(--store-primary)' }}>
                {store.name.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="font-bold truncate text-[16px] md:text-[18px] text-[var(--text-1)]">{store.name}</h1>
          </div>
          <button onClick={() => setIsCartOpen(true)} className="relative p-2 shrink-0 ml-2 text-[var(--text-1)]">
            <ShoppingCart size={24} />
            {cartCount > 0 && (
              <div className="absolute top-0 right-0 w-[20px] h-[20px] rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-sm" style={{ backgroundColor: 'var(--store-primary)' }}>
                {cartCount}
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Payment Methods */}
      {paymentMethods.length > 0 && (
        <div className="w-full bg-white border-b border-[var(--border)] py-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-4 px-4 min-w-max max-w-7xl mx-auto text-[13px] font-medium" style={{ color: 'var(--store-primary)' }}>
            {paymentMethods.map(pm => (
              <span key={pm} className="flex items-center bg-opacity-10 px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--store-primary)' }}>
                {pm.toLowerCase().includes('efectivo') ? '💵' : pm.toLowerCase().includes('mercado') ? '📲' : pm.toLowerCase().includes('tarjeta') ? '💳' : '·'} {pm}
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
              className="px-5 h-[36px] rounded-full text-[14px] font-bold border transition-colors flex items-center justify-center"
              style={{ backgroundColor: activeCategoryId === null ? 'var(--store-primary)' : 'transparent', color: activeCategoryId === null ? 'white' : 'var(--store-primary)', borderColor: 'var(--store-primary)' }}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className="px-5 h-[36px] rounded-full text-[14px] font-bold border transition-colors flex items-center justify-center"
                style={{ backgroundColor: activeCategoryId === cat.id ? 'var(--store-primary)' : 'transparent', color: activeCategoryId === cat.id ? 'white' : 'var(--store-primary)', borderColor: 'var(--store-primary)' }}
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
            <div className="flex overflow-x-auto no-scrollbar gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0">
              {featuredProducts.map(p => (
                <div key={p.id} className="w-[160px] md:w-[220px] shrink-0">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grilla principal */}
        <div className="mt-8 px-4 md:px-6">
          {featuredProducts.length > 0 && activeCategoryId === null && <h2 className="text-[18px] font-extrabold text-[var(--text-1)] mb-4">Todos los productos</h2>}
          {displayedProducts.length === 0 ? (
            <div className="text-center py-16 text-[var(--text-2)] font-medium">No hay productos en esta sección.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[10px] sm:gap-[12px] lg:gap-[16px]">
              {displayedProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
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

      {/* Footer Público */}
      <footer className="bg-[#F8FAFC] py-8 text-center mt-auto border-t border-[var(--border)]">
        <p className="font-bold text-[14px] text-[var(--text-1)] mb-1">{store.name}</p>
        {store.plan !== 'plus' && (
          <p className="text-[12px] text-[var(--text-3)] font-medium">Creá tu tienda gratis en <a href="https://morshop.vercel.app" className="underline text-[var(--brand)] hover:text-[var(--brand-dark)]">morshop.com</a></p>
        )}
      </footer>

      {/* Modal de Producto REDISEÑADO */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center p-0 md:p-6" onClick={() => setSelectedProduct(null)}>
          <div 
            className="bg-white w-full max-w-[480px] rounded-t-[16px] md:rounded-[16px] max-h-[90vh] overflow-y-auto flex flex-col relative animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 md:fade-in-100 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Botón cerrar siempre visible y pegado */}
            <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-20 w-[40px] h-[40px] bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-md text-black"><X size={20} /></button>
            
            {/* Imagen full width arriba */}
            <div className="w-full aspect-square bg-neutral-100 relative shrink-0">
              {selectedProduct.image_url ? (
                <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-300"><ImageIcon size={48} /></div>
              )}
            </div>

            {/* Info principal */}
            <div className="p-5 flex-1 pb-32">
              <h2 className="text-[20px] font-bold text-[#0F172A] mb-2 leading-tight">{selectedProduct.name}</h2>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[26px] font-bold" style={{ color: 'var(--store-primary)' }}>${selectedProduct.price}</span>
                {selectedProduct.original_price && <span className="text-[14px] text-neutral-400 line-through">${selectedProduct.original_price}</span>}
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-[12px] font-bold mb-6 ${selectedProduct.available ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {selectedProduct.available ? 'Stock disponible' : 'Sin stock'}
              </span>
              
              {selectedProduct.description && (
                <div>
                  <h3 className="text-[13px] font-bold uppercase text-neutral-400 mb-2 tracking-wide">Descripción</h3>
                  <p className="text-[14px] text-[#475569] leading-[1.6] whitespace-pre-wrap">{selectedProduct.description}</p>
                </div>
              )}
            </div>

            {/* Sticky Actions Base */}
            <div className="fixed md:absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-[var(--border)] shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
              <div className="flex gap-3 mb-2">
                <div className="flex items-center border-2 border-neutral-200 rounded-xl overflow-hidden h-[50px] w-[120px] shrink-0">
                  <button onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))} className="flex-1 h-full flex items-center justify-center hover:bg-neutral-50"><Minus size={18} /></button>
                  <div className="font-bold text-[16px] w-[30px] text-center">{modalQuantity}</div>
                  <button onClick={() => setModalQuantity(modalQuantity + 1)} className="flex-1 h-full flex items-center justify-center hover:bg-neutral-50"><Plus size={18} /></button>
                </div>
                <button 
                  onClick={() => addToCart(selectedProduct, modalQuantity)}
                  disabled={!selectedProduct.available}
                  className="flex-1 h-[50px] rounded-xl font-bold text-white text-[15px] disabled:opacity-50"
                  style={{ backgroundColor: 'var(--store-primary)' }}
                >
                  Agregar al carrito
                </button>
              </div>
              <button 
                onClick={() => handleWhatsAppProduct(selectedProduct, modalQuantity)}
                disabled={!selectedProduct.available}
                className="w-full h-[50px] rounded-xl font-bold text-white text-[15px] flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageCircle size={20} />
                Consultar por WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer (Se mantiene igual, solo ajusto z-index) */}
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
                        <div className="flex items-end justify-between mt-auto">
                          <span className="font-bold text-[16px]" style={{ color: 'var(--store-primary)' }}>${item.price}</span>
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
                <button onClick={() => setIsCartOpen(false)} className="w-full py-2 font-bold text-[14px]" style={{ color: 'var(--store-primary)' }}>Seguir comprando</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
