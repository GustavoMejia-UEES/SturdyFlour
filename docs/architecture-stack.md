# 🏗️ Arquitectura Técnica y Stack Tecnológico

Este documento desglosa las decisiones de ingeniería detrás de la infraestructura de alto rendimiento utilizada en este centro de mensajería.

---

## ⚡ El Núcleo: Bun 1.1 (The Speed Demon)
Todo el proyecto (tanto frontend como backend) corre bajo el entorno de ejecución de **Bun**. 
Hemos eliminado Node.js de la ecuación de producción por completo.
- **Instalación**: 10x más rápida que npm.
- **Ejecución Nativa de TS**: El backend corre directamente archivos `.ts` sin necesidad de transpilar (`tsc` o `babel`), eliminando fricción en el build.
- **File IO Extremo**: Usamos `Bun.file()` para entregar el frontend estático, lo cual es hasta 5x más rápido que un middleware de Express en Node.

---

## ⚙️ Backend: ElysiaJS (Framework Ultra-Rápido)
Elysia es un framework diseñado específicamente para Bun, aprovechando el motor HTTP nativo de alta velocidad.

### Conceptos Arquitectónicos Clave:
1. **Single Source Server**: El servidor no solo maneja API y WebSockets, sino que en Producción sirve los activos compilados de Next.js automáticamente. Esto simplifica el despliegue (1 solo contenedor Docker).
2. **WebSockets Nativos**: A diferencia de librerías pesadas, Elysia maneja WebSocket hooks integrados, procesando miles de conexiones concurrentes con una huella de memoria mínima.
3. **Transacciones Atómicas**: Cada mensaje entrante desde Webhooks de N8N abre una conexión segura al pool de PostgreSQL, inserta el registro y actualiza la sesión en una única unidad de trabajo (`BEGIN / COMMIT`).

---

## 🖼️ Frontend: Next.js 15 (React Framework)
Se eligió Next.js en modo **"Output Static Export"**.

### Razones del Static Export:
- **Seguridad**: Los archivos JS y HTML se generan en el build; no hay código de Node.js dinámico ejecutándose en el servidor del frontend que pueda ser hackeado.
- **Velocidad**: Carga instantánea.
- **Desacoplamiento**: El frontend es agnóstico de dónde está corriendo la API, resolviendo las rutas relativas de forma dinámica (`window.location`).

### Gestión de Estado: Zustand
En lugar de Redux (demasiado verboso) o Context API (provoca re-renders masivos), usamos **Zustand**.
- **Stores Ligeros**: `useChatStore.ts` contiene las sesiones y mensajes.
- **Prevención de Stale State**: Usamos `useChatStore.getState()` dentro de los eventos del WebSocket para asegurar que el código en tiempo real siempre lea los datos vivos, incluso fuera del ciclo de renders de React.

---

## 📊 Base de Datos: PostgreSQL + PG Pool
Usamos el driver `pg` nativo con pooling de conexiones activo para asegurar resiliencia.
- **Patrón UPSERT**: Para contadores de lectura (`chat_read_status`), usamos `INSERT ... ON CONFLICT DO UPDATE` para garantizar que nunca falle una escritura por registros faltantes.

---

## 🐳 Infraestructura: Docker Multi-Stage (Alpine)
Nuestra imagen de Docker es híbrida y ultra-optimizada:
1. **Fase 1 (Builder)**: Instala dependencias con Bun, compila el CSS y JS estático del frontend.
2. **Fase 2 (Production)**: Toma una imagen limpia de Alpine Linux con Bun, copia SOLO los archivos finales necesarios y levanta el backend.
- **Peso**: Extremadamente liviano.
- **Procesos**: Utiliza `dumb-init` para el manejo adecuado de señales de sistema Unix, garantizando que Docker pueda detener o reiniciar el contenedor limpiamente sin dejar procesos zombie.
