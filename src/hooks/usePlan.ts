import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FREE_PRODUCT_LIMIT } from '../config/plans';

interface PlanStatus {
  plan: 'free' | 'plus';
  isPlus: boolean;
  productCount: number;
  canAddProduct: boolean;
  productsRemaining: number;
  planExpiresAt: string | null;
  loading: boolean;
}

export function usePlan(storeId: string | null) {
  const [status, setStatus] = useState<PlanStatus>({
    plan: 'free',
    isPlus: false,
    productCount: 0,
    canAddProduct: true,
    productsRemaining: FREE_PRODUCT_LIMIT,
    planExpiresAt: null,
    loading: true,
  });

  useEffect(() => {
    if (!storeId) return;

    async function fetchPlanStatus() {
      // Obtener datos del store
      const { data: store } = await supabase
        .from('stores')
        .select('plan, plan_expires_at')
        .eq('id', storeId)
        .single();

      // Contar productos
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId);

      const productCount = count || 0;
      const plan = store?.plan || 'free';
      const isPlus = plan === 'plus' && 
        (!store?.plan_expires_at || new Date(store.plan_expires_at) > new Date());
      
      const canAddProduct = isPlus || productCount < FREE_PRODUCT_LIMIT;
      const productsRemaining = isPlus 
        ? Infinity 
        : Math.max(0, FREE_PRODUCT_LIMIT - productCount);

      setStatus({
        plan,
        isPlus,
        productCount,
        canAddProduct,
        productsRemaining,
        planExpiresAt: store?.plan_expires_at || null,
        loading: false,
      });
    }

    fetchPlanStatus();
  }, [storeId]);

  return status;
}
