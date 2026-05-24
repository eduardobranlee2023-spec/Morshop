# Morshop — Documento de contexto del proyecto

## Qué es Morshop

Morshop es una plataforma web gratuita donde emprendedores argentinos pueden crear su propia tienda online personalizada. Es similar a Shopify pero completamente gratis para publicar una tienda. La monetización viene de un plan premium opcional (Morshop Plus) que desbloquea más capacidades.

## El problema que resuelve

Los emprendedores argentinos que venden por Instagram o Facebook no tienen tienda online porque:
- Shopify tiene un costo mensual en dólares que no quieren pagar
- Mercado Libre no respeta la identidad visual de la marca (todo se ve igual, blanco y amarillo)
- La mayoría no son técnicos y no saben cómo armar una tienda desde cero

Morshop soluciona esto: tienda gratis, con los colores y logo del vendedor, sin saber programar.

## El público objetivo

Emprendedores argentinos pequeños que venden por Instagram o Facebook. La mayoría vende ropa, accesorios, productos artesanales o comida. No son técnicos. Están acostumbrados a WhatsApp como canal de venta y comunicación. Buscan profesionalizar su negocio sin gastar dinero.

## Cómo funciona Morshop

### Para el vendedor
1. Se registra con email y contraseña (auth nativo de Supabase)
2. Crea su tienda: elige nombre, sube logo, define colores primario y secundario
3. Carga sus productos: foto, nombre, precio, descripción, disponibilidad
4. Opcionalmente organiza productos en categorías
5. Publica su tienda y obtiene un link público: `morshop.com/tienda/[slug]`
6. Configura su número de WhatsApp y un mensaje base para recibir consultas

### Para el comprador
- No necesita cuenta ni registro en Morshop
- Entra al link de la tienda del vendedor y ve el catálogo con la identidad visual de ese vendedor
- Al querer un producto hace clic en "Consultar por WhatsApp"
- Se abre WhatsApp con un mensaje pre-armado que incluye el nombre del producto y el precio
- El vendedor recibe la consulta con toda la info y cierra la venta por WhatsApp

### El CTA de WhatsApp
El botón de consulta genera una URL así:
```
https://wa.me/549XXXXXXXXXX?text=Hola!%20Me%20interesa%3A%20[nombre%20producto]%20-%20%24[precio].%20%C2%BFEst%C3%A1%20disponible%3F
```
El mensaje base lo puede personalizar el vendedor desde su panel. Morshop NO integra pagos — toda la transacción ocurre por fuera, entre vendedor y comprador directamente.

## Por qué no hay pagos integrados
Integrar pagos generaría desconfianza en el emprendedor (no quiere darle el dinero de su negocio a una plataforma). Además agrega complejidad legal y técnica innecesaria para el MVP. El foco es ser el puente entre el catálogo y WhatsApp, no reemplazar la venta.

## Stack técnico
- **Frontend y lógica de app**: construido con Antigravity
- **Base de datos y autenticación**: Supabase (via MCP)
- **Auth**: email + contraseña nativo de Supabase (sin OAuth externo)
- **WhatsApp CTA**: link `wa.me` estático generado en el frontend, sin API de WhatsApp

## Esquema de base de datos en Supabase

### `users`
Manejada por Supabase Auth. Solo se referencia desde otras tablas con el UUID del usuario autenticado.

### `stores`
| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Generado por Supabase |
| user_id | uuid FK | Referencia a auth.users |
| slug | text unique | URL de la tienda, ej: "remeraspaula" |
| name | text | Nombre visible de la tienda |
| description | text | Descripción breve opcional |
| logo_url | text | URL del logo subido |
| primary_color | text | Color principal en hex, ej: "#FF5733" |
| secondary_color | text | Color secundario en hex |
| whatsapp_number | text | Número con código de país, ej: "5491112345678" |
| whatsapp_message_template | text | Mensaje base editable por el vendedor |
| instagram_url | text nullable | URL del perfil de Instagram (solo plan Plus) |
| tiktok_url | text nullable | URL del perfil de TikTok (solo plan Plus) |
| facebook_url | text nullable | URL del perfil de Facebook (solo plan Plus) |
| is_published | boolean | Si la tienda es visible públicamente |
| plan | text | "free" o "plus" |
| created_at | timestamp | Auto |

### `products`
| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK | |
| store_id | uuid FK | Referencia a stores |
| category_id | uuid FK nullable | Referencia a store_categories |
| name | text | Nombre del producto |
| description | text | Descripción opcional |
| image_url | text | URL de la imagen |
| price | numeric | Precio en pesos |
| available | boolean | Si está disponible para consultar |
| display_order | int | Para reordenar productos |
| created_at | timestamp | Auto |

### `store_categories`
| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid PK | |
| store_id | uuid FK | Referencia a stores |
| name | text | Nombre de la categoría, ej: "Remeras" |
| display_order | int | Orden de aparición |

## Monetización (para el futuro, no el MVP)

Plan gratuito:
- Hasta 20 productos
- Personalización básica de colores y logo
- Branding de Morshop en el footer de la tienda

Plan Morshop Plus (suscripción mensual):
- Productos ilimitados
- Paleta de colores completa y fuentes
- Sin branding de Morshop en la tienda
- Redes sociales visibles en la tienda (Instagram, TikTok, Facebook)
- La URL sigue siendo morshop.com/tienda/[slug] — no hay dominios personalizados

## Crecimiento orgánico

Cada tienda pública tiene en el footer: "Creá tu tienda gratis en morshop.com". Cada comprador que visita la tienda de un vendedor ve Morshop. Eso genera nuevos vendedores sin gastar en publicidad.

## Prioridad de desarrollo

**Primero funcional, después bonito.**

Orden de construcción:
1. Auth con Supabase (registro e inicio de sesión)
2. Creación y edición de tienda (nombre, slug, colores, logo, WhatsApp)
3. Carga y gestión de productos
4. Tienda pública visible sin login con CTA de WhatsApp
5. Categorías de productos
6. Después de que todo funcione: diseño visual, animaciones, UX puli