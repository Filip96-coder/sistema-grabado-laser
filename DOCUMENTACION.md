# Sistema Cloud RESTful — Gestión de Órdenes de Grabado Láser

**Stack:** MEAN (MongoDB · Express · Angular · Node.js)
**Versiones:** Node.js 24 · Angular CLI 21 · MongoDB Atlas · Express 5 · Mongoose 9

---

## Tabla de Contenidos

1. [Descripción del Sistema](#1-descripción-del-sistema)
2. [Arquitectura General](#2-arquitectura-general)
3. [Estructura de Carpetas](#3-estructura-de-carpetas)
4. [Modelo de Datos](#4-modelo-de-datos)
5. [Backend — API REST](#5-backend--api-rest)
   - 5.1 [Dependencias](#51-dependencias)
   - 5.2 [Variables de Entorno](#52-variables-de-entorno)
   - 5.3 [Endpoints CRUD](#53-endpoints-crud)
   - 5.4 [Endpoint de Informe XML](#54-endpoint-de-informe-xml)
   - 5.5 [Lógica del Informe](#55-lógica-del-informe)
6. [Frontend — Angular SPA](#6-frontend--angular-spa)
   - 6.1 [Dependencias y Stack](#61-dependencias-y-stack)
   - 6.2 [Rutas de la Aplicación](#62-rutas-de-la-aplicación)
   - 6.3 [Servicio HTTP](#63-servicio-http)
   - 6.4 [Componentes](#64-componentes)
7. [Instalación y Ejecución](#7-instalación-y-ejecución)
8. [Flujo de Datos Completo](#8-flujo-de-datos-completo)
9. [Decisiones de Diseño](#9-decisiones-de-diseño)
10. [Comandos de Referencia](#10-comandos-de-referencia)
11. [Despliegue Final](#11-despliegue-final)

---

## 1. Descripción del Sistema

Aplicación web SPA (Single Page Application) para gestionar órdenes de trabajo de grabado láser. Permite:

- **Registrar** órdenes con datos del cliente, objeto, material, parámetros del láser, estado y precio.
- **Consultar, editar y eliminar** órdenes desde una interfaz de tabla.
- **Generar un informe operativo en XML** que calcula el valor total facturado y el porcentaje de ejecución, agrupando los trabajos por material.

---

## 2. Arquitectura General

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│        FRONTEND             │        │          BACKEND             │
│     Angular 21 SPA          │        │    Node.js + Express 5       │
│   http://localhost:4200     │◄──────►│    http://localhost:3000     │
│                             │  HTTP  │                              │
│  ┌──────────────────────┐   │        │  ┌────────────────────────┐  │
│  │  ordenes-list        │   │        │  │  /api/ordenes  (CRUD)  │  │
│  │  orden-form          │   │        │  │  /api/informes/operacion│  │
│  │  informe-xml         │   │        │  └────────────────────────┘  │
│  └──────────────────────┘   │        │             │                │
└─────────────────────────────┘        │      Mongoose ODM            │
                                        │             │                │
                                        │  ┌──────────▼─────────────┐ │
                                        │  │    MongoDB Atlas        │ │
                                        │  │  (colección: ordenes)  │ │
                                        │  └────────────────────────┘ │
                                        └──────────────────────────────┘
```

---

## 3. Estructura de Carpetas

```
DISTRIBUIDAYPARALELA/
│
├── DOCUMENTACION.md                ← este archivo
│
├── backend/
│   ├── docs/
│   │   └── DOCUMENTACION.md        ← doc legacy (ver este archivo)
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js         ← conexión a MongoDB Atlas
│   │   ├── controllers/
│   │   │   ├── ordenes.controller.js    ← lógica CRUD
│   │   │   └── informes.controller.js   ← cálculos + parseo XML
│   │   ├── models/
│   │   │   └── OrdenTrabajo.js     ← schema y modelo Mongoose
│   │   ├── routes/
│   │   │   ├── ordenes.routes.js
│   │   │   └── informes.routes.js
│   │   └── app.js                  ← configuración Express (middleware, rutas)
│   ├── .env                        ← variables de entorno (NO subir a git)
│   ├── .env.example                ← plantilla de variables de entorno
│   ├── .gitignore
│   ├── package.json
│   └── server.js                   ← punto de entrada, arranca el servidor
│
└── frontend/
    └── src/
        ├── app/
        │   ├── models/
        │   │   └── orden.model.ts       ← interfaces TypeScript del dominio
        │   ├── services/
        │   │   └── ordenes.ts           ← servicio HTTP (CRUD + XML + estado edición)
        │   ├── components/
        │   │   ├── ordenes-list/
        │   │   │   ├── ordenes-list.ts
        │   │   │   ├── ordenes-list.html
        │   │   │   └── ordenes-list.css
        │   │   ├── orden-form/
        │   │   │   ├── orden-form.ts
        │   │   │   ├── orden-form.html
        │   │   │   └── orden-form.css
        │   │   └── informe-xml/
        │   │       ├── informe-xml.ts
        │   │       ├── informe-xml.html
        │   │       └── informe-xml.css
        │   ├── app.routes.ts            ← definición de rutas con lazy-loading
        │   ├── app.config.ts            ← providers: HttpClient, Router
        │   ├── app.ts                   ← componente raíz (navbar)
        │   ├── app.html
        │   └── app.css
        └── styles.css                   ← design system global (variables, botones, alertas)
```

---

## 4. Modelo de Datos

### Colección MongoDB: `ordentrabajo`

| Campo                        | Tipo    | Requerido | Validaciones / Notas                              |
|------------------------------|---------|-----------|---------------------------------------------------|
| `_id`                        | ObjectId| Auto      | Generado por MongoDB                              |
| `cliente`                    | String  | Sí        | `trim: true`                                      |
| `objeto`                     | String  | Sí        | Objeto físico a grabar                            |
| `material`                   | String  | Sí        | Ej: "Madera", "Acrílico", "Metal"                 |
| `parametros_laser.potencia`  | Number  | No        | Vatios (W), `min: 0`                              |
| `parametros_laser.velocidad` | Number  | No        | mm/s, `min: 0`                                    |
| `estado`                     | String  | No        | Enum: `Pendiente` (default) / `Terminado`         |
| `precio_cop`                 | Number  | Sí        | Precio en pesos colombianos, `min: 0`             |
| `createdAt`                  | Date    | Auto      | `timestamps: true` de Mongoose                    |
| `updatedAt`                  | Date    | Auto      | `timestamps: true` de Mongoose                    |

### Schema Mongoose (`backend/src/models/OrdenTrabajo.js`)

```js
const OrdenTrabajoSchema = new mongoose.Schema(
  {
    cliente:  { type: String, required: true, trim: true },
    objeto:   { type: String, required: true, trim: true },
    material: { type: String, required: true, trim: true },
    parametros_laser: {
      potencia:  { type: Number, min: 0 },
      velocidad: { type: Number, min: 0 },
    },
    estado: {
      type: String,
      enum: ['Pendiente', 'Terminado'],
      default: 'Pendiente',
    },
    precio_cop: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, versionKey: false }
);
```

### Interface TypeScript (`frontend/src/app/models/orden.model.ts`)

```ts
export interface ParametrosLaser {
  potencia?: number | null;
  velocidad?: number | null;
}

export interface OrdenTrabajo {
  _id?: string;
  cliente: string;
  objeto: string;
  material: string;
  parametros_laser?: ParametrosLaser;
  estado: 'Pendiente' | 'Terminado';
  precio_cop: number;
  createdAt?: string;
  updatedAt?: string;
}
```

---

## 5. Backend — API REST

### 5.1 Dependencias

| Paquete     | Versión   | Uso                                         |
|-------------|-----------|---------------------------------------------|
| `express`   | ^5.2.1    | Framework HTTP                              |
| `mongoose`  | ^9.6.1    | ODM para MongoDB                            |
| `cors`      | ^2.8.6    | Habilitar peticiones cross-origin (Angular) |
| `dotenv`    | ^17.4.2   | Variables de entorno desde `.env`           |
| `xml2js`    | ^0.6.2    | Serializar objetos JS → XML (`Builder`)     |
| `nodemon`   | (dev)     | Auto-restart del servidor en desarrollo     |

### 5.2 Variables de Entorno

Crea un archivo `.env` en `backend/` a partir de `.env.example`:

```env
PORT=3000
MONGODB_URI=mongodb+srv://<usuario>:<password>@cluster0.xxxxx.mongodb.net/laser_orders?retryWrites=true&w=majority
```

### 5.3 Endpoints CRUD

**Base URL:** `http://localhost:3000/api/ordenes`

| Método   | Ruta               | Descripción                | Código éxito |
|----------|--------------------|----------------------------|--------------|
| `GET`    | `/`                | Listar todas las órdenes   | `200`        |
| `POST`   | `/`                | Crear una nueva orden      | `201`        |
| `PUT`    | `/:id`             | Actualizar una orden       | `200`        |
| `DELETE` | `/:id`             | Eliminar una orden         | `200`        |

#### Body para POST / PUT

```json
{
  "cliente": "Juan Pérez",
  "objeto": "Llavero",
  "material": "Madera",
  "parametros_laser": {
    "potencia": 80,
    "velocidad": 300
  },
  "estado": "Pendiente",
  "precio_cop": 25000
}
```

#### Respuestas de error

```json
{ "error": "El cliente es requerido" }
```

Los errores de validación devuelven `400`; los errores internos devuelven `500`; "no encontrado" devuelve `404`.

### 5.4 Endpoint de Informe XML

**URL:** `GET http://localhost:3000/api/informes/operacion`
**Content-Type de respuesta:** `application/xml; charset=utf-8`

#### Ejemplo de respuesta

```xml
<?xml version="1.0" encoding="UTF-8"?>
<informe_operacion>
  <resumen>
    <total_ordenes>5</total_ordenes>
    <ordenes_terminadas>3</ordenes_terminadas>
    <ordenes_pendientes>2</ordenes_pendientes>
    <valor_total_cop>175000</valor_total_cop>
    <porcentaje_ejecutado>60%</porcentaje_ejecutado>
  </resumen>
  <materiales>
    <material nombre="Madera" cantidad="3">
      <trabajo id="664abc...">
        <cliente>Juan Pérez</cliente>
        <objeto>Llavero</objeto>
        <estado>Terminado</estado>
        <precio_cop>25000</precio_cop>
        <potencia_w>80</potencia_w>
        <velocidad_mm_s>300</velocidad_mm_s>
      </trabajo>
    </material>
    <material nombre="Acrílico" cantidad="2">
      <trabajo id="664def...">
        ...
      </trabajo>
    </material>
  </materiales>
</informe_operacion>
```

### 5.5 Lógica del Informe

Implementada en `backend/src/controllers/informes.controller.js`:

```
1. OrdenTrabajo.find().lean()
      ↓
2. Calcular métricas:
   - valorTotal          = Σ precio_cop
   - ordenesTerminadas   = filter(estado === 'Terminado').length
   - porcentajeEjecutado = (terminadas / total) × 100
      ↓
3. Agrupar por material con Array.reduce()
      ↓
4. Construir objeto JS con estructura jerárquica:
   { resumen: {...}, materiales: { material: [...] } }
      ↓
5. xml2js.Builder.buildObject(informeJSON)
      → string XML indentado
      ↓
6. res.set('Content-Type', 'application/xml').send(xmlString)
```

> **Nota sobre xml2js:** Los atributos XML (ej. `nombre="Madera"`) se declaran
> con la clave especial `$` en el objeto JS: `{ $: { nombre: 'Madera' } }`.

---

## 6. Frontend — Angular SPA

### 6.1 Dependencias y Stack

| Aspecto         | Tecnología / Decisión                              |
|-----------------|----------------------------------------------------|
| Framework       | Angular 21 — Standalone Components (sin NgModules) |
| Formularios     | `ReactiveFormsModule` + `FormBuilder`              |
| HTTP            | `HttpClient` + `provideHttpClient()` en config     |
| Estado reactivo | Signals (`signal()`, Angular nativo)               |
| Routing         | `provideRouter()` con lazy loading (`loadComponent`)|
| Estilos         | CSS puro con custom properties (`--var`)           |

### 6.2 Rutas de la Aplicación

| Ruta                   | Componente      | Descripción                       |
|------------------------|-----------------|-----------------------------------|
| `/ordenes`             | `OrdenesList`   | Tabla de todas las órdenes        |
| `/ordenes/nueva`       | `OrdenForm`     | Formulario de creación            |
| `/ordenes/editar/:id`  | `OrdenForm`     | Formulario de edición             |
| `/informe`             | `InformeXml`    | Visor del informe XML             |
| `**`                   | —               | Redirige a `/ordenes`             |

Todas las rutas usan **lazy loading**:

```ts
{
  path: 'ordenes',
  loadComponent: () =>
    import('./components/ordenes-list/ordenes-list').then(m => m.OrdenesList),
}
```

### 6.3 Servicio HTTP

**Archivo:** `frontend/src/app/services/ordenes.ts`
**Clase:** `Ordenes` (inyectable `providedIn: 'root'`)

| Método                        | HTTP              | URL                                | Notas                              |
|-------------------------------|-------------------|------------------------------------|-------------------------------------|
| `getOrdenes()`                | `GET`             | `/api/ordenes`                     |                                     |
| `crearOrden(payload)`         | `POST`            | `/api/ordenes`                     |                                     |
| `actualizarOrden(id, payload)`| `PUT`             | `/api/ordenes/:id`                 |                                     |
| `eliminarOrden(id)`           | `DELETE`          | `/api/ordenes/:id`                 |                                     |
| `getInformeXML()`             | `GET`             | `/api/informes/operacion`          | `{ responseType: 'text' }`          |
| `setOrdenEnEdicion(orden)`    | —                 | —                                  | Estado interno para edición         |
| `getOrdenEnEdicion()`         | —                 | —                                  | Lo consume `OrdenForm`              |
| `clearOrdenEnEdicion()`       | —                 | —                                  | Se llama tras guardar              |

> **Por qué `responseType: 'text'`:** Angular interpreta las respuestas con
> `Content-Type: application/xml` como texto. Sin esta opción, `HttpClient`
> intentaría parsear el XML como JSON y lanzaría un error de parseo.

### 6.4 Componentes

#### `OrdenesList` — Lista de órdenes

**Archivo:** `components/ordenes-list/ordenes-list.ts`

- Carga todas las órdenes al iniciar (`ngOnInit`).
- Muestra una tabla con badges de estado (`Pendiente` / `Terminado`).
- Botón **Editar**: guarda la orden en `Ordenes.setOrdenEnEdicion()` y navega a `/ordenes/editar/:id`.
- Botón **Eliminar**: muestra `confirm()` nativo y llama a `eliminarOrden()`.
- Estado manejado con signals: `ordenes`, `cargando`, `error`.

#### `OrdenForm` — Formulario crear/editar

**Archivo:** `components/orden-form/orden-form.ts`

- Detecta si está en modo edición leyendo `:id` del `ActivatedRoute`.
- En modo edición carga la orden desde `Ordenes.getOrdenEnEdicion()` y hace `patchValue`.
- Si el usuario recarga en modo edición (estado perdido), redirige a `/ordenes`.
- Usa `FormGroup` anidado para `parametros_laser`.
- Valida campos requeridos con `Validators.required` y `markAllAsTouched()` al intentar guardar.
- Tras guardar exitosamente llama `clearOrdenEnEdicion()` y navega a `/ordenes`.

```
FormGroup:
  ├── cliente       [required]
  ├── objeto        [required]
  ├── material      [required]
  ├── parametros_laser (FormGroup)
  │   ├── potencia  [optional]
  │   └── velocidad [optional]
  ├── estado        [required, default: 'Pendiente']
  └── precio_cop    [required, min: 0]
```

#### `InformeXml` — Visor XML

**Archivo:** `components/informe-xml/informe-xml.ts`

- Carga el informe automáticamente al iniciar (`ngOnInit`).
- Botón **Actualizar** para refrescar manualmente.
- Botón **Copiar XML** que usa `navigator.clipboard.writeText()` con feedback visual ("✓ Copiado" por 2 s).
- El XML se muestra en `<pre><code>{{ xmlContent() }}</code></pre>` con estilos de editor oscuro.
- El `<pre>` preserva el indentado que genera `xml2js.Builder` con `renderOpts: { pretty: true }`.

---

## 7. Instalación y Ejecución

### Prerrequisitos

- Node.js ≥ 18
- Cuenta en [MongoDB Atlas](https://cloud.mongodb.com) con un cluster activo
- Angular CLI: `npm install -g @angular/cli`

### Backend

```bash
cd backend

# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
copy .env.example .env
# Editar .env: completar MONGODB_URI con la cadena de Atlas

# 3. Ejecutar en desarrollo
npm run dev    # nodemon → http://localhost:3000

# 4. Ejecutar en producción
npm start      # node → http://localhost:3000
```

### Frontend

```bash
cd frontend

# 1. Instalar dependencias
npm install

# 2. Ejecutar en desarrollo
npm start      # ng serve → http://localhost:4200
```

### Levantar ambos simultáneamente

```
Terminal 1:  cd backend   && npm run dev
Terminal 2:  cd frontend  && npm start
```

Abrir el navegador en `http://localhost:4200`.

---

## 8. Flujo de Datos Completo

### Crear una orden

```
Usuario rellena OrdenForm
    → form.getRawValue() → payload JS
    → Ordenes.crearOrden(payload)
    → POST /api/ordenes (JSON)
    → ordenes.controller.js: OrdenTrabajo.create(req.body)
    → MongoDB guarda el documento
    → 201 { documento }
    → Angular navega a /ordenes
    → OrdenesList.cargarOrdenes() refresca la tabla
```

### Generar informe

```
Usuario visita /informe
    → InformeXml.ngOnInit() → cargarInforme()
    → Ordenes.getInformeXML()
    → GET /api/informes/operacion { responseType: 'text' }
    → informes.controller.js:
        OrdenTrabajo.find().lean()
        → cálculos (Σ precios, % ejecutado)
        → reduce() por material
        → xml2js.Builder.buildObject()
        → res.send(xmlString)
    → Angular recibe string XML
    → <pre><code>{{ xmlContent() }}</code></pre>
```

---

## 9. Decisiones de Diseño

### Backend

| Decisión | Razón |
|---|---|
| `.lean()` en la consulta del informe | Retorna POJOs en lugar de documentos Mongoose completos, reduciendo el uso de memoria en lecturas masivas |
| `xml2js.Builder` para generar XML | Librería madura con soporte nativo de atributos XML (clave `$`) sin necesidad de construir strings manualmente |
| `runValidators: true` en `findByIdAndUpdate` | Garantiza que las validaciones del schema apliquen también en actualizaciones (por defecto Mongoose las omite en updates) |
| Controladores separados de rutas | El controller contiene la lógica y el router solo registra las URL; facilita pruebas unitarias aisladas |
| `timestamps: true` en el schema | Agrega `createdAt`/`updatedAt` automáticamente; la lista de órdenes se ordena por `createdAt: -1` |

### Frontend

| Decisión | Razón |
|---|---|
| `responseType: 'text'` en el servicio | Sin esta opción, HttpClient falla al parsear `application/xml` como JSON |
| Estado de edición en el servicio (`_ordenEnEdicion`) | Alternativa simple a query params o un GET /ordenes/:id (que el backend no expone); el componente hace fallback con redirect si el estado se pierde por recarga |
| `<pre><code>` sin innerHTML | Evita `DomSanitizer.bypassSecurityTrustHtml()`; el indentado del XML generado por xml2js se preserva de forma nativa con el elemento `<pre>` |
| Signals en lugar de campos planos | Reactividad granular sin necesidad de `ChangeDetectionStrategy.OnPush` explícito |
| Lazy loading en todas las rutas | El bundle inicial descarga solo el shell + navbar; cada vista se carga bajo demanda |
| CSS puro con custom properties | Sin frameworks de UI externos; las variables en `:root` crean un design system centralizado y fácil de modificar |

---

## 10. Comandos de Referencia

### Scaffolding del proyecto (registro histórico)

```bash
# Instalar Angular CLI globalmente
npm install -g @angular/cli

# Crear proyecto Angular (fuera de la carpeta backend/)
ng new frontend --style=css --skip-tests --defaults

# Generar servicio y componentes
cd frontend
ng generate service services/ordenes --skip-tests
ng generate component components/ordenes-list --skip-tests
ng generate component components/orden-form --skip-tests
ng generate component components/informe-xml --skip-tests

# Instalar dependencias del backend
cd ../backend
npm install express mongoose cors dotenv xml2js
npm install --save-dev nodemon
```

### Scripts disponibles

| Directorio   | Comando        | Descripción                          |
|--------------|----------------|--------------------------------------|
| `backend/`   | `npm run dev`  | Servidor con nodemon (hot-reload)    |
| `backend/`   | `npm start`    | Servidor en modo producción          |
| `frontend/`  | `npm start`    | `ng serve` en `localhost:4200`       |
| `frontend/`  | `npm run build`| Build de producción en `dist/`       |

### Probar la API con curl

```bash
# Crear una orden
curl -X POST http://localhost:3000/api/ordenes \
  -H "Content-Type: application/json" \
  -d '{"cliente":"Ana López","objeto":"Placa","material":"Acrílico","parametros_laser":{"potencia":60,"velocidad":200},"precio_cop":45000}'

# Listar todas las órdenes
curl http://localhost:3000/api/ordenes

# Obtener informe XML
curl http://localhost:3000/api/informes/operacion
```

---

## 11. Despliegue Final

### ¿Qué se hizo?

Se realizó la transición de un entorno de desarrollo local a una **arquitectura FullStack distribuida en la nube**, compuesta por tres pilares:

| Pilar | Plataforma | Acción |
|---|---|---|
| **Backend (API)** | Render | Se desplegó el servidor Node.js configurando el entorno de ejecución y gestionando las variables de entorno para la conexión segura a la base de datos |
| **Frontend (SPA)** | Vercel | Se desplegó la aplicación Angular configurando reglas de redirección para evitar errores de navegación y conectar con el backend de forma transparente |
| **Base de Datos** | MongoDB Atlas | Se migró el almacenamiento a un clúster profesional configurando la IP Access List para permitir conexiones globales desde los servidores dinámicos de Render |

**Integración:** Los tres servicios se conectan mediante un proxy definido en `vercel.json` que permite al frontend consultar órdenes y generar informes XML sin exponer directamente la URL del backend.

---

### ¿Para qué se hizo?

El propósito principal fue **profesionalizar la operación del emprendimiento de grabado láser**:

- **Persistencia de Datos:** Las órdenes de clientes se guardan permanentemente en la nube y no se pierden al cerrar el programa o reiniciar el servidor.
- **Accesibilidad Móvil:** El sistema es accesible desde cualquier dispositivo con internet — útil para consultar el estado de los trabajos en campo (material, potencia, velocidad) sin necesidad de estar en el computador.
- **Automatización Administrativa:** La generación del informe XML con cálculos de totales y porcentajes de avance facilita el seguimiento contable y operativo del negocio.
- **Continuidad de Servicio:** Al estar en la nube, el sistema opera de forma independiente al equipo local; un corte de luz o reinicio de PC no afecta la disponibilidad.

---

### ¿Por qué se eligió de esa manera?

| Componente | Elección | Razón Técnica |
|---|---|---|
| **Infraestructura** | Render + Vercel | Plataformas líderes con CI/CD integrado: cada push a GitHub dispara un redeploy automático en minutos |
| **Host del servidor** | `0.0.0.0` | Configura el servidor para escuchar en todas las interfaces de red, requisito indispensable para que nubes públicas como Render detecten el puerto abierto |
| **Seguridad DB** | IP Access List `0.0.0.0/0` | Los servidores de Render tienen IPs dinámicas que cambian en cada deploy; el acceso universal en Atlas garantiza que nunca sean bloqueados por el firewall |
| **Rutas** | `vercel.json` | Redirige `/api/*` al backend en Render (proxy transparente) y todas las rutas internas a `index.html`, evitando los errores 404 propios de SPAs en recarga directa |
| **Stack MEAN** | MongoDB · Express · Angular · Node | Ecosistema JavaScript unificado: mismo lenguaje en frontend y backend, reduciendo la curva de aprendizaje y el tiempo de desarrollo |

---

### Arquitectura en producción

```
Usuario (navegador)
        │
        ▼
┌───────────────────┐
│      Vercel       │  ← Frontend Angular (SPA)
│  (CDN global)     │
│                   │
│  vercel.json      │
│  /api/* ──────────┼──────────────────────────────┐
│  /*    → index.html                              │
└───────────────────┘                              │
                                                   ▼
                                       ┌───────────────────────┐
                                       │        Render         │
                                       │  Node.js + Express    │
                                       │  Puerto dinámico      │
                                       │  HOST: 0.0.0.0        │
                                       └───────────┬───────────┘
                                                   │
                                                   ▼
                                       ┌───────────────────────┐
                                       │    MongoDB Atlas      │
                                       │  Clúster profesional  │
                                       │  IP Access: 0.0.0.0/0 │
                                       └───────────────────────┘
```

---

### Estado actual

**El sistema está Live y operativo.**

| Servicio | URL | Estado |
|---|---|---|
| Frontend | URL de Vercel del proyecto | Activo |
| Backend API | `https://api-grabados-backend.onrender.com/api` | Activo |
| Base de datos | MongoDB Atlas (clúster en la nube) | Activo |

> **Nota:** Render en plan gratuito puede tener un tiempo de arranque en frío de ~30 segundos si el servidor estuvo inactivo. La primera petición puede tardar un poco más; las siguientes responden con normalidad.
