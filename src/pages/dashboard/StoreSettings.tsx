import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Image as ImageIcon, AlertTriangle, Eye, EyeOff, Palette, Info, MessageCircle, Save } from 'lucide-react';
import { motion } from 'framer-motion';

const FONTS = [
  { id: 'Inter', name: 'Inter (Moderna)' },
  { id: 'Playfair Display', name: 'Playfair (Elegante)' },
  { id: 'Nunito', name: 'Nunito (Amigable)' },
  { id: 'Oswald', name: 'Oswald (Llamativa)' },
  { id: 'Lato', name: 'Lato (Profesional)' },
];

const DEFAULT_METHODS = ['Efectivo', 'Transferencia', 'Mercado Pago', 'Débito / Crédito'];

export default function StoreSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [store, setStore] = useState<any>({
    name: '', slug: '', description: '', primary_color: '#1136EE', secondary_color: '#ffffff',
    whatsapp_number: '', whatsapp_message_template: 'Hola! Me interesa: {{producto}} - ${{precio}}',
    is_published: false, logo_url: '', banner_urls: [], announcement_text: '',
    font_family: 'Inter', catalog_layout: 'grid', about_text: '', payment_methods: []
  });

  const [uploadingLogo, setUploadingLogo] = useState(false);
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
        if (data.banner_url) parsedBanners = data.banner_url.trim().startsWith('[') ? JSON.parse(data.banner_url) : [data.banner_url];
      } catch (e) { parsedBanners = [data.banner_url]; }
      
      setStore({
        ...store, ...data, payment_methods: parsedMethods, banner_urls: parsedBanners,
        catalog_layout: data.catalog_layout || 'grid', font_family: data.font_family || 'Inter',
        primary_color: data.primary_color || '#1136EE', secondary_color: data.secondary_color || '#ffffff'
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
      announcement_text: store.announcement_text || '', logo_url: store.logo_url || '',
      banner_url: store.banner_urls && store.banner_urls.length > 0 ? JSON.stringify(store.banner_urls) : '',
      whatsapp_number: store.whatsapp_number || '', whatsapp_message_template: store.whatsapp_message_template || '',
      is_published: store.is_published, user_id: user.id,
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
        <p className="text-[var(--text-2)] font-medium">Personalizá tu catálogo para que refleje tu marca.</p>
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
                  onClick={() => setStore({...store, font_family: font.id})}
                  className={`p-4 rounded-xl text-left transition-all border ${store.font_family === font.id ? 'border-[var(--brand)] bg-[var(--brand-light)] shadow-sm' : 'border-[var(--border)] bg-[var(--surface-0)] hover:border-[var(--border-strong)]'}`}
                  style={{ fontFamily: font.id }}
                >
                  <span className="block text-[15px] font-bold text-[var(--text-1)] mb-1">{font.id}</span>
                  <span className={`block text-xs font-medium ${store.font_family === font.id ? 'text-[var(--brand)]' : 'text-[var(--text-3)]'}`}>Aa Bb Cc</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="mt-8 bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl p-5 md:p-8">
            <h3 className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-4 flex items-center gap-2"><Eye size={16}/> Vista Previa en Vivo</h3>
            <div 
              className="rounded-xl shadow-[var(--shadow-md)] overflow-hidden border border-[var(--border)] transition-all duration-300"
              style={{ backgroundColor: store.secondary_color || '#ffffff', fontFamily: store.font_family }}
            >
              {/* Fake Header */}
              <div className="px-6 py-5 flex items-center justify-between border-b border-black/5">
                <div className="flex items-center gap-3">
                  {store.logo_url && <img src={store.logo_url} alt="Logo" className="w-8 h-8 rounded-full object-cover border border-black/10" />}
                  <span className="font-bold text-xl" style={{ color: store.primary_color || '#1136EE' }}>{store.name || 'Mi Tienda'}</span>
                </div>
                <button 
                  type="button" 
                  className="px-5 py-2.5 rounded-lg font-bold text-white text-sm shadow-sm opacity-90 hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: store.primary_color || '#1136EE' }}
                >
                  Seguir
                </button>
              </div>
              {/* Fake Content */}
              <div className="p-6">
                <div className="w-3/4 h-8 rounded-lg mb-4" style={{ backgroundColor: store.primary_color, opacity: 0.1 }} />
                <div className="w-full h-4 rounded bg-black/5 mb-2" />
                <div className="w-5/6 h-4 rounded bg-black/5" />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 3. INFORMACIÓN GENERAL */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="bg-white rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] p-6 sm:p-8 space-y-6">
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
      </motion.section>

      {/* 4. WHATSAPP Y VENTAS */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }} className="bg-white rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] p-6 sm:p-8 space-y-6">
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
          <label className="block text-sm font-bold text-[var(--text-1)] mb-1.5">Plantilla de mensaje</label>
          <textarea value={store.whatsapp_message_template} onChange={e => setStore({...store, whatsapp_message_template: e.target.value})} className="w-full px-4 py-3 min-h-[100px] rounded-xl border border-[var(--border)] bg-[var(--surface-1)] focus:bg-white focus:border-[var(--brand)] outline-none transition-colors text-[var(--text-1)] font-medium resize-y"></textarea>
          <div className="flex gap-2 mt-3">
            <span className="text-xs font-mono font-bold bg-[var(--surface-2)] text-[var(--text-2)] px-2.5 py-1 rounded-md border border-[var(--border)]">{`{{producto}}`}</span>
            <span className="text-xs font-mono font-bold bg-[var(--surface-2)] text-[var(--text-2)] px-2.5 py-1 rounded-md border border-[var(--border)]">{`{{precio}}`}</span>
          </div>
        </div>
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
