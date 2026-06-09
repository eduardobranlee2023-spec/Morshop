export const PLANS = {
  free: {
    name: 'Plan Gratuito',
    price: 0,
    currency: 'ARS',
    maxProducts: 15,
    features: [
      'Hasta 15 productos',
      'Colores y logo personalizados',
      'Carrito virtual',
      'Consultas por WhatsApp',
      'Link público de tu tienda',
      'Banner de portada',
    ],
    limitations: [
      'Máximo 15 productos',
      'Branding de Morshop en tu tienda',
      'Sin redes sociales en la tienda',
    ]
  },
  plus: {
    name: 'Morshop Plus',
    price: 18400,
    currency: 'ARS',
    billingPeriod: 'monthly',
    maxProducts: Infinity,
    features: [
      'Productos ilimitados',
      'Formulario de pedido avanzado',
      'Tipografías premium',
      'Hasta 2 imágenes por producto',
      'Estadísticas de tu tienda',
      'Estilos visuales avanzados',
      'Sin branding de Morshop',
      'Redes sociales en tu tienda',
    ],
  }
} as const;

export type PlanType = 'free' | 'plus';

export const FREE_PRODUCT_LIMIT = 15;
