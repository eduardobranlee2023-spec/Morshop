import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Edit2, Star, X, Upload, ImageIcon, Folder, LayoutGrid, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: storeData } = await supabase.from('stores').select('id').eq('user_id', user.id).single();
    if (storeData) {
      setStore(storeData);
      
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*').eq('store_id', storeData.id).order('created_at', { ascending: false }),
        supabase.from('store_categories').select('*').eq('store_id', storeData.id).order('name', { ascending: true })
      ]);
      
      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Borrar este producto?')) return;
    await supabase.from('products').delete().eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  async function handleToggleFeatured(product: any) {
    if (!product.is_featured && products.filter(p => p.is_featured).length >= 3) {
      alert('Máximo 3 productos destacados.');
      return;
    }
    await supabase.from('products').update({ is_featured: !product.is_featured }).eq('id', product.id);
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_featured: !p.is_featured } : p));
  }

  async function uploadFile(file: File) {
    if (!store) return;
    setUploadingImage(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${store.id}/${Math.random()}.${ext}`;
      const { error } = await supabase.storage.from('products').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('products').getPublicUrl(path);
      setEditingProduct((prev: any) => ({ ...prev, image_url: data.publicUrl }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadingImage(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) uploadFile(file);
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim() || !store) return;
    setSavingCategory(true);
    try {
      const { data, error } = await supabase.from('store_categories').insert([{ store_id: store.id, name: newCategoryName.trim() }]).select().single();
      if (error) throw error;
      setCategories([...categories, data]);
      setNewCategoryName('');
    } catch (err: any) {
      alert(`Error al crear categoría: ${err.message}`);
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleDeleteCategory(id: string) {
    const isInUse = products.some(p => p.category_id === id);
    if (isInUse) {
      alert('No podés borrar esta categoría porque tiene productos asignados.');
      return;
    }
    if (!confirm('¿Borrar esta categoría?')) return;
    try {
      const { error } = await supabase.from('store_categories').delete().eq('id', id);
      if (error) throw error;
      setCategories(categories.filter(c => c.id !== id));
    } catch (err: any) {
      alert(`Error al borrar: ${err.message}`);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!store) return;
    setSaving(true);
    
    const productData = { 
      ...editingProduct, 
      store_id: store.id,
      price: editingProduct.price === '' ? null : editingProduct.price,
      original_price: editingProduct.original_price === '' ? null : editingProduct.original_price,
      category_id: editingProduct.category_id || null
    };

    try {
      if (productData.id) {
        const { error } = await supabase.from('products').update(productData).eq('id', productData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert([productData]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Error al guardar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  function openNew() {
    setEditingProduct({ name: '', description: '', price: '', original_price: '', category_id: '', available: true, image_url: '', is_featured: false });
    setIsModalOpen(true);
  }

  const featuredCount = products.filter(p => p.is_featured).length;

  if (loading) return (
    <div className="flex justify-center items-center h-40">
      <div className="w-8 h-8 border-4 border-[var(--brand-light)] border-t-[var(--brand)] rounded-full animate-spin" />
    </div>
  );
  
  if (!store) return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 flex items-start gap-4">
      <AlertCircle className="text-amber-500 mt-1" />
      <div>
        <h3 className="font-bold text-amber-900 text-lg mb-1">Primero configurá tu tienda</h3>
        <p className="text-amber-800 text-sm">Necesitás guardar la configuración básica de tu tienda antes de poder subir productos.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-extrabold text-[var(--text-1)] mb-1 tracking-tight">Tus Productos</h1>
          <p className="text-[var(--text-2)] font-medium">
            {products.length} producto{products.length !== 1 ? 's' : ''} ·{' '}
            <span className="text-amber-600 font-bold">{featuredCount}/3 destacados</span>
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="flex items-center gap-3">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center justify-center h-[48px] px-5 rounded-xl font-bold text-sm bg-white border border-[var(--border-strong)] text-[var(--text-1)] hover:bg-[var(--surface-1)] shadow-sm transition-colors shrink-0 gap-2"
          >
            <Folder size={18} className="text-[var(--text-3)]" />
            Categorías
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-5 h-[48px] rounded-xl font-bold text-sm text-white bg-[var(--brand)] hover:bg-[var(--brand-dark)] shadow-[var(--shadow-sm)] hover:shadow-md transition-all shrink-0 hover:-translate-y-0.5"
          >
            <Plus size={18} />
            Nuevo producto
          </button>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
        {/* Mobile Cards */}
        <div className="flex flex-col gap-4 md:hidden">
          {products.length === 0 ? (
            <div className="bg-white border border-[var(--border)] rounded-2xl p-10 text-center shadow-[var(--shadow-sm)]">
              <div className="w-16 h-16 bg-[var(--surface-1)] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[var(--brand)]">
                <LayoutGrid size={32} />
              </div>
              <p className="text-lg font-bold text-[var(--text-1)] mb-2">Tu catálogo está vacío</p>
              <p className="text-sm text-[var(--text-2)] mb-6">Empezá a agregar tus productos para que tus clientes puedan comprar.</p>
              <button onClick={openNew} className="bg-[var(--brand)] text-white font-bold px-6 py-3 rounded-xl w-full">Crear mi primer producto</button>
            </div>
          ) : products.map(p => (
            <div key={p.id} className="bg-white border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] flex p-3 cursor-pointer hover:border-[var(--brand)]/30 transition-all group overflow-hidden">
              <div className="w-[84px] h-[84px] shrink-0 rounded-xl overflow-hidden bg-[var(--surface-1)] border border-[var(--border)] mr-4 relative">
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full flex items-center justify-center text-[var(--text-3)]"><ImageIcon size={24} /></div>
                }
                {!p.available && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center"><span className="text-[10px] font-bold text-[var(--text-2)] bg-white px-2 py-1 rounded-md shadow-sm">PAUSADO</span></div>}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-[15px] text-[var(--text-1)] truncate">{p.name}</h3>
                  {p.is_featured && <Star size={12} className="text-amber-500 shrink-0 fill-amber-500" />}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-extrabold text-base text-[var(--brand)]">${p.price}</span>
                  {p.original_price && <span className="text-xs text-[var(--text-3)] line-through font-medium">${p.original_price}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleToggleFeatured(p)} className={`text-xs font-bold transition-colors ${p.is_featured ? 'text-amber-500' : 'text-[var(--text-3)] hover:text-amber-500'}`}>
                    {p.is_featured ? 'Destacado' : 'Destacar'}
                  </button>
                  <span className="text-[var(--border-strong)]">•</span>
                  <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="text-xs font-bold text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors">Editar</button>
                  <span className="text-[var(--border-strong)]">•</span>
                  <button onClick={() => handleDelete(p.id)} className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors">Borrar</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white border border-[var(--border)] rounded-2xl shadow-[var(--shadow-sm)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[var(--surface-1)] border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-2)] uppercase tracking-wider w-[80px]">Foto</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">Producto</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">Precio</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-2)] uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-2)] uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="w-16 h-16 bg-[var(--surface-1)] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[var(--brand)]">
                      <LayoutGrid size={32} />
                    </div>
                    <p className="text-lg font-bold text-[var(--text-1)] mb-2">Tu catálogo está vacío</p>
                    <p className="text-sm text-[var(--text-2)]">Empezá a agregar tus productos arriba.</p>
                  </td>
                </tr>
              ) : products.map(p => (
                <tr key={p.id} className="hover:bg-[var(--surface-1)] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="w-[56px] h-[56px] rounded-xl overflow-hidden bg-[var(--surface-2)] border border-[var(--border)] relative">
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center text-[var(--text-3)]"><ImageIcon size={20} /></div>
                      }
                      {!p.available && <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px]" />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-[15px] text-[var(--text-1)]">{p.name}</span>
                      {p.is_featured && <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md shadow-sm">DESTACADO</span>}
                    </div>
                    {p.description && <p className="text-[13px] text-[var(--text-2)] truncate max-w-[300px] font-medium">{p.description}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-extrabold text-[16px] text-[var(--brand)]">${p.price}</span>
                    {p.original_price && <span className="text-[13px] text-[var(--text-3)] line-through ml-2 font-medium">${p.original_price}</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg ${p.available ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${p.available ? 'bg-emerald-500' : 'bg-neutral-400'}`}></span>
                      {p.available ? 'Disponible' : 'Pausado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleFeatured(p)}
                        title={p.is_featured ? 'Quitar destacado' : 'Destacar'}
                        className={`w-[40px] h-[40px] flex items-center justify-center rounded-xl transition-all ${p.is_featured ? 'text-amber-500 bg-amber-50' : 'text-[var(--text-3)] hover:text-amber-500 hover:bg-amber-50'}`}
                      >
                        <Star size={18} fill={p.is_featured ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={() => { setEditingProduct(p); setIsModalOpen(true); }}
                        className="w-[40px] h-[40px] flex items-center justify-center rounded-xl text-[var(--text-3)] hover:text-[var(--brand)] hover:bg-[var(--brand-light)] transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="w-[40px] h-[40px] flex items-center justify-center rounded-xl text-[var(--text-3)] hover:text-red-600 hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Product Modal */}
      <AnimatePresence>
        {isModalOpen && editingProduct && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 sm:p-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-[var(--text-1)]/40 backdrop-blur-sm" />
            
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full md:w-[600px] rounded-[32px] md:rounded-[24px] flex flex-col max-h-[92vh] md:max-h-[85vh] overflow-hidden relative z-10 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-center pt-4 pb-2 md:hidden">
                <div className="w-[48px] h-[6px] rounded-full bg-[var(--border-strong)]"></div>
              </div>

              <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
                <h2 className="font-extrabold text-xl text-[var(--text-1)]">
                  {editingProduct.id ? 'Editar producto' : 'Nuevo producto'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="w-[40px] h-[40px] flex items-center justify-center rounded-full text-[var(--text-2)] hover:bg-[var(--surface-1)] transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
                <div className="p-6 space-y-6">
                  {/* Dropzone */}
                  <div>
                    <label className="block text-sm font-bold text-[var(--text-1)] mb-2">Imagen del producto</label>
                    <div
                      ref={dropRef}
                      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`relative w-full rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden bg-[var(--surface-1)] flex items-center justify-center ${isDragging ? 'border-[var(--brand)] bg-[var(--brand-light)]' : 'border-[var(--border-strong)] hover:border-[var(--brand)]'}`}
                      style={{ minHeight: editingProduct.image_url ? 'auto' : '160px' }}
                    >
                      {editingProduct.image_url ? (
                        <div className="relative w-full">
                          <img src={editingProduct.image_url} alt="Preview" className="w-full max-h-[300px] object-cover" />
                          <button
                            type="button"
                            onClick={() => setEditingProduct({ ...editingProduct, image_url: '' })}
                            className="absolute top-3 right-3 w-[40px] h-[40px] bg-white/90 backdrop-blur shadow-sm rounded-full flex items-center justify-center text-red-600 hover:scale-105 transition-transform"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-[var(--text-2)] p-6">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-[var(--border)]">
                            <Upload size={20} className="text-[var(--brand)]" />
                          </div>
                          <p className="text-sm font-bold">Arrastrá una imagen o hacé clic</p>
                          <p className="text-xs text-[var(--text-3)] font-medium mt-1">Soporta JPG, PNG o WEBP</p>
                        </div>
                      )}
                      <input
                        type="file" accept="image/*"
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploadingImage}
                      />
                      {uploadingImage && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                           <div className="w-8 h-8 border-4 border-[var(--brand-light)] border-t-[var(--brand)] rounded-full animate-spin mb-2" />
                           <span className="text-sm font-bold text-[var(--brand)]">Subiendo imagen...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-bold text-[var(--text-1)] mb-1.5">Nombre del producto *</label>
                    <input type="text" value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} className="w-full h-[48px] px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] focus:bg-white focus:border-[var(--brand)] outline-none transition-colors text-[var(--text-1)] font-medium" placeholder="Ej: Remera oversize negra" required />
                  </div>

                  {/* Prices */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[var(--text-1)] mb-1.5">Precio *</label>
                      <input type="number" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })} className="w-full h-[48px] px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] focus:bg-white focus:border-[var(--brand)] outline-none transition-colors text-[var(--brand)] font-extrabold text-lg" min="0" step="0.01" placeholder="0.00" required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[var(--text-1)] mb-1.5">Precio anterior <span className="font-normal text-[var(--text-3)]">(opcional)</span></label>
                      <input type="number" value={editingProduct.original_price || ''} onChange={e => setEditingProduct({ ...editingProduct, original_price: e.target.value ? parseFloat(e.target.value) : null })} className="w-full h-[48px] px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] focus:bg-white focus:border-[var(--brand)] outline-none transition-colors text-[var(--text-1)] font-medium" min="0" step="0.01" placeholder="Antes de oferta" />
                    </div>
                  </div>

                  {/* Desc/Cat */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[var(--text-1)] mb-1.5">Categoría</label>
                      <select value={editingProduct.category_id || ''} onChange={e => setEditingProduct({ ...editingProduct, category_id: e.target.value })} className="w-full h-[48px] px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] focus:bg-white focus:border-[var(--brand)] outline-none transition-colors text-[var(--text-1)] font-medium appearance-none">
                        <option value="">Sin categoría</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[var(--text-1)] mb-1.5">Descripción</label>
                      <textarea value={editingProduct.description || ''} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} className="w-full px-4 py-3 min-h-[48px] h-[48px] rounded-xl border border-[var(--border)] bg-[var(--surface-1)] focus:bg-white focus:border-[var(--brand)] outline-none transition-colors text-[var(--text-1)] font-medium resize-none" rows={1} placeholder="Corta descripción..." />
                    </div>
                  </div>

                  {/* Availability */}
                  <label className="flex items-center justify-between p-5 border border-[var(--border)] rounded-2xl cursor-pointer hover:bg-[var(--surface-1)] transition-colors mt-2">
                    <div>
                      <span className="block font-bold text-base text-[var(--text-1)]">Disponible para venta</span>
                      <span className="block text-sm text-[var(--text-2)] font-medium">Si está desactivado, se muestra como "Sin stock"</span>
                    </div>
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${editingProduct.available ? 'bg-[var(--brand)]' : 'bg-[var(--border-strong)]'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${editingProduct.available ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                    <input type="checkbox" checked={editingProduct.available} onChange={e => setEditingProduct({ ...editingProduct, available: e.target.checked })} className="hidden" />
                  </label>
                </div>

                <div className="flex gap-3 px-6 py-5 border-t border-[var(--border)] bg-white shrink-0 mt-auto">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-[52px] bg-white border border-[var(--border-strong)] rounded-xl font-bold text-base text-[var(--text-1)] hover:bg-[var(--surface-1)] transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 h-[52px] rounded-xl font-bold text-base text-white bg-[var(--brand)] hover:bg-[var(--brand-dark)] transition-all shadow-[var(--shadow-sm)] hover:shadow-md disabled:opacity-50">
                    {saving ? 'Guardando...' : editingProduct.id ? 'Guardar cambios' : 'Crear producto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 sm:p-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCategoryModalOpen(false)} className="absolute inset-0 bg-[var(--text-1)]/40 backdrop-blur-sm" />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full md:w-[480px] rounded-[32px] md:rounded-[24px] flex flex-col max-h-[85vh] overflow-hidden relative z-10 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-center pt-4 pb-2 md:hidden">
                <div className="w-[48px] h-[6px] rounded-full bg-[var(--border-strong)]"></div>
              </div>

              <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
                <h2 className="font-extrabold text-xl text-[var(--text-1)]">Categorías</h2>
                <button onClick={() => setIsCategoryModalOpen(false)} className="w-[40px] h-[40px] flex items-center justify-center rounded-full text-[var(--text-2)] hover:bg-[var(--surface-1)] transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto no-scrollbar bg-[var(--surface-1)] flex-1">
                {categories.length === 0 ? (
                  <div className="text-center py-10 text-[var(--text-3)]">
                    <Folder size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-bold text-lg text-[var(--text-2)] mb-1">Sin categorías</p>
                    <p className="text-sm">Creá la primera categoría para organizar tu catálogo.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
                    {categories.map((c, i) => {
                      const inUse = products.filter(p => p.category_id === c.id).length;
                      return (
                        <div key={c.id} className={`flex items-center justify-between p-4 ${i !== categories.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                          <div>
                            <span className="font-bold text-base text-[var(--text-1)] block">{c.name}</span>
                            <span className="text-sm font-medium text-[var(--text-3)]">{inUse} productos</span>
                          </div>
                          <button onClick={() => handleDeleteCategory(c.id)} className="w-[40px] h-[40px] flex items-center justify-center rounded-xl text-[var(--text-3)] hover:text-red-600 hover:bg-red-50 transition-colors" title="Borrar categoría">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-[var(--border)] bg-white shrink-0">
                <form onSubmit={handleAddCategory} className="flex gap-3">
                  <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Ej: Remeras, Pantalones..." className="flex-1 h-[52px] px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] focus:bg-white focus:border-[var(--brand)] outline-none transition-colors text-[var(--text-1)] font-medium" required />
                  <button type="submit" disabled={savingCategory || !newCategoryName.trim()} className="px-6 h-[52px] rounded-xl font-bold text-white bg-[var(--brand)] hover:bg-[var(--brand-dark)] transition-all shadow-[var(--shadow-sm)] disabled:opacity-50 shrink-0">
                    Crear
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
