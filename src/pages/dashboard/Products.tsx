import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Edit2, Star, X, Upload, ImageIcon, Folder } from 'lucide-react';

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
      
      // Load products and categories in parallel
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
    
    // Sanitize numeric fields: if empty string, convert to null
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
      alert(`Error al guardar el producto: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  function openNew() {
    setEditingProduct({ name: '', description: '', price: '', original_price: '', category_id: '', available: true, image_url: '', is_featured: false });
    setIsModalOpen(true);
  }

  const featuredCount = products.filter(p => p.is_featured).length;

  if (loading) return <div className="text-[var(--text-tertiary)] font-medium p-2">Cargando productos...</div>;
  if (!store) return <div className="text-[var(--text-secondary)] p-2">Primero configurá tu tienda en "Mi Tienda".</div>;

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Productos</h1>
          <p className="text-[var(--text-secondary)] text-sm">
            {products.length} producto{products.length !== 1 ? 's' : ''} ·{' '}
            <span className="text-amber-600 font-medium">{featuredCount}/3 destacados</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center justify-center h-[44px] px-4 rounded-[4px] font-bold text-[14px] bg-[var(--surface-inset)] text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors shrink-0"
          >
            <Folder size={18} className="mr-2" />
            Categorías
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 h-[44px] tactile-btn font-bold text-[14px] text-white shrink-0"
            style={{ backgroundColor: 'var(--brand-dark)' }}
          >
            <Plus size={18} />
            Nuevo producto
          </button>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {products.length === 0 ? (
          <div className="tactile-card bg-[var(--surface-1)] p-8 text-center text-[var(--text-tertiary)]">
            <ImageIcon size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">Todavía no tenés productos.</p>
            <p className="text-xs mt-1">Tocá "Nuevo producto" para empezar.</p>
          </div>
        ) : products.map(p => (
          <div key={p.id} className="tactile-card bg-[var(--surface-1)] flex items-center gap-3 p-3 cursor-pointer">
            <div className="w-[64px] h-[64px] shrink-0 rounded-[3px] overflow-hidden bg-[var(--surface-inset)]">
              {p.image_url
                ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]"><ImageIcon size={20} /></div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-bold text-[14px] text-[var(--text-primary)] truncate">{p.name}</h3>
                {p.is_featured && <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded shrink-0">★ DEST.</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[15px] text-[var(--text-primary)]">${p.price}</span>
                {p.original_price && <span className="text-[12px] text-[var(--text-tertiary)] line-through">${p.original_price}</span>}
              </div>
              <span className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded ${p.available ? 'bg-emerald-50 text-emerald-700' : 'bg-[var(--surface-inset)] text-[var(--text-tertiary)]'}`}>
                {p.available ? '● Disponible' : '○ Pausado'}
              </span>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button onClick={() => handleToggleFeatured(p)} className={`w-[36px] h-[36px] flex items-center justify-center rounded transition-colors ${p.is_featured ? 'text-amber-500' : 'text-[var(--text-muted)] hover:text-amber-400'}`}>
                <Star size={16} fill={p.is_featured ? 'currentColor' : 'none'} />
              </button>
              <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="w-[36px] h-[36px] flex items-center justify-center rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDelete(p.id)} className="w-[36px] h-[36px] flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--color-destructive)] transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block tactile-card bg-[var(--surface-1)] overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="px-5 py-3 text-[12px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider w-[72px]">Foto</th>
              <th className="px-5 py-3 text-[12px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Nombre</th>
              <th className="px-5 py-3 text-[12px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Precio</th>
              <th className="px-5 py-3 text-[12px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Estado</th>
              <th className="px-5 py-3 text-[12px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-[var(--text-tertiary)] text-sm">
                  No tenés productos todavía. Creá el primero arriba.
                </td>
              </tr>
            ) : products.map(p => (
              <tr key={p.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-inset)] transition-colors">
                <td className="px-5 py-3">
                  <div className="w-[48px] h-[48px] rounded-[3px] overflow-hidden bg-[var(--surface-inset)]">
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]"><ImageIcon size={16} /></div>
                    }
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[14px] text-[var(--text-primary)]">{p.name}</span>
                    {p.is_featured && <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">★ DESTACADO</span>}
                  </div>
                  {p.description && <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5 truncate max-w-[240px]">{p.description}</p>}
                </td>
                <td className="px-5 py-3">
                  <span className="font-bold text-[15px] text-[var(--text-primary)]">${p.price}</span>
                  {p.original_price && <span className="text-[12px] text-[var(--text-tertiary)] line-through ml-2">${p.original_price}</span>}
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded ${p.available ? 'bg-emerald-50 text-emerald-700' : 'bg-[var(--surface-inset)] text-[var(--text-tertiary)]'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${p.available ? 'bg-emerald-500' : 'bg-neutral-400'}`}></span>
                    {p.available ? 'Disponible' : 'Pausado'}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleToggleFeatured(p)}
                      title={p.is_featured ? 'Quitar destacado' : 'Destacar'}
                      className={`w-[36px] h-[36px] flex items-center justify-center rounded transition-colors ${p.is_featured ? 'text-amber-500 bg-amber-50' : 'text-[var(--text-muted)] hover:text-amber-400 hover:bg-amber-50'}`}
                    >
                      <Star size={16} fill={p.is_featured ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => { setEditingProduct(p); setIsModalOpen(true); }}
                      className="w-[36px] h-[36px] flex items-center justify-center rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-inset)] transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="w-[36px] h-[36px] flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--color-destructive)] hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Product Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50" onClick={() => setIsModalOpen(false)}>
          <div
            className="bg-[var(--surface-1)] w-full md:w-[520px] rounded-t-[16px] md:rounded-[8px] flex flex-col max-h-[92vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Drag Handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-[40px] h-[4px] rounded-full bg-[var(--border-default)]"></div>
            </div>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
              <h2 className="font-bold text-[18px] text-[var(--text-primary)]">
                {editingProduct.id ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="w-[44px] h-[44px] flex items-center justify-center rounded-full text-[var(--text-tertiary)] hover:bg-[var(--surface-inset)] transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
              <div className="p-5 space-y-5">

                {/* Image Drop Zone */}
                <div>
                  <label className="block text-[13px] font-bold text-[var(--text-secondary)] mb-2">Imagen del producto</label>
                  <div
                    ref={dropRef}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`relative w-full rounded-[4px] border-2 border-dashed transition-colors overflow-hidden ${isDragging ? 'border-[var(--brand-primary)] bg-emerald-50' : 'border-[var(--border-default)]'}`}
                    style={{ minHeight: editingProduct.image_url ? 'auto' : '140px' }}
                  >
                    {editingProduct.image_url ? (
                      <div className="relative">
                        <img src={editingProduct.image_url} alt="Preview" className="w-full max-h-[200px] object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct, image_url: '' })}
                          className="absolute top-2 right-2 w-[32px] h-[32px] bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--text-tertiary)]">
                        <Upload size={24} />
                        <p className="text-[13px] font-medium">Arrastrá una imagen o hacé clic</p>
                        <p className="text-[11px]">JPG, PNG, WEBP</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={uploadingImage}
                    />
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <span className="text-[13px] font-bold text-[var(--text-secondary)]">Subiendo...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-[13px] font-bold text-[var(--text-secondary)] mb-2">Nombre del producto *</label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="morshop-input w-full h-[44px] px-3 text-[14px]"
                    placeholder="Ej: Remera oversize negra"
                    required
                  />
                </div>

                {/* Prices */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold text-[var(--text-secondary)] mb-2">Precio de venta *</label>
                    <input
                      type="number"
                      value={editingProduct.price}
                      onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                      className="morshop-input w-full h-[44px] px-3 text-[14px] font-bold"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-[var(--text-tertiary)] mb-2">
                      Precio original <span className="font-normal">(opcional)</span>
                    </label>
                    <input
                      type="number"
                      value={editingProduct.original_price || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, original_price: e.target.value ? parseFloat(e.target.value) : null })}
                      className="morshop-input w-full h-[44px] px-3 text-[14px]"
                      min="0"
                      step="0.01"
                      placeholder="Antes de oferta"
                    />
                  </div>
                </div>

                {/* Description and Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold text-[var(--text-secondary)] mb-2">Categoría <span className="font-normal text-[var(--text-tertiary)]">(opcional)</span></label>
                    <select
                      value={editingProduct.category_id || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                      className="morshop-input w-full h-[44px] px-3 text-[14px] bg-white"
                    >
                      <option value="">Sin categoría</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-[var(--text-secondary)] mb-2">Descripción <span className="font-normal text-[var(--text-tertiary)]">(opcional)</span></label>
                    <textarea
                      value={editingProduct.description || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="morshop-input w-full px-3 py-2.5 text-[14px] resize-none h-[44px]"
                      rows={1}
                      placeholder="Describí tu producto..."
                    />
                  </div>
                </div>

                {/* Availability toggle */}
                <label className="flex items-center justify-between p-4 border border-[var(--border-subtle)] rounded-[4px] cursor-pointer hover:bg-[var(--surface-inset)] transition-colors">
                  <div>
                    <span className="block font-bold text-[14px] text-[var(--text-primary)]">Disponible para venta</span>
                    <span className="block text-[12px] text-[var(--text-tertiary)]">Si está desactivado, se muestra como "Sin stock"</span>
                  </div>
                  <div className={`w-[44px] h-[26px] rounded-full p-0.5 transition-colors ${editingProduct.available ? 'bg-[var(--brand-primary)]' : 'bg-[var(--border-default)]'}`}>
                    <div className={`w-[22px] h-[22px] bg-white rounded-full transition-transform ${editingProduct.available ? 'translate-x-[18px]' : 'translate-x-0'}`}></div>
                  </div>
                  <input type="checkbox" checked={editingProduct.available} onChange={e => setEditingProduct({ ...editingProduct, available: e.target.checked })} className="hidden" />
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 px-5 py-4 border-t border-[var(--border-subtle)] bg-[var(--surface-1)] shrink-0 pb-8 md:pb-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-[44px] border border-[var(--border-default)] rounded-[4px] font-bold text-[14px] text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] transition-colors">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-[44px] tactile-btn font-bold text-[14px] text-white disabled:opacity-50"
                  style={{ backgroundColor: 'var(--brand-dark)' }}
                >
                  {saving ? 'Guardando...' : editingProduct.id ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Categories Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50" onClick={() => setIsCategoryModalOpen(false)}>
          <div
            className="bg-[var(--surface-1)] w-full md:w-[460px] rounded-t-[16px] md:rounded-[8px] flex flex-col max-h-[85vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-[40px] h-[4px] rounded-full bg-[var(--border-default)]"></div>
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
              <h2 className="font-bold text-[18px] text-[var(--text-primary)]">Categorías</h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="w-[44px] h-[44px] flex items-center justify-center rounded-full text-[var(--text-tertiary)] hover:bg-[var(--surface-inset)] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto no-scrollbar bg-[var(--surface-inset)] flex-1">
              {categories.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-tertiary)] text-[14px]">
                  No tenés categorías creadas.
                </div>
              ) : (
                <div className="bg-white border border-[var(--border-subtle)] rounded-[8px] overflow-hidden">
                  {categories.map((c, i) => {
                    const inUse = products.filter(p => p.category_id === c.id).length;
                    return (
                      <div key={c.id} className={`flex items-center justify-between p-3 ${i !== categories.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''}`}>
                        <div>
                          <span className="font-bold text-[14px] text-[var(--text-primary)] block">{c.name}</span>
                          <span className="text-[12px] text-[var(--text-tertiary)]">{inUse} productos</span>
                        </div>
                        <button
                          onClick={() => handleDeleteCategory(c.id)}
                          className="w-[36px] h-[36px] flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--color-destructive)] hover:bg-red-50 transition-colors"
                          title="Borrar categoría"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-[var(--border-subtle)] bg-white shrink-0 pb-8 md:pb-5">
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="Nombre de nueva categoría"
                  className="morshop-input flex-1 h-[44px] px-3 text-[14px]"
                  required
                />
                <button
                  type="submit"
                  disabled={savingCategory || !newCategoryName.trim()}
                  className="px-4 h-[44px] tactile-btn font-bold text-[14px] text-white disabled:opacity-50 shrink-0"
                  style={{ backgroundColor: 'var(--brand-dark)' }}
                >
                  Crear
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
