# Sistema de Diseño: Morshop

Este documento establece las bases visuales y de interacción para la plataforma web de Morshop, asegurando consistencia, accesibilidad y una estética premium en toda la aplicación.

## 1. Identidad de Marca

- **Nombre:** Morshop
- **Propósito:** Plataforma de tiendas online (e-commerce) gratuita y premium.
- **Tono Visual:** Profesional, moderno, confiable y limpio. Similar a Shopify o plataformas de e-commerce de alto nivel.

## 2. Paleta de Colores

Se utilizan variables CSS para mantener la consistencia en toda la aplicación.

### Colores Principales (Brand)
- **Primary (Ámbar):** `#f59e0b` (Usado para acentos, elementos destacados y la marca Plan Plus).
- **Dark (Gris muy oscuro):** `#171717` (Usado para botones de acción principal, brindando un aspecto elegante y minimalista).

### Colores de Superficie (Fondos)
- **Surface 1 (Fondo principal):** `#ffffff` (Blanco puro para las tarjetas y áreas de contenido).
- **Surface Inset (Fondo secundario):** `#f9fafb` o `#f5f5f5` (Gris muy claro para fondos de pantalla, modales y áreas de separación).

### Colores de Texto
- **Text Primary:** `#171717` (Gris casi negro para máxima legibilidad).
- **Text Secondary:** `#525252` (Gris medio para subtítulos y descripciones).
- **Text Tertiary/Muted:** `#a3a3a3` (Gris claro para texto menos importante o placeholders).

### Colores Semánticos
- **Destructive/Error:** `#ef4444` (Rojo para eliminar elementos o errores).
- **Success:** `#10b981` (Verde esmeralda para estados de "Disponible" o éxito).
- **Warning:** `#f59e0b` (Ámbar para alertas o destacado de "Plan Plus").

## 3. Tipografía

- **Fuente Principal:** Sistema sans-serif predeterminado (`Inter`, `system-ui`, `-apple-system`, `BlinkMacSystemFont`).
- **Pesos:**
  - Regular (400): Texto de cuerpo.
  - Medium (500): Botones secundarios, etiquetas.
  - SemiBold (600) / Bold (700): Encabezados, botones principales, precios.

## 4. Componentes de UI

### Botones
- **Botón Principal (Primary):** Fondo negro (`var(--brand-dark)`), texto blanco, sin bordes, esquinas redondeadas (`rounded-md`), sombra suave. Transición de opacidad al pasar el cursor (`hover:opacity-90`).
- **Botón Secundario (Secondary):** Fondo blanco, borde gris claro (`border-neutral-200`), texto gris oscuro. Fondo gris muy claro al pasar el cursor (`hover:bg-neutral-50`).
- **Botones de Icono:** Cuadrados (ej. `36x36px`), fondo transparente o blanco, icono centrado, cambio de color/fondo en el hover.

### Tarjetas (Cards)
- **Estilo:** Fondo blanco, borde sutil (`border-neutral-200`), esquinas redondeadas (`rounded-lg` o `rounded-xl`), sombra suave (`shadow-sm`).
- **Tarjetas de Producto (Tienda):** Proporción de imagen `aspect-[4/5]`, imagen cubriendo el área (`object-cover`). El contenedor principal utiliza transiciones suaves en hover (efecto de "lift" o zoom en la imagen).

### Tablas y Listados
- **Encabezados:** Texto pequeño (`text-[12px]`), en mayúsculas (`uppercase`), fuente semibold, color gris.
- **Filas:** Fondo blanco, separación con borde inferior (`border-b border-neutral-100`), sutil cambio de fondo en hover (`hover:bg-neutral-50/50`).

### Modales
- **Fondo Oscuro:** Overlay negro con 50% de opacidad (`bg-black/50`).
- **Contenedor:** Fondo blanco, bordes redondeados (arriba en móviles `rounded-t-[16px]`, completo en desktop `rounded-[8px]`).
- **Scroll:** Contenido interno con scroll independiente (`overflow-y-auto`), ocultando la barra de scroll (`no-scrollbar`).

## 5. Diseño Responsivo (Mobile-First)

- **Dispositivo Principal (375px):** Todo el diseño debe funcionar perfectamente en pantallas móviles. Las tablas complejas se ocultan y se reemplazan por listas de tarjetas verticales.
- **Navegación Móvil:** Barras de navegación inferiores o menús hamburguesa. Los modales se anclan en la parte inferior de la pantalla.
- **Desktop (md: y superior):** Se expanden los componentes, aparecen menús laterales (sidebar) y las listas se transforman en tablas de datos completas.

## 6. Plan Plus (Aesthetics)
- **Colores Exclusivos:** Uso de gradientes (`bg-gradient-to-r from-amber-500 to-orange-500`) para textos y botones premium.
- **Fondos:** `bg-amber-50` con bordes `border-amber-200`.
- **Iconografía:** Uso del icono `Sparkles` para resaltar características premium.
