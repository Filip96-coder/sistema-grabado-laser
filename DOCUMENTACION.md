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
   - 5.3 [Autenticación](#53-autenticación)
   - 5.4 [Endpoints CRUD](#54-endpoints-crud)
   - 5.5 [Endpoint de Admin](#55-endpoint-de-admin)
   - 5.6 [Endpoints de Informe XML](#56-endpoints-de-informe-xml)
   - 5.7 [Lógica del Informe](#57-lógica-del-informe)
6. [Frontend — Angular SPA](#6-frontend--angular-spa)
   - 6.1 [Dependencias y Stack](#61-dependencias-y-stack)
   - 6.2 [Rutas de la Aplicación](#62-rutas-de-la-aplicación)
   - 6.3 [Servicios HTTP](#63-servicios-http)
   - 6.4 [Guards e Interceptores](#64-guards-e-interceptores)
   - 6.5 [Componentes](#65-componentes)
7. [Instalación y Ejecución](#7-instalación-y-ejecución)
8. [Flujo de Datos Completo](#8-flujo-de-datos-completo)
9. [Decisiones de Diseño](#9-decisiones-de-diseño)
10. [Comandos de Referencia](#10-comandos-de-referencia)
11. [Despliegue Final](#11-despliegue-final)

---

## 1. Descripción del Sistema

Aplicación web SPA (Single Page Application) para gestionar órdenes de trabajo de grabado láser. Permite:

- **Autenticarse** mediante usuario y contraseña para acceder al sistema protegido.
- **Registrar** órdenes con datos del cliente, objeto, material, parámetros del láser, estado y precio.
- **Consultar, editar y eliminar** órdenes desde una interfaz de tabla.
- **Ver un panel administrativo** con métricas clave (totales, valor facturado, clientes y materiales activos) y las últimas 5 órdenes.
- **Generar informes operativos en XML:** uno agrupado por material y otro con el listado completo de órdenes.

---

## 2. Arquitectura General

```
┌──────────────────────────────────┐        ┌──────────────────────────────────┐
│           FRONTEND               │        │             BACKEND              │
│       Angular 21 SPA             │        │      Node.js + Express 5         │
│    http://localhost:4200         │◄──────►│      http://localhost:3000       │
│                                  │  HTTP  │                                  │
│  ┌────────────────────────────┐  │        │  ┌──────────────────────────┐    │
│  │  login-page                │  │        │  │  POST /api/auth/login    │    │
│  │  admin-page                │  │        │  │  GET  /api/auth/me       │    │
│  │  ordenes-list              │  │        │  │  GET  /api/admin/resumen │    │
│  │  orden-form                │  │        │  │  /api/ordenes  (CRUD)    │    │
│  │  informe-xml               │  │        │  │  /api/informes/operacion │    │
│  └────────────────────────────┘  │        │  │  /api/informes/ordenes   │    │
│                                  │        │  └──────────────────────────┘    │
│  AuthService + AuthInterceptor   │        │  requireAuth (middleware)        │
│  AuthGuard / GuestGuard          │        │             │                    │
└──────────────────────────────────┘        │      Mongoose ODM                │
                                             │             │                    │
                                             │  ┌──────────▼─────────────────┐ │
                                             │  │      MongoDB Atlas          │ │
                                             │  │   (colección: ordenes)     │ │
                                             │  └────────────────────────────┘ │
                                             └──────────────────────────────────┘
```

---

## 3. Estructura de Carpetas

```
DISTRIBUIDAYPARALELA/
│
├── DOCUMENTACION.md                ← este archivo
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js              ← conexión a MongoDB Atlas
│   │   ├── controllers/
│   │   │   ├── auth.controller.js       ← login y me (auth)
│   │   │   ├── admin.controller.js      ← resumen administrativo
│   │   │   ├── ordenes.controller.js    ← lógica CRUD
│   │   │   └── informes.controller.js   ← dos informes XML
│   │   ├── middleware/
│   │   │   └── auth.middleware.js       ← requireAuth (valida Bearer token)
│   │   ├── models/
│   │   │   └── OrdenTrabajo.js          ← schema y modelo Mongoose
│   │   ├── routes/
│   │   │   ├── auth.routes.js           ← POST /login, GET /me
│   │   │   ├── admin.routes.js          ← GET /resumen
│   │   │   ├── ordenes.routes.js
│   │   │   └── informes.routes.js
│   │   ├── utils/
│   │   │   └── auth.js                  ← JWT propio (HMAC-SHA256, sin librería)
│   │   └── app.js                       ← Express: middleware, rutas, requireAuth
│   ├── .env                             ← variables de entorno (NO subir a git)
│   ├── .env.example                     ← plantilla de variables de entorno
│   ├── package.json
│   └── server.js                        ← punto de entrada, arranca el servidor
│
└── frontend/
    └── src/
        ├── app/
        │   ├── models/
        │   │   ├── orden.model.ts        ← interfaces TypeScript del dominio
        │   │   └── auth.model.ts         ← SessionInfo, LoginResponse, AdminResumenResponse
        │   ├── services/
        │   │   ├── ordenes.ts            ← CRUD + dos XMLs + estado edición
        │   │   └── auth.service.ts       ← login, logout, token, getAdminResumen
        │   ├── guards/
        │   │   └── auth.guard.ts         ← authGuard (redirige a /login) y guestGuard
        │   ├── interceptors/
        │   │   └── auth.interceptor.ts   ← inyecta Bearer token; redirige en 401
        │   ├── components/
        │   │   ├── login-page/
        │   │   │   ├── login-page.ts
        │   │   │   ├── login-page.html
        │   │   │   └── login-page.css
        │   │   ├── admin-page/
        │   │   │   ├── admin-page.ts
        │   │   │   ├── admin-page.html
        │   │   │   └── admin-page.css
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
        │   ├── app.routes.ts             ← rutas con lazy-loading y guards
        │   ├── app.config.ts             ← providers: HttpClient + authInterceptor, Router
        │   ├── app.ts                    ← componente raíz (navbar)
        │   ├── app.html
        │   └── app.css
        └── styles.css                    ← design system global (variables, botones, alertas)
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

> El sistema de autenticación usa el módulo nativo `crypto` de Node.js — no requiere ninguna librería JWT externa.

### 5.2 Variables de Entorno

Crea un archivo `.env` en `backend/` a partir de `.env.example`:

```env
PORT=3000
MONGODB_URI=mongodb+srv://<usuario>:<password>@cluster0.xxxxx.mongodb.net/laser_orders?retryWrites=true&w=majority

# Autenticación
AUTH_USERNAME=admin
AUTH_PASSWORD=tu_password_seguro
AUTH_TOKEN_SECRET=clave_aleatoria_larga_y_segura
```

En **desarrollo**, si estas tres variables no están definidas, el sistema usa credenciales de fallback (`admin` / `admin1234`) automáticamente. En **producción** (`NODE_ENV=production`), las variables son obligatorias y el servidor rechaza las peticiones si faltan.

### 5.3 Autenticación

El sistema implementa autenticación basada en tokens con firma HMAC-SHA256, sin dependencias externas.

#### Cómo funciona

```
Cliente envía POST /api/auth/login { username, password }
      ↓
auth.controller.js valida credenciales con crypto.timingSafeEqual()
      ↓
Si válido → signToken(username):
   payload = { sub: username, exp: Date.now() + 12h }
   encodedPayload = base64url(JSON.stringify(payload))
   signature = HMAC-SHA256(encodedPayload, AUTH_TOKEN_SECRET)
   token = encodedPayload + '.' + signature
      ↓
Respuesta: { token, session: { username, role: 'admin' }, meta }
      ↓
Cliente guarda token en localStorage (key: 'laser-auth-session')
      ↓
Todas las peticiones siguientes incluyen: Authorization: Bearer <token>
      ↓
requireAuth middleware: verifica firma y expiración del token
```

#### Endpoints de autenticación

**Base URL:** `http://localhost:3000/api/auth`

| Método | Ruta      | Protegida | Descripción                           |
|--------|-----------|-----------|---------------------------------------|
| `POST` | `/login`  | No        | Autentica y devuelve token            |
| `GET`  | `/me`     | Sí        | Devuelve la sesión del token actual   |

**Body para POST /login:**
```json
{ "username": "admin", "password": "tu_password" }
```

**Respuesta exitosa:**
```json
{
  "token": "eyJ...",
  "session": { "username": "admin", "role": "admin" },
  "meta": { "usingFallbackCredentials": false }
}
```

**Rutas protegidas:** `/api/ordenes`, `/api/informes` y `/api/admin` requieren el header `Authorization: Bearer <token>`. Sin él, el servidor responde `401`.

### 5.4 Endpoints CRUD

**Base URL:** `http://localhost:3000/api/ordenes` _(requiere autenticación)_

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

### 5.5 Endpoint de Admin

**URL:** `GET http://localhost:3000/api/admin/resumen` _(requiere autenticación)_

Devuelve un resumen de métricas y las últimas 5 órdenes.

**Respuesta:**
```json
{
  "session": { "username": "admin", "role": "admin" },
  "metrics": {
    "total_ordenes": 12,
    "ordenes_terminadas": 8,
    "ordenes_pendientes": 4,
    "valor_total_cop": 480000,
    "clientes_activos": 5,
    "materiales_activos": 3
  },
  "latest_orders": [
    {
      "id": "664abc...",
      "cliente": "Juan Pérez",
      "objeto": "Llavero",
      "material": "Madera",
      "estado": "Terminado",
      "precio_cop": 25000
    }
  ]
}
```

### 5.6 Endpoints de Informe XML

Ambos endpoints requieren autenticación. **Content-Type de respuesta:** `application/xml; charset=utf-8`

#### GET `/api/informes/operacion` — Agrupado por material

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
  <ordenes_por_material>
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
  </ordenes_por_material>
</informe_operacion>
```

#### GET `/api/informes/ordenes` — Listado completo ordenado por fecha

```xml
<?xml version="1.0" encoding="UTF-8"?>
<informe_operacion>
  <resumen>...</resumen>
  <ordenes>
    <orden id="664abc...">
      <cliente>Juan Pérez</cliente>
      <objeto>Llavero</objeto>
      <material>Madera</material>
      <estado>Terminado</estado>
      <precio_cop>25000</precio_cop>
      <potencia_w>80</potencia_w>
      <velocidad_mm_s>300</velocidad_mm_s>
      <created_at>2024-05-13T10:00:00.000Z</created_at>
      <updated_at>2024-05-13T10:00:00.000Z</updated_at>
    </orden>
  </ordenes>
</informe_operacion>
```

### 5.7 Lógica del Informe

Implementada en `backend/src/controllers/informes.controller.js`. Ambos informes comparten la función `crearResumen()`:

```
1. OrdenTrabajo.find().lean()
      ↓
2. crearResumen(ordenes):
   - valorTotal          = Σ precio_cop
   - ordenesTerminadas   = filter(estado === 'Terminado').length
   - porcentajeEjecutado = (terminadas / total) × 100  [toFixed(2)]
      ↓
3a. /operacion → reduce() agrupa por material
    → { ordenes_por_material: { material: [...] } }
3b. /ordenes   → map() genera lista plana ordenada por createdAt DESC
    → { ordenes: { orden: [...] } }
      ↓
4. xml2js.Builder.buildObject(informeJSON)
      → string XML indentado (renderOpts: { pretty: true })
      ↓
5. res.set('Content-Type', 'application/xml').send(xmlString)
```

> **Nota sobre xml2js:** Los atributos XML (ej. `nombre="Madera"`) se declaran
> con la clave especial `$` en el objeto JS: `{ $: { nombre: 'Madera' } }`.

---

## 6. Frontend — Angular SPA

### 6.1 Dependencias y Stack

| Aspecto         | Tecnología / Decisión                                        |
|-----------------|--------------------------------------------------------------|
| Framework       | Angular 21 — Standalone Components (sin NgModules)          |
| Formularios     | `ReactiveFormsModule` + `FormBuilder`                        |
| HTTP            | `HttpClient` + `provideHttpClient(withInterceptors([...]))` |
| Estado reactivo | Signals (`signal()`, `computed()`, Angular nativo)           |
| Routing         | `provideRouter()` con lazy loading (`loadComponent`)         |
| Autenticación   | `AuthGuard`, `GuestGuard`, `AuthInterceptor`, `AuthService`  |
| Estilos         | CSS puro con custom properties (`--var`)                     |

### 6.2 Rutas de la Aplicación

| Ruta                   | Componente      | Guard         | Descripción                          |
|------------------------|-----------------|---------------|--------------------------------------|
| `` (raíz)              | —               | —             | Redirige a `/admin`                  |
| `/login`               | `LoginPage`     | `guestGuard`  | Formulario de login                  |
| `/admin`               | `AdminPage`     | `authGuard`   | Panel de métricas y últimas órdenes  |
| `/ordenes`             | `OrdenesList`   | `authGuard`   | Tabla de todas las órdenes           |
| `/ordenes/nueva`       | `OrdenForm`     | `authGuard`   | Formulario de creación               |
| `/ordenes/editar/:id`  | `OrdenForm`     | `authGuard`   | Formulario de edición                |
| `/informes`            | `InformeXml`    | `authGuard`   | Visor de informes XML                |
| `/informe`             | —               | —             | Redirige a `/informes`               |
| `**`                   | —               | —             | Redirige a `/ordenes`                |

Todas las rutas usan **lazy loading**:

```ts
{
  path: 'admin',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./components/admin-page/admin-page').then(m => m.AdminPage),
}
```

### 6.3 Servicios HTTP

#### `Ordenes` — CRUD y XML

**Archivo:** `frontend/src/app/services/ordenes.ts`
**Clase:** `Ordenes` (inyectable `providedIn: 'root'`)

La URL base se resuelve dinámicamente: `localhost` → `http://localhost:3000/api`, cualquier otro host → `/api` (proxy Vercel).

| Método                          | HTTP     | URL                              | Notas                              |
|---------------------------------|----------|----------------------------------|------------------------------------|
| `getOrdenes()`                  | `GET`    | `/api/ordenes`                   |                                    |
| `crearOrden(payload)`           | `POST`   | `/api/ordenes`                   |                                    |
| `actualizarOrden(id, payload)`  | `PUT`    | `/api/ordenes/:id`               |                                    |
| `eliminarOrden(id)`             | `DELETE` | `/api/ordenes/:id`               |                                    |
| `getInformeMaterialesXML()`     | `GET`    | `/api/informes/operacion`        | `{ responseType: 'text' }`         |
| `getInformeOrdenesXML()`        | `GET`    | `/api/informes/ordenes`          | `{ responseType: 'text' }`         |
| `setOrdenEnEdicion(orden)`      | —        | —                                | Estado interno para edición        |
| `getOrdenEnEdicion()`           | —        | —                                | Lo consume `OrdenForm`             |
| `clearOrdenEnEdicion()`         | —        | —                                | Se llama tras guardar              |

> **Por qué `responseType: 'text'`:** Angular interpreta las respuestas con
> `Content-Type: application/xml` como texto. Sin esta opción, `HttpClient`
> intentaría parsear el XML como JSON y lanzaría un error de parseo.

#### `AuthService` — Autenticación

**Archivo:** `frontend/src/app/services/auth.service.ts`
**Clase:** `AuthService` (inyectable `providedIn: 'root'`)

| Método                  | Descripción                                                           |
|-------------------------|-----------------------------------------------------------------------|
| `login(user, pass)`     | `POST /api/auth/login` → guarda token en `localStorage`              |
| `logout()`              | Elimina la sesión de `localStorage` y resetea la signal `session`    |
| `isAuthenticated()`     | `true` si hay token almacenado                                        |
| `obtenerToken()`        | Devuelve el token JWT o `null`                                        |
| `getUsername()`         | Devuelve el nombre de usuario de la sesión activa                     |
| `getAdminResumen()`     | `GET /api/admin/resumen` → devuelve métricas y últimas 5 órdenes     |

La sesión se persiste en `localStorage` con la clave `laser-auth-session` como `{ token, session }`.

### 6.4 Guards e Interceptores

#### Guards (`frontend/src/app/guards/auth.guard.ts`)

| Guard         | Comportamiento                                                          |
|---------------|-------------------------------------------------------------------------|
| `authGuard`   | Si no está autenticado, redirige a `/login`; si sí, permite el acceso  |
| `guestGuard`  | Si ya está autenticado, redirige a `/admin`; si no, permite el acceso  |

#### Interceptor (`frontend/src/app/interceptors/auth.interceptor.ts`)

El `authInterceptor` se registra en `app.config.ts` con `withInterceptors([authInterceptor])`. Su comportamiento:

1. Lee el token con `AuthService.obtenerToken()`.
2. Si hay token y la petición no es a `/auth/login`, clona el request añadiendo `Authorization: Bearer <token>`.
3. Si el servidor responde `401`, llama a `AuthService.logout()` y redirige a `/login`.

### 6.5 Componentes

#### `LoginPage` — Formulario de inicio de sesión

**Archivo:** `components/login-page/login-page.ts`

- Formulario reactivo con `username` y `password` (ambos requeridos).
- Al enviar llama a `AuthService.login()` y navega a `/admin` si tiene éxito.
- Muestra el mensaje de error devuelto por el backend en caso de credenciales inválidas.
- Estado con signals: `cargando`, `error`.

#### `AdminPage` — Panel administrativo

**Archivo:** `components/admin-page/admin-page.ts`

- Carga `AuthService.getAdminResumen()` al iniciar (`ngOnInit`).
- Muestra 5 tarjetas de métricas usando un `computed()` signal que transforma los datos de la API.
- Muestra una tabla con las últimas 5 órdenes.
- Usa `CurrencyPipe` para formatear `valor_total_cop`.
- Estado con signals: `cargando`, `error`, `resumen`.

```
metricas = computed(() => [
  { etiqueta: 'Ordenes totales',    valor: metrics.total_ordenes },
  { etiqueta: 'Terminadas',         valor: metrics.ordenes_terminadas },
  { etiqueta: 'Pendientes',         valor: metrics.ordenes_pendientes },
  { etiqueta: 'Clientes activos',   valor: metrics.clientes_activos },
  { etiqueta: 'Materiales activos', valor: metrics.materiales_activos },
])
```

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
- Permite alternar entre el informe por materiales (`getInformeMaterialesXML`) y el de órdenes (`getInformeOrdenesXML`).
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
# Editar .env: completar MONGODB_URI, AUTH_USERNAME, AUTH_PASSWORD y AUTH_TOKEN_SECRET

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

### Iniciar sesión

```
Usuario accede a /login → guestGuard verifica: no autenticado → permite acceso
    → LoginPage muestra formulario
    → Usuario ingresa username + password → entrar()
    → AuthService.login(username, password)
    → POST /api/auth/login { username, password }
    → auth.controller.js: validateCredentials() con timingSafeEqual()
    → Si válido: signToken() → HMAC-SHA256(payload, secret)
    → Respuesta: { token, session }
    → AuthService guarda { token, session } en localStorage
    → Angular navega a /admin
```

### Acceder a una ruta protegida

```
Usuario navega a /ordenes
    → authGuard: AuthService.isAuthenticated() → true → permite acceso
    → OrdenesList carga → Ordenes.getOrdenes()
    → authInterceptor clona request + agrega Authorization: Bearer <token>
    → GET /api/ordenes con header
    → requireAuth middleware: verifyToken() valida firma y expiración
    → ordenes.controller.js: OrdenTrabajo.find()
    → Respuesta 200 [ ...ordenes ]
    → Tabla renderizada en OrdenesList
```

### Sesión expirada

```
Token expirado (TTL 12 h)
    → Cualquier petición protegida
    → authInterceptor recibe 401
    → AuthService.logout() → elimina localStorage
    → Router.navigate(['/login'])
```

### Crear una orden

```
Usuario rellena OrdenForm
    → form.getRawValue() → payload JS
    → Ordenes.crearOrden(payload)
    → authInterceptor añade Bearer token
    → POST /api/ordenes (JSON)
    → ordenes.controller.js: OrdenTrabajo.create(req.body)
    → MongoDB guarda el documento
    → 201 { documento }
    → Angular navega a /ordenes
    → OrdenesList.cargarOrdenes() refresca la tabla
```

### Generar informe

```
Usuario visita /informes
    → InformeXml.ngOnInit() → cargarInforme()
    → Ordenes.getInformeMaterialesXML() o getInformeOrdenesXML()
    → authInterceptor añade Bearer token
    → GET /api/informes/operacion (o /ordenes) { responseType: 'text' }
    → informes.controller.js:
        OrdenTrabajo.find().lean()
        → crearResumen() (Σ precios, % ejecutado)
        → reduce() por material (operacion) o map() plano (ordenes)
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
| `crypto` nativo para tokens (sin JWT lib) | Elimina una dependencia externa; `HMAC-SHA256` + `base64url` ofrece la misma seguridad que jsonwebtoken para un solo rol |
| `crypto.timingSafeEqual()` para comparar credenciales | Previene ataques de temporización (timing attacks) que permitirían adivinar el password carácter a carácter |
| Credenciales de fallback solo en desarrollo | En `NODE_ENV=production` el servidor devuelve `500` si faltan las variables, evitando que un deploy incompleto quede con credenciales débiles en producción |
| Token TTL de 12 horas | Balance entre seguridad (tokens cortos) y usabilidad (no forzar re-login en una jornada laboral) |
| `requireAuth` como middleware en `app.js` | Centraliza la protección a nivel de ruta, no de controlador; agregar una nueva ruta protegida es una sola línea |
| `.lean()` en la consulta del informe | Retorna POJOs en lugar de documentos Mongoose completos, reduciendo el uso de memoria en lecturas masivas |
| `xml2js.Builder` para generar XML | Librería madura con soporte nativo de atributos XML (clave `$`) sin necesidad de construir strings manualmente |
| `runValidators: true` en `findByIdAndUpdate` | Garantiza que las validaciones del schema apliquen también en actualizaciones (por defecto Mongoose las omite en updates) |
| Controladores separados de rutas | El controller contiene la lógica y el router solo registra las URL; facilita pruebas unitarias aisladas |
| `timestamps: true` en el schema | Agrega `createdAt`/`updatedAt` automáticamente; la lista de órdenes se ordena por `createdAt: -1` |

### Frontend

| Decisión | Razón |
|---|---|
| Token en `localStorage` (no cookies) | Evita complejidad de CORS con `credentials: 'include'`; la SPA es el único consumidor del token |
| `authInterceptor` funcional (no clase) | Angular 17+ recomienda interceptores funcionales (`HttpInterceptorFn`); menor boilerplate que la clase `HttpInterceptor` |
| `guestGuard` en `/login` | Evita que un usuario ya autenticado vea el login; lo redirige automáticamente a `/admin` |
| `computed()` en `AdminPage.metricas` | Transforma el objeto `metrics` de la API en un array iterable con `@for`; se recalcula automáticamente si `resumen()` cambia |
| URL dinámica en servicios (`resolverApiUrl()`) | En `localhost` apunta directo al backend; en producción usa `/api` (proxy Vercel) sin necesidad de rebuilds ni variables de entorno en el frontend |
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
# 1. Iniciar sesión y obtener token (en desarrollo usa fallback admin/admin1234)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin1234"}'
# Guarda el token de la respuesta, ej: TOKEN=eyJ...

# 2. Crear una orden (requiere token)
curl -X POST http://localhost:3000/api/ordenes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"cliente":"Ana López","objeto":"Placa","material":"Acrílico","parametros_laser":{"potencia":60,"velocidad":200},"precio_cop":45000}'

# 3. Listar todas las órdenes
curl http://localhost:3000/api/ordenes \
  -H "Authorization: Bearer $TOKEN"

# 4. Panel administrativo
curl http://localhost:3000/api/admin/resumen \
  -H "Authorization: Bearer $TOKEN"

# 5. Informe XML por materiales
curl http://localhost:3000/api/informes/operacion \
  -H "Authorization: Bearer $TOKEN"

# 6. Informe XML listado de órdenes
curl http://localhost:3000/api/informes/ordenes \
  -H "Authorization: Bearer $TOKEN"
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
| Frontend | `https://sistema-grabado-laser-1ychfoedv-filip96-coders-projects.vercel.app/ordenes` | Activo |
| Backend API | `https://api-grabados-backend.onrender.com/api` | Activo |
| Base de datos | MongoDB Atlas (clúster en la nube) | Activo |

> **Nota:** Render en plan gratuito puede tener un tiempo de arranque en frío de ~30 segundos si el servidor estuvo inactivo. La primera petición puede tardar un poco más; las siguientes responden con normalidad.
