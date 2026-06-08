import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Image as ImageIcon, AlertTriangle, Eye, EyeOff, Palette, Info, MessageCircle, Save, Megaphone, CreditCard, ImagePlus, Trash2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { usePlan } from '../../hooks/usePlan';

const FONTS = [
  { id: 'Inter', name: 'Inter (Moderna)', free: true },
  { id: 'Playfair Display', name: 'Playfair (Elegante)', free: false },
  { id: 'Nunito', name: 'Nunito (Amigable)', free: true },
  { id: 'Oswald', name: 'Oswald (Llamativa)', free: false },
  { id: 'Lato', name: 'Lato (Profesional)', free: true },
];

const DEFAULT_METHODS = ['Efectivo', 'Transferencia', 'Mercado Pago', 'Débito / Crédito'];

export default function StoreSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [store, setStore] = useState<any>({
    name: '', slug: '', description: '', primary_color: '#1136EE', secondary_color: '#ffffff',
    whatsapp_number: '', whatsapp_message_template: 'Hola! Me interesa: {{producto}} - ${{precio}}',
    is_published: false, logo_url: '', banner_urls: [], announcement_1: '', announcement_2: '', announcement_3: '',
    font_family: 'Inter', catalog_layout: 'grid', about_text: '', payment_methods: [],
    instagram_url: '', tiktok_url: '', facebook_url: '', order_form_enabled: false
  });

  const planStatus = usePlan(store?.id || null);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [otherPayment, setOtherPayment] = useState('');
  const [useOtherPayment, setUseOtherPayment] = useState(false);

  useEffect(() => {
    const fonts = FONTS.map(f => f.id.replace(/ /g, '+')).join('&family=');
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fonts}&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch (e) {} };
  }, []);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { loadStore(); }, []);

  async function loadStore() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('stores').select('*').eq('user_id', user.id).single();

    if (data) {
      let parsedMethods = [];
      try {
        if (data.payment_methods) parsedMethods = typeof data.payment_methods === 'string' ? JSON.parse(data.payment_methods) : data.payment_methods;
      } catch (e) {}
      
      let parsedBanners: string[] = [];
      try {
        if (data.banner_url) {
          if (data.banner_url.trim().startsWith('[')) {
            parsedBanners = JSON.parse(data.banner_url);
          } else {
            parsedBanners = [data.banner_url];
          }
        }
      } catch (e) { parsedBanners = [data.banner_url]; }
      
      setStore({
        ...store, ...data, payment_methods: parsedMethods, banner_urls: parsedBanners,
        catalog_layout: data.catalog_layout || 'grid', font_family: data.font_family || 'Inter',
        primary_color: data.primary_color || '#1136EE', secondary_color: data.secondary_color || '#ffffff',
        announcement_1: data.announcement_1 || data.announcement_text || '',
        announcement_2: data.announcement_2 || '',
        announcement_3: data.announcement_3 || '',
        instagram_url: data.instagram_url || '',
        tiktok_url: data.tiktok_url || '',
        facebook_url: data.facebook_url || '',
        order_form_enabled: data.order_form_enabled || false
      });

      const customMethod = parsedMethods.find((m: string) => !DEFAULT_METHODS.includes(m));
      if (customMethod) {
        setUseOtherPayment(true);
        setOtherPayment(customMethod);
      }
    }
    setLoading(false);
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>, bucket: string, field: 'logo_url', setUploading: (v: boolean) => void) {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const ext = file.name.split('.').pop();
      const filePath = `${store.id || 'new'}/${Math.random()}.${ext}`;

      const { error } = await supabase.storage.from(bucket).upload(filePath, file);
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      setStore({ ...store, [field]: data.publicUrl });
    } catch (err: any) { alert(err.message); } finally { setUploading(false); }
  }

  async function handleBannerUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploadingBanner(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const ext = file.name.split('.').pop();
      const filePath = `${store.id || 'new'}/${Math.random()}.${ext}`;

      const { error } = await supabase.storage.from('banners').upload(filePath, file);
      if (error) throw error;
      const { data } = supabase.storage.from('banners').getPublicUrl(filePath);
      
      const currentBanners = store.banner_urls || [];
      setStore({ ...store, banner_urls: [...currentBanners, data.publicUrl] });
    } catch (err: any) { alert(err.message); } finally { setUploadingBanner(false); }
  }

  const removeBanner = (index: number) => {
    const newBanners = [...(store.banner_urls || [])];
    newBanners.splice(index, 1);
    setStore({ ...store, banner_urls: newBanners });
  };

  const handlePaymentToggle = (method: string) => {
    const methods = store.payment_methods || [];
    if (methods.includes(method)) {
      setStore({ ...store, payment_methods: methods.filter((m: string) => m !== method) });
    } else {
      setStore({ ...store, payment_methods: [...methods, method] });
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = store.whatsapp_message_template || '';
    const newText = currentText.slice(0, start) + variable + currentText.slice(end);
    setStore({ ...store, whatsapp_message_template: newText });
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    let finalMethods = [...(store.payment_methods || [])].filter((m: string) => DEFAULT_METHODS.includes(m));
    if (useOtherPayment && otherPayment.trim()) finalMethods.push(otherPayment.trim());

    const payload = {
      name: store.name, slug: store.slug, description: store.description || '',
      primary_color: store.primary_color || '#1136EE', secondary_color: store.secondary_color || '#ffffff',
      font_family: store.font_family || 'Inter', catalog_layout: store.catalog_layout || 'grid',
      about_text: store.about_text || '', payment_methods: finalMethods,
      announcement_1: store.announcement_1 || '', announcement_2: store.announcement_2 || '', announcement_3: store.announcement_3 || '', logo_url: store.logo_url || '',
      banner_url: store.banner_urls && store.banner_urls.length > 0 ? JSON.stringify(store.banner_urls) : '',
      whatsapp_number: store.whatsapp_number || '', whatsapp_message_template: store.whatsapp_message_template || '',
      is_published: store.is_published, user_id: user.id,
      instagram_url: store.instagram_url || null,
      tiktok_url: store.tiktok_url || null,
      facebook_url: store.facebook_url || null,
      order_form_enabled: store.order_form_enabled || false
    };

    let saveError: any = null;

    if (store.id) {
      const { error } = await supabase.from('stores').update(payload).eq('id', store.id).select();
      saveError = error;
    } else {
      const { data, error } = await supabase.from('stores').insert([payload]).select().single();
      if (data) setStore(data);
      saveError = error;
    }
    setSaving(false);
    
    if (saveError) {
      alert('Error al guardar: ' + saveError.message);
    } else {
      const btn = document.getElementById('save-btn-text');
      if (btn) {
        btn.innerText = '¡Guardado con éxito!';
        setTimeout(() => { btn.innerText = 'Guardar Cambios'; }, 2000);
      }
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-40">
      <div className="w-8 h-8 border-4 border-[var(--brand-light)] border-t-[var(--brand)] rounded-full animate-spin" />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl pb-24 md:pb-12 font-sans">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-extrabold text-[var(--text-1)] mb-1 tracking-tight">Mi Tienda</h1>
        <p className="text-[var(--text-2)] font-medium">Personalizá tu catálogo, métodos de pago y diseño visual.</p>
      </motion.div>
      
      {/* 1. VISIBILIDAD */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="bg-white rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] p-6 sm:p-8">
        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4 mb-6">
          <div className="p-2 bg-[var(--surface-1)] rounded-lg text-[var(--brand)]"><Eye size={20} /></div>
          <h2 className="text-lg font-bold text-[var(--text-1)]">Estado de la tienda</h2>
        </div>
        
        <div className="flex flex-col gap-4">
          <label className="flex items-center justify-between p-4 border border-[var(--border)] rounded-xl cursor-pointer hover:border-[var(--brand)]/30 hover:bg-[var(--brand-light)]/50 transition-all">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${store.is_published ? 'bg-[var(--green)]' : 'bg-[var(--border-strong)]'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${store.is_published ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
              <div>
                <span className="block font-bold text-[var(--text-1)] mb-0.5">Tienda Pública</span>
                <span className="block text-sm text-[var(--text-2)] font-medium">Permite que tus clientes vean tu catálogo</span>
              </div>
            </div>
            {store.is_published ? <Eye className="text-[var(--green)]" /> : <EyeOff className="text-[var(--text-3)]" />}
            <input type="checkbox" checked={store.is_published} onChange={e => setStore({...store, is_published: e.target.checked})} className="hidden" />
          </label>

          {!store.is_published && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl">
              <AlertTriangle size={20} className="shrink-0 mt-0.5 text-amber-600" />
              <p className="text-sm font-medium leading-relaxed">
                Tu tienda es un borrador y <strong>no es visible para el público</strong>. Activá la opción de arriba cuando estés listo para recibir visitas.
              </p>
            </div>
          )}
        </div>
      </motion.section>

      {/* 2. IDENTIDAD VISUAL */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="bg-white rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] p-6 sm:p-8">
        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4 mb-6">
          <div className="p-2 bg-[var(--surface-1)] rounded-lg text-[var(--brand)]"><Palette size={20} /></div>
          <h2 className="text-lg font-bold text-[var(--text-1)]">Identidad Visual</h2>
        </div>
        
        <div className="flex flex-col gap-8 mb-8">
          <div>
            <label className="block text-sm font-bold text-[var(--text-1)] mb-3">Logo de la tienda</label>
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 shrink-0 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] shadow-sm overflow-hidden flex items-center justify-center relative">
                {store.logo_url ? <img src={store.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <ImageIcon className="text-[var(--text-3)]" size={32} />}
              </div>
              <div className="flex-1 max-w-[200px] relative">
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'logos', 'logo_url', setUploadingLogo)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploadingLogo} />
                <button type="button" className="w-full h-[44px] bg-white border border-[var(--border-strong)] hover:bg-[var(--surface-1)] rounded-xl text-[var(--text-1)] font-bold text-sm shadow-sm transition-colors">
                  {uploadingLogo ? 'Subiendo...' : 'Subir nuevo logo'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-[var(--text-1)] mb-3">Color Primario (Marca)</label>
              <div className="flex items-center gap-3">
                <div className="w-[48px] h-[48px] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden shrink-0 relative cursor-pointer hover:scale-105 transition-transform">
                  <input type="color" value={store.primary_color || '#1136EE'} onChange={e => setStore({...store, primary_color: e.target.value})} className="absolute -inset-2 w-[80px] h-[80px] cursor-pointer" />
                </div>
                <input type="text" value={store.primary_color || '#1136EE'} onChange={e => setStore({...store, primary_color: e.target.value})} className="w-full max-w-[120px] h-[48px] px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] focus:bg-white focus:border-[var(--brand)] outline-none font-mono text-sm transition-colors uppercase" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-[var(--text-1)] mb-3">Color Secundario (Fondo)</label>
              <div className="flex items-center gap-3">
                <div className="w-[48px] h-[48px] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden shrink-0 relative cursor-pointer hover:scale-105 transition-transform">
                  <input type="color" value={store.secondary_color || '#ffffff'} onChange={e => setStore({...store, secondary_color: e.target.value})} className="absolute -inset-2 w-[80px] h-[80px] cursor-pointer" />
                </div>
                <input type="text" value={store.secondary_color || '#ffffff'} onChange={e => setStore({...store, secondary_color: e.target.value})} className="w-full max-w-[120px] h-[48px] px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] focus:bg-white focus:border-[var(--brand)] outline-none font-mono text-sm transition-colors uppercase" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--text-1)] mb-3">Tipografía</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {FONTS.map(font => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => {
                    if (!font.free && !planStatus.isPlus) {
                      window.location.href = '/dashboard/plus';
                      return;
                    }
                    setStore({...store, font_family: font.id});
                  }}
                  className={`relative p-4 rounded-xl text-left transition-all border ${store.font_family === font.id ? 'border-[var(--brand)] bg-[var(--brand-light)] shadow-sm' : 'border-[var(--border)] bg-[var(--surface-0)] hover:border-[var(--border-strong)]'} ${!font.free && !planStatus.isPlus ? 'opacity-80 grayscale cursor-not-allowed' : ''}`}
                  style={{ fontFamily: font.id }}
                >
                  <div className="flex justify-between items-start">
                    <span className="block text-[15px] font-bold text-[var(--text-1)] mb-1">{font.id}</span>
                    {!font.free && !planStatus.isPlus && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded shadow-sm border border-amber-200">⭐ Plus</span>}
                  </div>
                  <span className={`block text-xs font-medium ${store.font_family === font.id ? 'text-[var(--brand)]' : 'text-[var(--text-3)]'}`}>Aa Bb Cc</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* 3. BANNERS Y ANUNCIOS */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="bg-white rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4 mb-2">
          <div className="p-2 bg-[var(--surface-1)] rounded-lg text-[var(--brand)]"><Megaphone size={20} /></div>
          <h2 className="text-lg font-bold text-[var(--text-1)]">Promociones y Banners</h2>
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--text-1)] mb-1.5">Promociones del banner <span style={{fontSize:'12px',color:'#888',fontWeight:'normal'}}>(máx. 3)</span></label>
          <div className="flex flex-col gap-3">
            <input type="text" value={store.announcement_1 || ''} onChange={e => setStore({...store, announcement_1: e.target.value})} className="w-full h-[48px] px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] focus:bg-white focus:border-[var(--brand)] outline-none transition-colors text-[var(--text-1)] font-medium" placeholder="Ej: ENVÍO GRATIS en compras mayores a $10.000" maxLength={80} />
            <input type="text" value={store.announcement_2 || ''} onChange={e => setStore({...store, announcement_2: e.target.value})} className="w-full h-[48px] px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] focus:bg-white focus:border-[var(--brand)] outline-none transition-colors text-[var(--text-1)] font-medium" placeholder="Ej: 20% OFF en toda la tienda este fin de semana" maxLength={80} />
            <input type="text" value={store.announcement_3 || ''} onChange={e => setStore({...store, announcement_3: e.target.value})} className="w-full h-[48px] px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] focus:bg-white focus:border-[var(--brand)] outline-none transition-colors text-[var(--text-1)] font-medium" placeholder="Ej: Nuevos productos cada semana" maxLength={80} />
          </div>
          <p className="text-xs text-[var(--text-2)] mt-2 font-medium">Los campos vacíos no aparecen en el banner. Con uno solo igual funciona.</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--text-1)] mb-3">Banners (Carrusel)</label>
          <div className="flex flex-col gap-4">
            <div className="relative w-full md:w-[240px]">
              <input type="file" accept="image/*" onChange={handleBannerUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploadingBanner} />
              <button type="button" className="w-full h-[44px] bg-white border border-[var(--border-strong)] hover:bg-[var(--surface-1)] rounded-xl text-[var(--text-1)] font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2">
                <ImagePlus size={18} />
                {uploadingBanner ? 'Subiendo...' : 'Añadir banner'}
              </button>
            </div>
            
            {store.banner_urls && store.banner_urls.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {store.banner_urls.map((url: string, idx: number) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden border border-[var(--border)] bg-neutral-50 h-[120px] group">
                    <img src={url} alt={`Banner ${idx}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" onClick={() => removeBanner(idx)} className="bg-white text-red-600 p-2 rounded-full shadow-lg hover:bg-red-50 hover:scale-110 transition-transform">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* 4. INFORMACIÓN GENERAL */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }} className="bg-white rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4 mb-2">
          <div className="p-2 bg-[var(--surface-1)] rounded-lg text-[var(--brand)]"><Info size={20} /></div>
          <h2 className="text-lg font-bold text-[var(--text-1)]">Información General</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-[var(--text-1)] mb-1.5">Nombre de la Tienda</label>
            <input type="text" value={store.name} onChange={e => setStore({...store, name: e.target.value})} className="w-full h-[48px] px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] focus:bg-white focus:border-[var(--brand)] outline-none transition-colors text-[var(--text-1)] font-medium" placeholder="Ej: Mi Emprendimiento" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text-1)] mb-1.5">Enlace único (Slug)</label>
            <input type="text" value={store.slug} onChange={e => setStore({...store, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})} className="w-full h-[48px] px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] focus:bg-white focus:border-[var(--brand)] outline-none transition-colors text-[var(--text-1)] font-medium" placeholder="mi-emprendimiento" required />
            {store.slug && <p className="text-xs text-[var(--text-2)] mt-2 font-medium">morshop.com/tienda/<span className="text-[var(--brand)]">{store.slug}</span></p>}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-bold text-[var(--text-1)] mb-1.5">Eslogan o descripción corta</label>
          <input type="text" value={store.description || ''} onChange={e => setStore({...store, description: e.target.value})} className="w-full h-[48px] px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] focus:bg-white focus:border-[var(--brand)] outline-none transition-colors text-[var(--text-1)] font-medium" placeholder="Lo mejor en diseño artesanal..." />
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--text-1)] mb-1.5">Sobre nosotros <span className="font-normal text-[var(--text-3)]">(aparece al final del catálogo)</span></label>
          <textarea value={store.about_text || ''} onChange={e => setStore({...store, about_text: e.target.value})} className="w-full px-4 py-3 min-h-[120px] rounded-xl border border-[var(--border)] bg-[var(--surface-1)] focus:bg-white focus:border-[var(--brand)] outline-none transition-colors text-[var(--text-1)] font-medium resize-y" placeholder="Contá la historia de tu marca..."></textarea>
        </div>

        {/* Redes Sociales (Plan Plus) */}
        <div className="pt-6 border-t border-[var(--border)] relative">
          <h3 className="text-[15px] font-bold text-[var(--text-1)] mb-4 flex items-center gap-2">
            Redes sociales <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">Plan Plus</span>
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-2)] mb-1.5">Instagram URL</label>
              <input 
                type="text" 
                value={store.instagram_url || ''} 
                onChange={e => setStore({...store, instagram_url: e.target.value})} 
                className="w-full h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] focus:bg-white focus:border-[var(--brand)] outline-none transition-colors text-[var(--text-1)] font-medium text-sm" 
                placeholder="https://instagram.com/tu_cuenta"
                disabled={!planStatus.isPlus}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-[var(--text-2)] mb-1.5">TikTok URL</label>
              <input 
                type="text" 
                value={store.tiktok_url || ''} 
                onChange={e => setStore({...store, tiktok_url: e.target.value})} 
                className="w-full h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] focus:bg-white focus:border-[var(--brand)] outline-none transition-colors text-[var(--text-1)] font-medium text-sm" 
                placeholder="https://tiktok.com/@tu_cuenta"
                disabled={!planStatus.isPlus}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-[var(--text-2)] mb-1.5">Facebook URL</label>
              <input 
                type="text" 
                value={store.facebook_url || ''} 
                onChange={e => setStore({...store, facebook_url: e.target.value})} 
                className="w-full h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] focus:bg-white focus:border-[var(--brand)] outline-none transition-colors text-[var(--text-1)] font-medium text-sm" 
                placeholder="https://facebook.com/tu_pagina"
                disabled={!planStatus.isPlus}
              />
            </div>
          </div>

          {/* Overlay de Bloqueo si es plan free */}
          {!planStatus.isPlus && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[1.5px] flex flex-col items-center justify-center z-20 rounded-xl">
              <div className="bg-white border border-[var(--border)] rounded-2xl p-4 shadow-lg text-center max-w-[280px]">
                <p className="text-sm font-bold text-[var(--text-1)] mb-2.5 flex items-center justify-center gap-1.5">
                  <span>🔒</span> Función exclusiva de Morshop Plus
                </p>
                <Link to="/dashboard/plus" className="inline-block w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all">
                  ✨ Mejorar mi plan
                </Link>
              </div>
            </div>
          )}
        </div>
      </motion.section>

      {/* 5. MÉTODOS DE PAGO */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }} className="bg-white rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4 mb-2">
          <div className="p-2 bg-[var(--surface-1)] rounded-lg text-[var(--brand)]"><CreditCard size={20} /></div>
          <h2 className="text-lg font-bold text-[var(--text-1)]">Métodos de Pago</h2>
        </div>
        
        <div>
          <label className="block text-sm font-bold text-[var(--text-1)] mb-4">¿Qué métodos aceptás?</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DEFAULT_METHODS.map(method => (
              <button
                key={method}
                type="button"
                onClick={() => handlePaymentToggle(method)}
                className={`p-3 rounded-xl border text-sm font-bold transition-all flex flex-col items-center justify-center gap-2 ${
                  (store.payment_methods || []).includes(method)
                    ? 'border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)] shadow-sm'
                    : 'border-[var(--border)] bg-[var(--surface-0)] text-[var(--text-2)] hover:border-[var(--border-strong)]'
                }`}
              >
                {method.toLowerCase().includes('efectivo') ? '💵' : method.toLowerCase().includes('mercado') ? '📲' : method.toLowerCase().includes('tarjeta') ? '💳' : '🏦'}
                <span className="text-center text-xs leading-tight">{method}</span>
              </button>
            ))}
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input type="checkbox" checked={useOtherPayment} onChange={e => { setUseOtherPayment(e.target.checked); if(!e.target.checked) setOtherPayment(''); }} className="w-4 h-4 rounded text-[var(--brand)] focus:ring-[var(--brand)]" />
              <span className="text-sm font-medium text-[var(--text-1)]">Otro método de pago</span>
            </label>
            {useOtherPayment && (
              <input type="text" value={otherPayment} onChange={e => setOtherPayment(e.target.value)} placeholder="Ej: Cuenta DNI, MODO, etc." className="w-full h-[48px] px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] focus:bg-white focus:border-[var(--brand)] outline-none transition-colors text-[var(--text-1)] font-medium" />
            )}
          </div>
        </div>
      </motion.section>

      {/* 6. WHATSAPP Y VENTAS */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.6 }} className="bg-white rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4 mb-2">
          <div className="p-2 bg-emerald-50 rounded-lg text-[var(--whatsapp)]"><MessageCircle size={20} /></div>
          <h2 className="text-lg font-bold text-[var(--text-1)]">Ventas por WhatsApp</h2>
        </div>
        
        <div>
          <label className="block text-sm font-bold text-[var(--text-1)] mb-1.5">Número de WhatsApp (con código de país)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-3)] font-bold">+</span>
            <input type="text" value={store.whatsapp_number || ''} onChange={e => setStore({...store, whatsapp_number: e.target.value.replace(/[^0-9]/g, '')})} className="w-full h-[48px] pl-8 pr-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] focus:bg-white focus:border-[var(--brand)] outline-none transition-colors text-[var(--text-1)] font-medium" placeholder="549112345678" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-[var(--text-1)] mb-1.5">Plantilla del mensaje de WhatsApp</label>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
            Escribí tu mensaje y usá los botones para insertar el nombre del producto y el precio automáticamente donde quieras.
          </p>
          <textarea
            ref={textareaRef}
            value={store.whatsapp_message_template || ''}
            onChange={e => setStore({...store, whatsapp_message_template: e.target.value})}
            className="w-full px-4 py-3 min-h-[100px] rounded-xl border border-[var(--border)] bg-[var(--surface-1)] focus:bg-white focus:border-[var(--brand)] outline-none transition-colors text-[var(--text-1)] font-medium resize-y"
            placeholder="Ej: Hola! Me interesa comprar..."
          ></textarea>
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <p style={{ fontSize: '12px', color: '#888', width: '100%', margin: 0, fontWeight: 600 }}>
              Tocá para insertar en el mensaje:
            </p>
            <button
              type="button"
              onClick={() => insertVariable('{{producto}}')}
              className="bg-[#f0fdf4] border-[1.5px] border-[#22c55e] text-[#16a34a] px-3 py-1.5 rounded-full text-[13px] font-bold hover:bg-[#dcfce7] transition-colors"
            >
              + Nombre del producto
            </button>
            <button
              type="button"
              onClick={() => insertVariable('{{precio}}')}
              className="bg-[#f0fdf4] border-[1.5px] border-[#22c55e] text-[#16a34a] px-3 py-1.5 rounded-full text-[13px] font-bold hover:bg-[#dcfce7] transition-colors"
            >
              + Precio
            </button>
          </div>

          <div className="mt-6 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-0)]">
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px', fontWeight: 600 }}>
              Vista previa del mensaje:
            </p>
            <div style={{ background: '#dcfce7', borderRadius: '12px 12px 12px 0', padding: '10px 14px', fontSize: '14px', color: '#1a1a1a', maxWidth: '100%', wordBreak: 'break-word', display: 'inline-block' }}>
              {(store.whatsapp_message_template || '')
                .replace('{{producto}}', 'Remera negra talle M')
                .replace('{{precio}}', '10000') || 'Tu mensaje aparecerá aquí...'}
            </div>
          </div>

          {planStatus.isPlus && (
            <div className="mt-6 p-4 rounded-xl border border-[var(--border)] bg-white shadow-sm">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="block font-bold text-[var(--text-1)] mb-0.5 text-sm">Formulario de pedido</span>
                  <span className="block text-[13px] text-[var(--text-2)] font-medium max-w-[90%]">El comprador completa su info antes de enviarte el pedido por WhatsApp</span>
                </div>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 shrink-0 ${store.order_form_enabled ? 'bg-[var(--green)]' : 'bg-[var(--border-strong)]'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${store.order_form_enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
                <input type="checkbox" checked={store.order_form_enabled || false} onChange={e => setStore({...store, order_form_enabled: e.target.checked})} className="hidden" />
              </label>
            </div>
          )}
        </div>
      </motion.section>

      {/* 7. BRANDING DE LA PLATAFORMA */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.7 }} className="bg-white rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] p-6 sm:p-8 relative overflow-hidden">
        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4 mb-6">
          <div className="p-2 bg-[var(--surface-1)] rounded-lg text-amber-500"><Sparkles size={20} /></div>
          <h2 className="text-lg font-bold text-[var(--text-1)]">Branding de la plataforma</h2>
        </div>
        
        <div className="flex flex-col gap-4">
          <label className="flex items-center justify-between p-4 border border-[var(--border)] rounded-xl cursor-not-allowed">
            <div>
              <span className="block font-bold text-[var(--text-1)] mb-0.5">Quitar branding de Morshop</span>
              <span className="block text-sm text-[var(--text-2)] font-medium">Oculta la leyenda "Creá tu tienda gratis en morshop.com" del footer de tu tienda</span>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${planStatus.isPlus ? 'bg-[var(--green)]' : 'bg-[var(--border-strong)]'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${planStatus.isPlus ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
          </label>
        </div>

        {/* Overlay de Bloqueo si es plan free */}
        {!planStatus.isPlus && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[1.5px] flex flex-col items-center justify-center z-20">
            <div className="bg-white border border-[var(--border)] rounded-2xl p-4 shadow-lg text-center max-w-[280px]">
              <p className="text-sm font-bold text-[var(--text-1)] mb-2.5 flex items-center justify-center gap-1.5">
                <span>🔒</span> Función exclusiva de Morshop Plus
              </p>
              <Link to="/dashboard/plus" className="inline-block w-full py-2 bg-gradient-to-r from-amber-50 to-orange-500 hover:opacity-95 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all">
                ✨ Mejorar mi plan
              </Link>
            </div>
          </div>
        )}
      </motion.section>

      {/* STICKY SAVE BUTTON */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-[var(--border)] z-50 md:sticky md:bottom-0 md:bg-transparent md:backdrop-blur-none md:border-t-0 md:p-0 md:mt-8">
        <button 
          type="submit" 
          disabled={saving} 
          className="w-full md:w-auto md:min-w-[240px] md:float-right h-[52px] bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white rounded-xl font-bold text-lg shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
        >
          <Save size={20} />
          <span id="save-btn-text">{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
        </button>
      </div>
    </form>
  );
}
