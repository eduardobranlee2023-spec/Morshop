import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Image as ImageIcon, AlertTriangle, Eye, EyeOff } from 'lucide-react';

const FONTS = [
  { id: 'Inter', name: 'Inter (Moderna)' },
  { id: 'Playfair Display', name: 'Playfair Display (Elegante)' },
  { id: 'Nunito', name: 'Nunito (Amigable)' },
  { id: 'Oswald', name: 'Oswald (Llamativa)' },
  { id: 'Lato', name: 'Lato (Profesional)' },
];

const DEFAULT_METHODS = ['Efectivo', 'Transferencia bancaria', 'Mercado Pago', 'Débito / Crédito'];

export default function StoreSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [store, setStore] = useState<any>({
    name: '', slug: '', description: '', primary_color: '#22c55e', secondary_color: '#ffffff',
    whatsapp_number: '', whatsapp_message_template: 'Hola! Me interesa: {{producto}} - ${{precio}}',
    is_published: false, logo_url: '', banner_urls: [], announcement_text: '',
    font_family: 'Inter', catalog_layout: 'grid', about_text: '', payment_methods: []
  });

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

  useEffect(() => { loadStore(); }, []);

  async function loadStore() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from('stores').select('*').eq('user_id', user.id).single();

    if (data) {
      let parsedMethods = [];
      try {
        if (data.payment_methods) {
          parsedMethods = typeof data.payment_methods === 'string' ? JSON.parse(data.payment_methods) : data.payment_methods;
        }
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
      } catch (e) {
        parsedBanners = [data.banner_url];
      }
      
      setStore({
        ...store, ...data, payment_methods: parsedMethods, banner_urls: parsedBanners,
        catalog_layout: data.catalog_layout || 'grid', font_family: data.font_family || 'Inter',
        primary_color: data.primary_color || '#22c55e', secondary_color: data.secondary_color || '#ffffff'
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
      if (currentBanners.length < 3) {
         setStore({ ...store, banner_urls: [...currentBanners, data.publicUrl] });
      }
    } catch (err: any) { alert(err.message); } finally { setUploadingBanner(false); }
  }

  const handlePaymentToggle = (method: string) => {
    const current = [...(store.payment_methods || [])];
    if (current.includes(method)) setStore({...store, payment_methods: current.filter(m => m !== method)});
    else setStore({...store, payment_methods: [...current, method]});
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    let finalMethods = [...(store.payment_methods || [])].filter((m: string) => DEFAULT_METHODS.includes(m));
    if (useOtherPayment && otherPayment.trim()) finalMethods.push(otherPayment.trim());

    // Only send the exact fields that exist in the stores table
    const payload = {
      name: store.name,
      slug: store.slug,
      description: store.description || '',
      primary_color: store.primary_color || '#22c55e',
      secondary_color: store.secondary_color || '#ffffff',
      font_family: store.font_family || 'Inter',
      catalog_layout: store.catalog_layout || 'grid',
      about_text: store.about_text || '',
      payment_methods: finalMethods,
      announcement_text: store.announcement_text || '',
      logo_url: store.logo_url || '',
      banner_url: store.banner_urls && store.banner_urls.length > 0 ? JSON.stringify(store.banner_urls) : '',
      whatsapp_number: store.whatsapp_number || '',
      whatsapp_message_template: store.whatsapp_message_template || '',
      is_published: store.is_published,
      user_id: user.id,
    };

    let saveError: any = null;

    console.log('[MORSHOP DEBUG] Store ID:', store.id);
    console.log('[MORSHOP DEBUG] Payload:', JSON.stringify(payload, null, 2));

    if (store.id) {
      const { data, error } = await supabase.from('stores').update(payload).eq('id', store.id).select();
      console.log('[MORSHOP DEBUG] UPDATE response data:', data);
      console.log('[MORSHOP DEBUG] UPDATE response error:', error);
      saveError = error;
    } else {
      const { data, error } = await supabase.from('stores').insert([payload]).select().single();
      console.log('[MORSHOP DEBUG] INSERT response data:', data);
      console.log('[MORSHOP DEBUG] INSERT response error:', error);
      if (data) setStore(data);
      saveError = error;
    }
    setSaving(false);
    
    const btn = document.getElementById('save-btn');
    if (btn) {
      if (saveError) {
        btn.innerText = 'Error al guardar';
        btn.style.backgroundColor = 'var(--color-destructive)';
      } else {
        btn.innerText = '¡Guardado con éxito!';
        btn.style.backgroundColor = '#10B981';
      }
      setTimeout(() => {
        btn.innerText = 'Guardar Cambios';
        btn.style.backgroundColor = '#1E293B';
      }, 2000);
    }
  }

  if (loading) return <div className="text-[var(--text-tertiary)] font-medium">Cargando configuración...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl pb-24 md:pb-12">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Configuración de Tienda</h1>
        <p className="text-[var(--text-secondary)] text-sm">Personalizá tu catálogo para que refleje tu marca.</p>
      </div>
      
      {/* 1. VISIBILIDAD */}
      <section className="bg-[var(--surface-1)] tactile-card p-6">
        <h2 className="text-[16px] font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-3 mb-5">Estado de la tienda</h2>
        
        <div className="flex flex-col gap-4">
          <label className="flex items-center justify-between p-4 border border-[var(--border-default)] rounded-[4px] cursor-pointer hover:bg-[var(--surface-inset)] transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-[48px] h-[28px] rounded-full p-1 transition-colors ${store.is_published ? 'bg-[var(--color-success)]' : 'bg-[var(--border-default)]'}`}>
                <div className={`w-[20px] h-[20px] bg-white rounded-full transition-transform ${store.is_published ? 'translate-x-[20px]' : 'translate-x-0'}`}></div>
              </div>
              <div>
                <span className="block font-bold text-[15px] text-[var(--text-primary)] mb-0.5">Tienda Pública</span>
                <span className="block text-[13px] text-[var(--text-secondary)]">Permite que tus clientes vean tu catálogo</span>
              </div>
            </div>
            {store.is_published ? <Eye className="text-[var(--color-success)]" /> : <EyeOff className="text-[var(--text-tertiary)]" />}
            <input type="checkbox" checked={store.is_published} onChange={e => setStore({...store, is_published: e.target.checked})} className="hidden" />
          </label>

          {!store.is_published && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 tactile-card border-amber-200 text-amber-800">
              <AlertTriangle size={20} className="shrink-0 mt-0.5" />
              <p className="text-[13px] font-medium leading-relaxed">
                Tu tienda es un borrador y <strong>no es visible para el público</strong>. Activá la opción de arriba cuando estés listo para recibir visitas.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 2. IDENTIDAD VISUAL */}
      <section className="bg-[var(--surface-1)] tactile-card p-6">
        <h2 className="text-[16px] font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-3 mb-5">Identidad Visual</h2>
        
        <div className="flex flex-col gap-6 mb-8">
          <div>
            <label className="block text-[14px] font-bold text-[var(--text-primary)] mb-3">Logo de la tienda</label>
            <div className="flex items-center gap-4">
              <div className="w-[80px] h-[80px] shrink-0 rounded-[4px] bg-[var(--surface-inset)] border border-[var(--border-default)] overflow-hidden flex items-center justify-center relative">
                {store.logo_url ? <img src={store.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <ImageIcon className="text-[var(--text-muted)]" size={32} />}
              </div>
              <div className="flex-1 max-w-[200px] relative">
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'logos', 'logo_url', setUploadingLogo)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploadingLogo} />
                <button type="button" className="w-full h-[40px] tactile-btn bg-[var(--surface-base)] text-[var(--text-primary)] font-bold text-[13px]">
                  {uploadingLogo ? 'Subiendo...' : 'Subir logo'}
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-[14px] font-bold text-[var(--text-primary)] mb-3">Banners (Portada 16:9) - Hasta 3 imágenes</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[0, 1, 2].map((index) => {
                const currentBanners = store.banner_urls || [];
                const url = currentBanners[index];
                
                return (
                  <div key={index} className="relative w-full aspect-video bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[4px] overflow-hidden flex items-center justify-center group">
                    {url ? (
                      <>
                        <img src={url} alt={`Banner ${index + 1}`} className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => {
                            const newBanners = [...currentBanners];
                            newBanners.splice(index, 1);
                            setStore({ ...store, banner_urls: newBanners });
                          }}
                          className="absolute top-1 right-1 bg-white/90 rounded-full p-1.5 shadow hover:bg-red-50 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </button>
                      </>
                    ) : (
                      <>
                        {index === currentBanners.length ? (
                          <div className="w-full h-full flex flex-col items-center justify-center relative hover:bg-[var(--surface-base)] transition-colors">
                            <ImageIcon className="text-[var(--text-muted)] mb-1" size={24} />
                            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Subir banner</span>
                            <input type="file" accept="image/*" onChange={handleBannerUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploadingBanner} />
                            {uploadingBanner && <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-[12px] font-bold text-[var(--text-primary)]">Subiendo...</div>}
                          </div>
                        ) : (
                          <div className="text-[var(--border-default)] opacity-50"><ImageIcon size={24} /></div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-[14px] font-bold text-[var(--text-primary)] mb-3">Color Primario</label>
            <div className="flex items-center gap-3">
              <div className="w-[44px] h-[44px] rounded-[4px] border border-[var(--border-default)] overflow-hidden shrink-0 relative">
                <input type="color" value={store.primary_color || '#22c55e'} onChange={e => setStore({...store, primary_color: e.target.value})} className="absolute -inset-2 w-[80px] h-[80px] cursor-pointer" />
              </div>
              <input type="text" value={store.primary_color || '#22c55e'} onChange={e => setStore({...store, primary_color: e.target.value})} className="morshop-input w-[100px] h-[44px] px-3 font-mono text-[13px]" />
            </div>
          </div>
          
          <div>
            <label className="block text-[14px] font-bold text-[var(--text-primary)] mb-3">Color Secundario (Fondo)</label>
            <div className="flex items-center gap-3">
              <div className="w-[44px] h-[44px] rounded-[4px] border border-[var(--border-default)] overflow-hidden shrink-0 relative">
                <input type="color" value={store.secondary_color || '#ffffff'} onChange={e => setStore({...store, secondary_color: e.target.value})} className="absolute -inset-2 w-[80px] h-[80px] cursor-pointer" />
              </div>
              <input type="text" value={store.secondary_color || '#ffffff'} onChange={e => setStore({...store, secondary_color: e.target.value})} className="morshop-input w-[100px] h-[44px] px-3 font-mono text-[13px]" />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-[14px] font-bold text-[var(--text-primary)] mb-3">Tipografía</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FONTS.map(font => (
              <button
                key={font.id}
                type="button"
                onClick={() => setStore({...store, font_family: font.id})}
                className={`p-3 tactile-card text-left transition-colors ${store.font_family === font.id ? 'border-[var(--brand-primary)] bg-emerald-50' : 'border-[var(--border-default)] hover:bg-[var(--surface-inset)]'}`}
                style={{ fontFamily: font.id }}
              >
                <span className="block text-[15px] font-bold text-[var(--text-primary)] mb-1">{font.id}</span>
                <span className="block text-[12px] text-[var(--text-tertiary)]">Ejemplo de texto</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[var(--surface-inset)] p-4 border border-[var(--border-subtle)] rounded-[4px]">
          <label className="block text-[12px] font-bold text-[var(--text-tertiary)] mb-3 uppercase tracking-wider">Vista Previa en Vivo</label>
          <div 
            className="p-4 tactile-card flex items-center justify-between" 
            style={{ backgroundColor: store.secondary_color || '#ffffff', borderColor: 'var(--border-subtle)', fontFamily: store.font_family }}
          >
            <span className="font-bold text-[16px]" style={{ color: store.primary_color || '#171717' }}>Tu Tienda</span>
            <button 
              type="button" 
              className="px-4 h-[36px] tactile-btn font-bold text-white text-[13px]"
              style={{ backgroundColor: store.primary_color || '#22c55e' }}
            >
              Agregar al carrito
            </button>
          </div>
        </div>
      </section>

      {/* 3. APARIENCIA / LAYOUT */}
      <section className="bg-[var(--surface-1)] tactile-card p-6">
        <h2 className="text-[16px] font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-3 mb-5">Apariencia</h2>
        <div>
          <label className="block text-[14px] font-bold text-[var(--text-primary)] mb-3">Diseño del Catálogo</label>
          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => setStore({...store, catalog_layout: 'grid'})}
              className={`p-4 tactile-card flex flex-col items-center gap-4 transition-colors ${store.catalog_layout === 'grid' ? 'border-[var(--brand-primary)] bg-emerald-50' : 'border-[var(--border-default)] hover:bg-[var(--surface-inset)]'}`}
            >
              <div className="w-[80px] h-[80px] bg-white border border-[var(--border-default)] rounded-[4px] grid grid-cols-2 gap-1 p-1">
                <div className="bg-[var(--surface-inset)] rounded-[2px]"></div><div className="bg-[var(--surface-inset)] rounded-[2px]"></div>
                <div className="bg-[var(--surface-inset)] rounded-[2px]"></div><div className="bg-[var(--surface-inset)] rounded-[2px]"></div>
              </div>
              <span className="font-bold text-[13px] text-[var(--text-primary)]">Grilla (Tarjetas)</span>
            </button>
            <button 
              type="button"
              onClick={() => setStore({...store, catalog_layout: 'list'})}
              className={`p-4 tactile-card flex flex-col items-center gap-4 transition-colors ${store.catalog_layout === 'list' ? 'border-[var(--brand-primary)] bg-emerald-50' : 'border-[var(--border-default)] hover:bg-[var(--surface-inset)]'}`}
            >
              <div className="w-[80px] h-[80px] bg-white border border-[var(--border-default)] rounded-[4px] flex flex-col gap-1.5 p-1.5">
                <div className="bg-[var(--surface-inset)] rounded-[2px] flex-1 flex gap-1"><div className="w-1/3 bg-[var(--border-subtle)] rounded-[2px]"></div><div className="flex-1 bg-[var(--surface-base)] rounded-[2px]"></div></div>
                <div className="bg-[var(--surface-inset)] rounded-[2px] flex-1 flex gap-1"><div className="w-1/3 bg-[var(--border-subtle)] rounded-[2px]"></div><div className="flex-1 bg-[var(--surface-base)] rounded-[2px]"></div></div>
              </div>
              <span className="font-bold text-[13px] text-[var(--text-primary)]">Lista (Compacto)</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. INFORMACIÓN DE LA TIENDA */}
      <section className="bg-[var(--surface-1)] tactile-card p-6 space-y-6">
        <h2 className="text-[16px] font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-3">Información General</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[14px] font-bold text-[var(--text-primary)] mb-1.5">Nombre de la Tienda</label>
            <input type="text" value={store.name} onChange={e => setStore({...store, name: e.target.value})} className="morshop-input w-full h-[44px] px-3 text-[14px]" placeholder="Ej: Mi Emprendimiento" required />
          </div>
          <div>
            <label className="block text-[14px] font-bold text-[var(--text-primary)] mb-1.5">Slug (Enlace)</label>
            <input type="text" value={store.slug} onChange={e => setStore({...store, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})} className="morshop-input w-full h-[44px] px-3 text-[14px]" placeholder="mi-emprendimiento" required />
            {store.slug && <p className="text-[12px] text-[var(--text-secondary)] mt-1.5 break-all">URL: <span className="text-[var(--brand-primary)] font-medium">morshop.com/tienda/{store.slug}</span></p>}
          </div>
        </div>
        
        <div>
          <label className="block text-[14px] font-bold text-[var(--text-primary)] mb-1.5">Eslogan o frase corta (Opcional)</label>
          <input type="text" value={store.description || ''} onChange={e => setStore({...store, description: e.target.value})} className="morshop-input w-full h-[44px] px-3 text-[14px]" placeholder="Lo mejor en diseño artesanal..." />
        </div>

        <div>
          <label className="block text-[14px] font-bold text-[var(--text-primary)] mb-1.5">Barra de anuncio superior (Opcional)</label>
          <input type="text" value={store.announcement_text || ''} onChange={e => setStore({...store, announcement_text: e.target.value})} className="morshop-input w-full h-[44px] px-3 text-[14px]" placeholder="Ej: ¡Envío gratis a partir de $50.000!" />
        </div>

        <div>
          <label className="block text-[14px] font-bold text-[var(--text-primary)] mb-1.5">Sobre nosotros (Aparece al final del catálogo)</label>
          <textarea value={store.about_text || ''} onChange={e => setStore({...store, about_text: e.target.value})} className="morshop-input w-full px-3 py-3 text-[14px] min-h-[100px] resize-y" placeholder="Contá un poco sobre tu marca, quién sos o cómo trabajás..."></textarea>
        </div>
      </section>

      {/* 5. PAGOS */}
      <section className="bg-[var(--surface-1)] tactile-card p-6 space-y-6">
        <h2 className="text-[16px] font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-3">Métodos de Pago</h2>
        <p className="text-[13px] text-[var(--text-secondary)] mb-4">Seleccioná los medios de pago que aceptás. Se mostrarán en tu tienda.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DEFAULT_METHODS.map(method => (
            <label key={method} className="flex items-center gap-3 p-3 tactile-card cursor-pointer hover:bg-[var(--surface-inset)]">
              <input type="checkbox" className="w-4 h-4 text-[var(--brand-primary)] border-[var(--border-default)] rounded" checked={(store.payment_methods || []).includes(method)} onChange={() => handlePaymentToggle(method)} />
              <span className="text-[14px] text-[var(--text-primary)] font-medium">{method}</span>
            </label>
          ))}
          <label className="flex items-center gap-3 p-3 tactile-card cursor-pointer hover:bg-[var(--surface-inset)]">
            <input type="checkbox" className="w-4 h-4 text-[var(--brand-primary)] border-[var(--border-default)] rounded" checked={useOtherPayment} onChange={(e) => setUseOtherPayment(e.target.checked)} />
            <span className="text-[14px] text-[var(--text-primary)] font-medium">Otro</span>
          </label>
        </div>
        {useOtherPayment && (
          <div className="mt-3">
            <input type="text" value={otherPayment} onChange={e => setOtherPayment(e.target.value)} placeholder="Ej: GoCuotas, Ualá, etc." className="morshop-input w-full h-[44px] px-3 text-[14px]" />
          </div>
        )}
      </section>

      {/* 6. WHATSAPP */}
      <section className="bg-[var(--surface-1)] tactile-card p-6 space-y-6">
        <h2 className="text-[16px] font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-3">WhatsApp y Ventas</h2>
        <div>
          <label className="block text-[14px] font-bold text-[var(--text-primary)] mb-1.5">Número de WhatsApp</label>
          <input type="text" value={store.whatsapp_number || ''} onChange={e => setStore({...store, whatsapp_number: e.target.value})} className="morshop-input w-full h-[44px] px-3 text-[14px]" placeholder="Ej: 549112345678" />
          <p className="text-[12px] text-[var(--text-tertiary)] mt-1.5">Incluí el código de país, sin el símbolo +. Solo números.</p>
        </div>
        <div>
          <label className="block text-[14px] font-bold text-[var(--text-primary)] mb-1.5">Plantilla del mensaje inicial</label>
          <textarea value={store.whatsapp_message_template} onChange={e => setStore({...store, whatsapp_message_template: e.target.value})} className="morshop-input w-full px-3 py-3 text-[14px] min-h-[100px] resize-y"></textarea>
          <div className="flex gap-2 mt-2">
            <span className="text-[11px] font-mono bg-[var(--surface-inset)] text-[var(--text-secondary)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">{`{{producto}}`}</span>
            <span className="text-[11px] font-mono bg-[var(--surface-inset)] text-[var(--text-secondary)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">{`{{precio}}`}</span>
          </div>
        </div>
        <div className="bg-[#e6f4ea] p-4 tactile-card border-[#cce8d6] mt-4">
          <label className="block text-[12px] font-bold text-[#137333] mb-2 uppercase tracking-wider">Así lo verás en tu WhatsApp</label>
          <div className="bg-white p-3 border-b-2 border-[#cce8d6] rounded-[4px] rounded-tl-none shadow-sm text-[14px] text-neutral-800 inline-block max-w-[90%]">
            {(store.whatsapp_message_template || '').replace('{{producto}}', 'Remera Oversize Negra').replace('{{precio}}', '15000')}
          </div>
        </div>
      </section>

      {/* STICKY SAVE BUTTON */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--surface-1)] border-t border-[var(--border-subtle)] z-50 md:sticky md:bottom-0 md:mt-8 md:bg-transparent md:border-t-0 md:p-0">
        <button 
          id="save-btn"
          type="submit" 
          disabled={saving} 
          className="w-full h-[50px] tactile-btn font-bold text-[16px] text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--brand-dark)' }}
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  );
}
