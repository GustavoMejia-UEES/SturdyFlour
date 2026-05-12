# 🏗️ Arquitectura Técnica y Stack Tecnológico: SturdyFlour

Este documento documenta el motor de ingeniería real sobre el que corre SturdyFlour. Hemos construido un ecosistema 100% Cloud-Native aprovechando la red "Edge" global para garantizar latencia cero y escalado infinito.

---

## ⚡ El Núcleo: Next.js App Router en Cloudflare Edge

SturdyFlour no corre en un servidor tradicional (VPS). Todo el backend y frontend corre en miles de servidores distribuidos alrededor del mundo usando el ecosistema de **Cloudflare Workers**.

### Decisiones Clave:
1. **React Server Components (RSC)**: El 80% de la lógica de datos (Auth, Listado de Cursos) se computa directamente en el Edge node más cercano al usuario, enviando solo HTML puro al cliente.
2. **Runtime: Edge**: En lugar de Node.js, forzamos `export const runtime = 'edge';` para que las APIs carguen en < 50ms y nunca sufran de "Cold Starts".

---

## 💾 Almacenamiento & Persistencia Distribuida

Hemos evitado las bases de datos SQL pesadas centralizadas. En su lugar, usamos la suite de storage nativa de Cloudflare:

### 1. Base de Datos: Cloudflare D1 (SQLite Serverless)
D1 provee consistencia global con SQL estándar, integrado nativamente en el motor de Cloudflare.
- **ORM**: Usamos **Drizzle ORM** para la máxima eficiencia tipada. A diferencia de Prisma, Drizzle no levanta motores secundarios, es código puro JS optimizado para el Edge.

> [!WARNING]
> **Límite Crítico de D1 & Edge Runtimes:** 
> En Cloudflare Edge, el uso de Queries Relacionales avanzadas de Drizzle (`db.query.assessments.findFirst()`) con sub-cláusulas dinámicas a veces provoca excepciones internas del parser (Error 500) debido al compilador de los Workers.
> **Regla Obligatoria**: En Server Actions o rutas con `export const runtime = 'edge'`, escribe queries utilizando la sintaxis SQL Atómica/Estándar:
> ```typescript
> // INCORRECTO (Riesgo de error 500 en el Edge)
> const test = await db.query.assessments.findFirst({ where: eq(assessments.id, id) });
> 
> // CORRECTO (100% Estable y Seguro en Edge)
> const [test] = await db.select().from(assessments).where(eq(assessments.id, id)).limit(1);
> ```

### 2. Archivos (PDFs & Multimedia): Cloudflare R2
R2 es una réplica compatible con AWS S3, pero con **Zero Egress Fees** (0 Costo por tráfico de descarga).
- Almacenamos los PDFs del repositorio de forma segura.
- Las APIs sirven los archivos mediante streams directos (`ReadableStream`) sin pasar por disco temporal, maximizando la memoria RAM (limitada a 128MB en Workers).

---

## 🧠 Inteligencia Artificial (Brain Center)

Para la evaluación dinámica de simulaciones, no usamos contenedores de IA pesados.
Utilizamos la API oficial de **Google Generative AI (Gemini 1.5 Flash)** por dos razones fundamentales:
1. **Velocidad Extrema**: Flash devuelve correcciones de preguntas abiertas en menos de 2 segundos.
2. **Context Window Gigante**: Permite que le enviemos rúbricas enteras de un examen sin degradar el rendimiento.

---

## 🔐 Autenticación y Criptografía del Edge

Implementamos un sistema de autenticación artesanal sin dependencias externas pesadas:
- **Hashing**: Usamos la API nativa de navegadores `crypto.subtle.pbkdf2` (Nativa en Node y Edge) para hashear contraseñas con 100,000 iteraciones.
- **Sesiones**: JWT (JSON Web Tokens) auto-contenidos y firmados asimétricamente almacenados en Cookies Seguras (HttpOnly).

---

## 📦 Flujo de Despliegue (CI/CD)

El proyecto utiliza GitHub Actions implícito con Cloudflare Pages:
1. El código se pushea a `main`.
2. `next-on-pages` compila la aplicación traduciendo las API Routes de Next.js en funciones Worker (`.js`).
3. El bundle se despliega automáticamente a la red global en < 90 segundos.
