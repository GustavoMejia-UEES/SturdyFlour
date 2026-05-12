# 🎨 Guía Suprema de UI/UX: Identidad Neon-Cyber para SturdyFlour

Esta guía documenta el lenguaje visual "High-Fidelity Cyberpunk" desarrollado específicamente para la edición de la UEES. Sigue estos principios para replicar el diseño premium y envolvente del sistema.

---

## 🌌 1. Paleta de Colores y Atmósfera

El sistema ha migrado de una interfaz "limpia/académica" tradicional a una inmersión "Dark-Space" tecnológica.

### Colores Nucleares
- **Base Deep Black**: `#030712` (Slate 950). No usamos negro puro `#000`, preferimos un azul/gris ultra-profundo que soporta mejor las sombras y desenfoques.
- **Primario (The Logo Neon)**: `hsl(172, 90%, 35%)`. Un turquesa/cian neón eléctrico derivado de la criatura cyber de la marca.
- **Acento Secundario**: Púrpura vibrante (`purple-500`). Se utiliza exclusivamente para orbes de brillo ambiental y degradados dinámicos complementarios.

### Atmospheric Glow (Resplandor Ambiental)
Para dar profundidad al espacio oscuro, inyectamos "Luminous Orbs" en el fondo:
```tsx
<div className="absolute bg-cyan-500/20 rounded-full blur-[128px] pointer-events-none" />
<div className="absolute bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />
```
*Regla de Oro*: Nunca superes el `opacity-20` en estos orbes para mantener el contraste de texto elegible.

---

## 🧪 2. Visual Hierarchy & High Density Typography

### Tipografía Metálica/Neón
Los encabezados no son planos. Usamos `bg-clip-text` con degradados de alta intensidad:
- **Clase base**: `font-black tracking-tight leading-tight`
- **Degradado oficial**: `from-cyan-400 via-teal-300 to-purple-400`

### Cartas "High Density" de Cursos
Diseñadas para maximizar la información sin abrumar visualmente.
1. **Compactación Vertical**: El banner superior (`h-32`) consume espacio pero libera el resto para datos crudos.
2. **Background Watermark**: Colocamos el código del curso (`course.code`) al fondo de la cabecera, rotado 12 grados, escalado gigante (`text-7xl`) y con opacidad al 30%. Esto genera reconocimiento instantáneo sin ocupar espacio de grilla.
3. **Shadows & Hovers**: El `box-shadow` se aplica suavemente en reposo (`shadow-sm`), pero explota en el hover con una sombra translúcida coloreada (`hover:shadow-cyan-500/10`).

---

## ✨ 3. Glassmorphism & Navbars

El sistema visual trata el cristal oscuro como material primario para las barras fijas.
**Fórmula de la Navbar Premium:**
```tsx
className="border-b border-white/5 bg-[#030712]/90 backdrop-blur-xl sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.3)]"
```
- **Desenfoque**: `backdrop-blur-xl` es mandatorio para que los orbes ambientales se difuminen al hacer scroll.
- **Borde Fantasma**: El borde inferior es casi invisible (`border-white/5`). Es lo que separa un diseño amateur de uno premium.

---

## 🎞️ 4. Micro-Animaciones (Efecto "Vivo")

1. **Hover Expansion**: Los contenedores escalan y se elevan sutilmente (`hover:-translate-y-1.5 transition-all duration-500`).
2. **Glow Activation**: Al pasar el ratón sobre el logo o un CTA, el resplandor cian se intensifica mediante `group-hover:saturate-150`.
3. **Pulse Signals**: Los indicadores de IA usan `animate-pulse` suave para recordar que la máquina está procesando datos en segundo plano.

---

## 🎨 5. Aislamiento Visual & Acento Temático (Admin vs Simulador)

Para mantener la profesionalidad del espacio de edición y la inmersión interactiva del alumno, separamos estrictamente el uso de colores dinámicos:

### En el Panel Administrativo y Creador de Evaluaciones
- **Regla:** El panel de administración NUNCA debe heredar dinámicamente el color de acento de un curso para botones, bordes o fondos de UI primaria.
- **Estética:** Debe ser **estable, uniforme y neutral**. Usamos exclusivamente la paleta **Premium Indigo (`bg-indigo-600`)** en combinación con bordes definidos Slate 200 y fondos Slate 50. Esto previene variaciones incómodas que degraden la experiencia de trabajo del docente.

### En el Simulador del Alumno (`/simulation/[id]`)
- **Regla:** Aquí es mandatorio inyectar dinamismo y recordarle al estudiante su ubicación académica actual.
- **Banner Inmersivo (Top Bar):** Diseñamos un encabezado curvo (`rounded-[32px]`) de formato gigante pintado con el `themeColor` del curso de fondo, letras blancas de alto contraste y un patrón radial sutil (`radial-gradient` blanco translúcido al 15%).
- **Barra de Progreso Temática:** La barra horizontal interactiva se rellena dinámicamente con el color del curso usando estilos en línea en lugar de clases Tailwind estáticas:
  ```tsx
  style={{ backgroundColor: themeColor }}
  ```

---

## 🛠️ Checklist para Nuevas Pantallas

Para replicar este look exactamente:
1. ¿El fondo usa `#030712` o variables dinámicas HSL del tema?
2. ¿Los bordes tienen baja opacidad (`border-white/10` o similar)?
3. ¿Hay un balance claro entre el Cian Neón y el espacio oscuro?
4. ¿Las fuentes usan `tracking-tighter` para lucir compactas y modernas?
5. ¿Las pantallas administrativas usan Indigo estable y el simulador el color de acento dinámico del curso?

¡Sigue estos principios y mantendrás a SturdyFlour en la cima del diseño moderno! 🚀🥂
