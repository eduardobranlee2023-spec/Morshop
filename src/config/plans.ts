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
    price: 4999, // en pesos argentinos — ajustar según decisión
    currency: 'ARS',
    billingPeriod: 'monthly',
    maxProducts: Infinity,
    features: [
      'Productos ilimitados',
      'Sin branding de Morshop',
      'Redes sociales en tu tienda',
      'Tipografías premium',
      'Soporte prioritario',
      'Estadísticas de visitas (próximamente)',
    ],
  }
} as const;

export type PlanType = 'free' | 'plus';

export const FREE_PRODUCT_LIMIT = 15;
