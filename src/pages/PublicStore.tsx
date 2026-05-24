import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { X, ImageIcon, ShoppingCart, Minus, Plus, Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';

// Componente auxiliar invisible que maneja el autoplay del carrusel
function AutoplayBanner({ count, activeIndex, setActiveIndex }: {
  count: number;
  activeIndex: number;
  setActiveIndex: (i: number) => void;
}) {
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
      
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (storeData) {
        setStore(storeData);
        
        // Load font dynamically
        if (storeData.font_family && storeData.font_family !== 'Inter') {
          const link = document.createElement('link');
          link.href = `https://fonts.googleapis.com/css2?family=${storeData.font_family.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
        
        const savedCart = localStorage.getItem(`morshop_cart_${slug}`);
        if (savedCart) {
          try { setCart(JSON.parse(savedCart)); } catch (e) {}
        }
        
        // Fetch categories
        const { data: categoriesData } = await supabase
          .from('store_categories')
          .select('*')
          .eq('store_id', storeData.id)
          .order('name', { ascending: true });
        
        setCategories(categoriesData || []);
        
        // Fetch products
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', storeData.id)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });
          
        setAllProducts(productsData || []);
      }
      setLoading(false);
    }
    
    fetchStore();
  }, [slug]);

  useEffect(() => {
    if (store && cart.length >= 0) {
      localStorage.setItem(`morshop_cart_${store.slug}`, JSON.stringify(cart));
    }
  }, [cart, store]);

  // PROBLEMA 2: Inject store colors as CSS variables on the root element
  useEffect(() => {
    if (store) {
      document.documentElement.style.setProperty('--store-primary', store.primary_color || '#22C55E');
      document.documentElement.style.setProperty('--store-secondary', store.secondary_color || '#1E293B');
    }
    return () => {
      document.documentElement.style.removeProperty('--store-primary');
      document.documentElement.style.removeProperty('--store-secondary');
    };
  }, [store]);

  useEffect(() => {
    if (selectedProduct) {
      setModalQuantity(1);
    }
  }, [selectedProduct]);

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
    const mensaje = template
      .replace('{{producto}}', product.name)
      .replace('{{precio}}', product.price);
    const mensajeFinal = `${mensaje}\nCantidad: ${qty}`;
    
    const url = `https://wa.me/${store.whatsapp_number}?text=${encodeURIComponent(mensajeFinal)}`;
    window.open(url, '_blank');
  };

  const handleWhatsAppCart = () => {
    if (!store.whatsapp_number || cart.length === 0) return;
    
    const items = cart.map(i => `• ${i.name} x${i.quantity} — $${i.price * i.quantity}`).join('\n');
    const total = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const mensaje = `Hola! Te hago el siguiente pedido:\n\n${items}\n\nTotal: $${total}`;
    
    const url = `https://wa.me/${store.whatsapp_number}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const addToCart = (product: any, quantity: number = 1, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!product.available) return;

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
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
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const storeTheme = {
    '--theme-primary': store.primary_color || '#22C55E',
    '--theme-secondary': store.secondary_color || '#ffffff',
    fontFamily: store.font_family ? `"${store.font_family}", sans-serif` : 'Inter, sans-serif'
  } as React.CSSProperties;

  const displayedProducts = activeCategoryId 
    ? allProducts.filter(p => p.category_id === activeCategoryId && !p.is_featured)
    : allProducts.filter(p => !p.is_featured);

  const featuredProducts = allProducts.filter(p => p.is_featured);

  const isListLayout = store.catalog_layout === 'list';

  let paymentMethods: string[] = [];
  try {
    if (store.payment_methods) {
      paymentMethods = typeof store.payment_methods === 'string' ? JSON.parse(store.payment_methods) : store.payment_methods;
    }
  } catch (e) {}

  // Parse banner_url: puede ser JSON array (nuevo) o string simple (legacy)
  let bannerUrls: string[] = [];
  if (store.banner_url) {
    try {
      const parsed = JSON.parse(store.banner_url);
      bannerUrls = Array.isArray(parsed) ? parsed.filter(Boolean) : [store.banner_url];
    } catch {
      bannerUrls = [store.banner_url];
    }
  }

  const ProductCard = ({ product }: { product: any }) => {
    const isAdded = addedMessageId === product.id;
    
    if (isListLayout) {
      return (
        <div 
          onClick={() => setSelectedProduct(product)}
          className="bg-[var(--surface-1)] tactile-card overflow-hidden cursor-pointer flex"
        >
          <div className="w-[100px] h-[100px] bg-neutral-100 relative shrink-0">
            {product.original_price && (
              <div className="absolute top-1 left-1 z-10 bg-[#E53E3E] text-white text-[9px] font-bold px-1 py-0.5 rounded">
                OFERTA
              </div>
            )}
            {product.is_featured && (
              <div className="absolute top-1 right-1 z-10 bg-[#D4A017] text-white text-[9px] font-bold px-1 py-0.5 rounded">
                ⭐
              </div>
            )}
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-300">
                <ImageIcon size={20} />
              </div>
            )}
          </div>
          <div className="p-3 flex flex-col flex-1 min-w-0">
            <h3 className="text-sm font-bold text-neutral-900 mb-1 truncate">{product.name}</h3>
            <div className="flex items-end gap-2 mb-2">
              {product.original_price && <span className="text-xs text-neutral-400 line-through">${product.original_price}</span>}
              <span className="text-[15px] font-bold leading-none" style={{ color: 'var(--theme-primary)' }}>${product.price}</span>
            </div>
            <div className="mt-auto">
              <button
                onClick={(e) => addToCart(product, 1, e)}
                disabled={!product.available}
                className="w-full h-[36px] tactile-btn text-[12px] font-bold transition-all flex items-center justify-center"
                style={{ 
                  backgroundColor: product.available ? (isAdded ? 'var(--color-success)' : 'var(--theme-primary)') : 'var(--text-muted)',
                  color: 'white'
                }}
              >
                {product.available ? (isAdded ? '✓ Agregado' : 'Agregar al carrito') : 'Sin stock'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div 
        onClick={() => setSelectedProduct(product)}
        className="group overflow-hidden cursor-pointer flex flex-col h-full bg-white transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-md border border-neutral-100"
      >
        <div className="aspect-[4/5] bg-neutral-100 relative w-full shrink-0 overflow-hidden">
          {product.original_price && (
            <div className="absolute top-2 left-2 z-10 bg-black text-white text-[10px] font-bold tracking-wider px-2 py-1 uppercase">
              Oferta
            </div>
          )}
          {product.is_featured && (
            <div className="absolute top-2 right-2 z-10 bg-[#D4A017] text-white text-[10px] font-bold tracking-wider px-2 py-1 uppercase">
              Destacado
            </div>
          )}

          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-300">
              <ImageIcon size={24} />
            </div>
          )}
          
          {/* Desktop Hover Quick Add Button */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hidden md:block">
            <button
              onClick={(e) => addToCart(product, 1, e)}
              disabled={!product.available}
              className="w-full h-[40px] text-[13px] font-semibold tracking-wide flex items-center justify-center shadow-lg"
              style={{ 
                backgroundColor: product.available ? (isAdded ? 'var(--color-success)' : 'var(--theme-primary)') : '#f5f5f5',
                color: product.available ? 'white' : '#a3a3a3'
              }}
            >
              {product.available ? (isAdded ? 'Agregado' : 'Añadir al carrito') : 'Agotado'}
            </button>
          </div>
        </div>
        <div className="p-4 flex flex-col flex-1">
          <h3 className="text-[14px] font-medium text-neutral-800 mb-1.5 line-clamp-2 leading-snug">{product.name}</h3>
          <div className="mt-auto flex flex-col">
            {product.original_price && <div className="text-[12px] text-neutral-400 line-through mb-0.5">${product.original_price}</div>}
            <div className="text-[16px] font-semibold leading-none text-neutral-900">${product.price}</div>
          </div>
          {/* Mobile Always Visible Button */}
          <button
            onClick={(e) => addToCart(product, 1, e)}
            disabled={!product.available}
            className="w-full h-[36px] text-[12px] font-medium transition-colors flex items-center justify-center shrink-0 mt-3 md:hidden border rounded-sm"
            style={{ 
              backgroundColor: product.available ? (isAdded ? 'var(--color-success)' : 'transparent') : '#f5f5f5',
              color: product.available ? (isAdded ? 'white' : 'var(--theme-primary)') : '#a3a3a3',
              borderColor: product.available ? (isAdded ? 'var(--color-success)' : 'var(--theme-primary)') : '#f5f5f5'
            }}
          >
            {product.available ? (isAdded ? '✓ Agregado' : 'Añadir al carrito') : 'Agotado'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={storeTheme} className="min-h-screen flex flex-col bg-white">
      
      {/* 1. Announcement Bar */}
      {store.announcement_text && (
        <div className="w-full h-[36px] px-4 flex items-center justify-center" style={{ backgroundColor: 'var(--theme-primary)' }}>
          <p className="text-white text-[12px] font-medium truncate marquee-if-needed">{store.announcement_text}</p>
        </div>
      )}

      {/* 2. Header — Minimalist & Professional */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-100" style={{ height: '64px' }}>
        <div className="h-full px-4 md:px-8 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center min-w-0">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="h-[36px] md:h-[44px] w-auto object-contain mr-3 shrink-0" />
            ) : (
              <div className="h-[36px] w-[36px] shrink-0 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3" style={{ backgroundColor: 'var(--theme-primary)' }}>
                {store.name.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="font-semibold truncate text-[16px] md:text-[18px] text-neutral-900 tracking-tight">
              {store.name}
            </h1>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 shrink-0 ml-2 text-neutral-800 hover:text-black transition-colors"
          >
            <ShoppingCart size={22} strokeWidth={1.5} />
            {cartCount > 0 && (
              <div 
                className="absolute top-1 right-0 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                style={{ backgroundColor: 'var(--theme-primary)' }}
              >
                {cartCount}
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Payment Methods Info */}
      {paymentMethods.length > 0 && (
        <div className="w-full bg-neutral-50 border-b border-neutral-100 py-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-4 px-4 min-w-max max-w-7xl mx-auto text-[12px] text-neutral-600 font-medium">
            {paymentMethods.map(pm => (
              <span key={pm} className="flex items-center">
                {pm.toLowerCase().includes('efectivo') ? '💵' : pm.toLowerCase().includes('mercado') ? '📲' : pm.toLowerCase().includes('tarjeta') ? '💳' : '·'} {pm}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3. Banner Carrusel */}
      {bannerUrls.length > 0 && (
        <div className="relative w-full overflow-hidden" style={{ height: 'clamp(160px, 35vw, 280px)' }}>
          {/* Scroll Container */}
          <div
            ref={bannerScrollRef}
            className="flex w-full h-full overflow-x-auto no-scrollbar"
            style={{ scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }}
            onScroll={(e) => {
              const el = e.currentTarget;
              const idx = Math.round(el.scrollLeft / el.offsetWidth);
              setActiveBannerIndex(idx);
            }}
          >
            {bannerUrls.map((url, i) => (
              <div
                key={i}
                className="w-full h-full shrink-0"
                style={{ scrollSnapAlign: 'start' }}
              >
                <img src={url} alt={`Banner ${i + 1}`} className="w-full h-full object-cover object-center" />
              </div>
            ))}
          </div>

          {/* Flechas de navegación (solo si hay más de 1 banner) */}
          {bannerUrls.length > 1 && (
            <>
              <button
                onClick={() => {
                  const el = bannerScrollRef.current;
                  if (!el) return;
                  const newIdx = (activeBannerIndex - 1 + bannerUrls.length) % bannerUrls.length;
                  el.scrollTo({ left: newIdx * el.offsetWidth, behavior: 'smooth' });
                  setActiveBannerIndex(newIdx);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center backdrop-blur-sm transition-colors"
                aria-label="Banner anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => {
                  const el = bannerScrollRef.current;
                  if (!el) return;
                  const newIdx = (activeBannerIndex + 1) % bannerUrls.length;
                  el.scrollTo({ left: newIdx * el.offsetWidth, behavior: 'smooth' });
                  setActiveBannerIndex(newIdx);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center backdrop-blur-sm transition-colors"
                aria-label="Banner siguiente"
              >
                <ChevronRight size={18} />
              </button>

              {/* Dots indicadores */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                {bannerUrls.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const el = bannerScrollRef.current;
                      if (!el) return;
                      el.scrollTo({ left: i * el.offsetWidth, behavior: 'smooth' });
                      setActiveBannerIndex(i);
                    }}
                    className="rounded-full transition-all"
                    style={{
                      width: activeBannerIndex === i ? '20px' : '8px',
                      height: '8px',
                      backgroundColor: activeBannerIndex === i ? 'var(--theme-primary)' : 'rgba(255,255,255,0.7)',
                    }}
                    aria-label={`Ir al banner ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Autoplay effect */}
          {bannerUrls.length > 1 && (
            <AutoplayBanner
              count={bannerUrls.length}
              activeIndex={activeBannerIndex}
              setActiveIndex={(i) => {
                setActiveBannerIndex(i);
                const el = bannerScrollRef.current;
                if (el) el.scrollTo({ left: i * el.offsetWidth, behavior: 'smooth' });
              }}
            />
          )}
        </div>
      )}

      {/* 4. Description */}
      {store.description && (
        <div className="w-full text-center p-[12px_16px]" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 5%, transparent)' }}>
          <p className="text-[14px] text-neutral-700 max-w-2xl mx-auto">{store.description}</p>
        </div>
      )}

      {/* 5. Category Navigation */}
      {categories.length > 0 && (
        <div className="w-full border-b border-neutral-100 overflow-x-auto no-scrollbar sticky top-0 bg-white z-30 shadow-sm">
          <div className="flex items-center h-[44px] px-4 gap-2 min-w-max max-w-7xl mx-auto py-2">
            <button
              onClick={() => setActiveCategoryId(null)}
              className="px-4 h-[32px] rounded-full text-[13px] font-medium whitespace-nowrap transition-colors border flex items-center justify-center"
              style={{
                backgroundColor: activeCategoryId === null ? 'var(--theme-primary)' : 'transparent',
                color: activeCategoryId === null ? '#fff' : 'var(--theme-primary)',
                borderColor: 'var(--theme-primary)'
              }}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className="px-4 h-[32px] rounded-full text-[13px] font-medium whitespace-nowrap transition-colors border flex items-center justify-center"
                style={{
                  backgroundColor: activeCategoryId === cat.id ? 'var(--theme-primary)' : 'transparent',
                  color: activeCategoryId === cat.id ? '#fff' : 'var(--theme-primary)',
                  borderColor: 'var(--theme-primary)'
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full pb-12">
        {/* 6. Featured Products Row */}
        {featuredProducts.length > 0 && activeCategoryId === null && (
          <div className="mt-6 mb-8 px-3 md:px-6">
            <h2 className="text-[13px] font-bold text-[#4a4a4a] mb-3">⭐ Destacados</h2>
            <div className="flex overflow-x-auto no-scrollbar gap-3 md:gap-4 pb-4 -mx-3 px-3 md:mx-0 md:px-0">
              {featuredProducts.map(p => (
                <div key={p.id} className={`${isListLayout ? 'w-[280px] md:w-[320px]' : 'w-[160px]'} shrink-0`}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. Products Grid */}
        <div className="mt-6">
          {featuredProducts.length > 0 && activeCategoryId === null && (
            <h2 className="text-[13px] font-bold text-[#4a4a4a] mb-3">Todos los productos</h2>
          )}
          
          {displayedProducts.length === 0 ? (
            <div className="text-center text-neutral-500 py-12 text-sm">No hay productos en esta sección.</div>
          ) : (
            <div className={isListLayout ? 'product-grid-list' : 'product-grid-standard'}>
              {displayedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>

        {/* About Section */}
        {store.about_text && (
          <div className="mt-12 px-4 md:px-6 max-w-3xl mx-auto">
            <button 
              onClick={() => setIsAboutExpanded(!isAboutExpanded)}
              className="w-full flex items-center justify-between py-4 border-t border-neutral-200"
            >
              <h2 className="text-[15px] font-bold flex items-center gap-2">
                ℹ️ Sobre esta tienda
              </h2>
              {isAboutExpanded ? <ChevronUp size={20} className="text-neutral-500" /> : <ChevronDown size={20} className="text-neutral-500" />}
            </button>
            {isAboutExpanded && (
              <div className="pb-8 pt-2 text-[14px] text-neutral-600 whitespace-pre-wrap leading-relaxed animate-in slide-in-from-top-2 fade-in duration-200">
                {store.about_text}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-5 px-4 text-center mt-auto flex flex-col items-center" style={{ backgroundColor: '#f5f5f5' }}>
        <p className="font-bold text-[12px] text-neutral-500 mb-2">{store.name}</p>
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="text-neutral-500 text-[12px]">Creá tu tienda gratis en</span>
          <a href="/" className="inline-block mt-2">
            <img src="/logo-letras.png" alt="Morshop" className="h-[32px] w-auto opacity-90 hover:opacity-100 transition-opacity" />
          </a>
        </div>
      </footer>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/50 animate-in fade-in duration-200" onClick={() => setSelectedProduct(null)}>
          <div 
            className="bg-white w-full md:w-[500px] md:max-w-none rounded-t-[16px] md:rounded-[12px] flex flex-col max-h-[92vh] md:max-h-[85vh] animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 md:zoom-in-95 duration-200 overflow-hidden relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile Drag Handle */}
            <div className="w-full flex justify-center mt-[12px] mb-2 md:hidden">
              <div className="w-[40px] h-[4px] bg-neutral-300 rounded-full"></div>
            </div>

            {/* Close Button */}
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm text-neutral-900 w-[44px] h-[44px] flex items-center justify-center rounded-full shadow-sm hover:bg-white transition-colors"
            >
              <X size={20} />
            </button>
            
            {/* Scrolling Content Area */}
            <div className="overflow-y-auto flex-1 no-scrollbar md:flex md:flex-row md:w-[900px]">
              {/* Image */}
              <div className="w-full md:w-1/2 aspect-[4/5] md:aspect-auto md:h-full bg-neutral-50 relative shrink-0">
                {selectedProduct.image_url ? (
                  <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-300">
                    <ImageIcon size={48} />
                  </div>
                )}
                {selectedProduct.original_price && (
                  <span className="absolute top-4 left-4 bg-black text-white text-[11px] font-bold tracking-wider px-3 py-1.5 uppercase shadow-sm">
                    OFERTA
                  </span>
                )}
              </div>
              
              {/* Info */}
              <div className="p-6 md:p-8 md:w-1/2 flex flex-col">
                <h2 className="text-[24px] md:text-[28px] font-medium text-neutral-900 leading-tight mb-4 tracking-tight">
                  {selectedProduct.name}
                </h2>
                
                <div className="mb-6 flex items-end gap-3">
                  <span className="text-[28px] font-semibold leading-none text-neutral-900">${selectedProduct.price}</span>
                  {selectedProduct.original_price && <span className="text-neutral-400 line-through text-[16px] leading-snug mb-1">${selectedProduct.original_price}</span>}
                </div>
                
                <div className="mb-8">
                  <span className={`inline-flex items-center px-3 py-1 rounded-sm text-[12px] font-medium ${selectedProduct.available ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-neutral-100 text-neutral-600'}`}>
                    {selectedProduct.available ? 'Disponible en stock' : 'Agotado actualmente'}
                  </span>
                </div>
                
                {selectedProduct.description && (
                  <div className="pb-6 mb-auto">
                    <h3 className="text-[13px] font-semibold text-neutral-900 uppercase tracking-wider mb-3">Descripción</h3>
                    <p className="text-[15px] text-neutral-600 whitespace-pre-wrap leading-[1.7]">{selectedProduct.description}</p>
                  </div>
                )}

                {/* Mobile spacer for fixed bottom area */}
                <div className="h-6 md:hidden"></div>
              </div>
            </div>

            {/* Sticky Bottom Action Area */}
            <div className="p-4 md:p-8 bg-white border-t border-neutral-100 shrink-0 md:w-1/2 md:absolute md:bottom-0 md:right-0 md:border-t-0 md:pt-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center border border-neutral-300 rounded-sm overflow-hidden h-[48px] w-[110px] shrink-0">
                  <button 
                    onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                    disabled={!selectedProduct.available || modalQuantity <= 1}
                    className="w-[36px] h-full flex items-center justify-center text-neutral-600 disabled:opacity-50 hover:bg-neutral-50 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <div className="flex-1 h-full flex items-center justify-center font-medium text-[15px]">
                    {modalQuantity}
                  </div>
                  <button 
                    onClick={() => setModalQuantity(modalQuantity + 1)}
                    disabled={!selectedProduct.available}
                    className="w-[36px] h-full flex items-center justify-center text-neutral-600 disabled:opacity-50 hover:bg-neutral-50 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <button 
                  onClick={() => addToCart(selectedProduct, modalQuantity)}
                  disabled={!selectedProduct.available}
                  className="flex-1 h-[48px] rounded-sm font-semibold tracking-wide text-white text-[14px] flex items-center justify-center disabled:opacity-50 transition-all hover:opacity-90"
                  style={{ backgroundColor: selectedProduct.available ? 'var(--theme-primary)' : '#ccc' }}
                >
                  Agregar al carrito
                </button>
              </div>

              {store.whatsapp_number ? (
                <button 
                  onClick={() => handleWhatsAppProduct(selectedProduct, modalQuantity)}
                  disabled={!selectedProduct.available}
                  className="w-full h-[48px] rounded-sm font-semibold tracking-wide text-white text-[14px] flex items-center justify-center disabled:opacity-50 disabled:bg-neutral-300 transition-all hover:opacity-90 mt-1"
                  style={{ backgroundColor: selectedProduct.available ? '#25D366' : '' }}
                >
                  {selectedProduct.available ? 'Consultar por WhatsApp' : 'Agotado'}
                </button>
              ) : (
                <div className="w-full h-[48px] rounded-sm bg-neutral-100 text-neutral-500 flex items-center justify-center font-medium text-[13px] mt-1">
                  WhatsApp no configurado
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[110] flex justify-end bg-black/50 animate-in fade-in duration-200" onClick={() => setIsCartOpen(false)}>
          <div 
            className="bg-white w-full md:w-[360px] h-[100vh] flex flex-col animate-in slide-in-from-right duration-200 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Cart Header */}
            <div className="h-[70px] border-b border-neutral-100 flex items-center justify-between px-6 shrink-0">
              <h2 className="font-semibold text-[16px] tracking-tight text-neutral-900">Tu pedido</h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="w-[36px] h-[36px] flex items-center justify-center rounded-full hover:bg-neutral-50 text-neutral-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                  <ShoppingCart size={40} strokeWidth={1.5} className="mb-4 opacity-40" />
                  <p className="font-medium text-[14px]">Tu carrito está vacío</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-[64px] h-[64px] rounded-sm bg-neutral-50 shrink-0 overflow-hidden border border-neutral-100">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-300">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col min-w-0 py-0.5">
                        <h4 className="font-medium text-[13px] leading-snug mb-1 text-neutral-800 line-clamp-2">{item.name}</h4>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="font-semibold text-[14px]" style={{ color: 'var(--theme-primary)' }}>${item.price}</span>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center bg-white rounded-sm border border-neutral-200 h-[28px]">
                              <button onClick={() => updateCartQuantity(item.id, -1)} className="w-7 h-full flex items-center justify-center text-neutral-500 hover:bg-neutral-50"><Minus size={12} /></button>
                              <span className="text-[12px] font-medium w-4 text-center">{item.quantity}</span>
                              <button onClick={() => updateCartQuantity(item.id, 1)} className="w-7 h-full flex items-center justify-center text-neutral-500 hover:bg-neutral-50"><Plus size={12} /></button>
                            </div>
                            <button onClick={() => removeFromCart(item.id)} className="text-neutral-300 hover:text-red-500 transition-colors p-1">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer Sticky */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-neutral-100 bg-white shrink-0 pb-8 md:pb-6 shadow-[0_-4px_20px_rgb(0,0,0,0.02)]">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[13px] font-medium text-neutral-500">Subtotal</span>
                  <span className="font-semibold text-[18px] text-neutral-900">${cartTotal}</span>
                </div>
                <p className="text-[11px] text-neutral-400 mb-5 text-right">Precios orientativos. El vendedor confirmará por WhatsApp.</p>
                
                {store.whatsapp_number ? (
                  <button 
                    onClick={handleWhatsAppCart}
                    className="w-full h-[48px] rounded-sm font-semibold tracking-wide text-white text-[14px] flex items-center justify-center mb-4 transition-all hover:opacity-90"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    Enviar pedido por WhatsApp
                  </button>
                ) : (
                  <div className="w-full h-[48px] rounded-sm bg-neutral-50 text-neutral-400 flex items-center justify-center font-medium text-[13px] mb-4 border border-neutral-100">
                    WhatsApp no configurado
                  </div>
                )}
                
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-2 font-medium text-[13px] hover:underline"
                  style={{ color: 'var(--theme-primary)' }}
                >
                  Seguir comprando
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
