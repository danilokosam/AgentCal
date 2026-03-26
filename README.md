# AgentCal

Sistema de agendamiento de citas impulsado por IA. Permite que agentes de lenguaje (como Claude) reserven, consulten y cancelen citas a través de una API REST o directamente mediante el protocolo MCP (Model Context Protocol). Incluye una interfaz web completa para gestión visual del calendario.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript (strict) |
| Base de datos | Supabase (PostgreSQL) |
| UI Components | shadcn/ui v4 (base-nova / @base-ui/react) |
| Estilos | Tailwind CSS v4 |
| Iconos | Lucide React |
| Toasts | Sonner |
| Fechas | date-fns |
| Protocolo para agentes | MCP 2024-11-05 sobre stdio |

---

## Arquitectura general

```
┌──────────────────────────────────────────────────────────────────┐
│                           CLIENTES                               │
│                                                                  │
│   Navegador Web              Claude Code / Agente IA             │
│   (interfaz React)           (Model Context Protocol)            │
└──────────┬───────────────────────────────┬───────────────────────┘
           │ fetch()                       │ JSON-RPC 2.0 (stdio)
           ▼                              ▼
┌──────────────────────┐    ┌─────────────────────────────┐
│   /app/api/          │    │   /mcp/server.ts             │
│   Endpoints REST     │    │   Servidor MCP               │
│   (Next.js routes)   │    │   JSON-RPC 2.0               │
└──────────┬───────────┘    └──────────────┬──────────────┘
           │                               │
           └──────────────┬────────────────┘
                          │  ambos llaman a
                          ▼
           ┌──────────────────────────────┐
           │   /services/                 │
           │   Lógica de negocio pura     │
           │   - Detección de conflictos  │
           │   - Cálculo de disponibilidad│
           │   - CRUD de citas            │
           └──────────────┬───────────────┘
                          │
                          ▼
           ┌──────────────────────────────┐
           │   /lib/supabase.ts           │
           │   Cliente de base de datos   │
           │   (anon key + service role)  │
           └──────────────┬───────────────┘
                          │
                          ▼
           ┌──────────────────────────────┐
           │   Supabase (PostgreSQL)      │
           │   businesses / staff /       │
           │   rooms / appointments       │
           │   + RLS activo               │
           └──────────────────────────────┘
```

---

## Estructura de carpetas

```
AgentCal/
│
├── app/                              ← Next.js App Router
│   ├── layout.tsx                      Raíz: Toaster (sonner) + TooltipProvider
│   ├── page.tsx                        Redirige / → /dashboard
│   ├── globals.css                     Tailwind v4 + CSS variables shadcn
│   │
│   ├── (dashboard)/                  ← Grupo de rutas con layout compartido
│   │   ├── layout.tsx                  Shell: Sidebar fija + <main> scrollable
│   │   ├── dashboard/page.tsx          KPI cards + CalendarGrid + botón Nueva Cita
│   │   ├── calendario/page.tsx         Vista de agenda a pantalla completa
│   │   ├── equipo/page.tsx             Cards del staff con estado Activo/Inactivo
│   │   ├── salas/page.tsx              Cards de salas con capacidad
│   │   └── configuracion/page.tsx      Info del negocio y estado del protocolo MCP
│   │
│   └── api/                          ← Endpoints HTTP REST
│       ├── appointments/
│       │   ├── route.ts                GET (listar) + POST (crear, anti-conflicto)
│       │   ├── [id]/route.ts           GET (detalle) + DELETE (cancelar)
│       │   └── availability/route.ts   GET → slots libres para fecha y duración
│       ├── staff/route.ts              GET (listar activos) + POST (crear)
│       └── rooms/route.ts              GET (listar activas) + POST (crear)
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx               Nav fija con active-link highlight (blue-600),
│   │   │                             logo mark y badge de versión
│   │   └── TopBar.tsx                Navegador de fecha ← Hoy → + CTA "Nueva Cita"
│   │
│   ├── dashboard/
│   │   ├── KpiCards.tsx              3 cards: Capacidad %, Citas del día, MCP Active
│   │   ├── CalendarGrid.tsx          Grid horas × doctores; citas como bloques azules;
│   │   │                             celdas vacías clickeables para pre-llenar el form
│   │   └── AppointmentBlock.tsx      Bloque azul con nombre + rango horario + Tooltip
│   │
│   └── appointments/
│       └── AppointmentFormDialog.tsx Dialog con form completo:
│                                     · <select> nativos (evita conflicto de portales
│                                       entre base-ui Select y Dialog)
│                                     · DatePicker: PopoverTrigger + Calendar
│                                     · Toast rojo en HTTP 409 (conflicto de agenda)
│                                     · Toast verde en éxito + refetch automático
│
├── hooks/
│   ├── useStaff.ts                   fetch + AbortController + timeout 5s + mounted flag
│   ├── useRooms.ts                   Ídem para salas
│   └── useAppointments.ts            Ídem para citas; acepta `date: Date` como param
│
├── lib/
│   ├── supabase.ts                   Cliente anon y admin (service role)
│   ├── dateUtils.ts                  isValidISODate, rangesOverlap, generateSlots…
│   ├── calendarUtils.ts              slotToRow, durationToRowSpan, generateTimeOptions…
│   ├── constants.ts                  BUSINESS_ID, HOURS_START/END, SLOT_MINUTES
│   └── utils.ts                      cn() helper (clsx + tailwind-merge)
│
├── services/
│   └── appointmentService.ts         checkConflicts, getAvailability, bookAppointment,
│                                     cancelAppointment, getAppointment, listAppointments
│
├── mcp/
│   ├── tools.ts                      6 tool definitions (JSON Schema)
│   └── server.ts                     Servidor MCP stdio (JSON-RPC 2.0)
│
├── types/
│   ├── database.ts                   Row types: BusinessRow, StaffRow, RoomRow, AppointmentRow
│   └── appointments.ts               Domain types: AvailabilityQuery, BookAppointmentInput…
│
├── supabase/migrations/
│   ├── 001_initial_schema.sql        Tablas, índices, trigger updated_at
│   ├── 002_rls.sql                   Row Level Security por business_id
│   └── 003_seed.sql                  Demo Clinic: 3 staff, 3 salas, 2 citas
│
├── .env.local.example                Variables necesarias (copiar a .env.local)
├── commit.txt                        Mensaje de commit detallado con todo el historial
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json                      Scripts: dev, build, start, lint, mcp
```

---

## Frontend — Vistas

### Dashboard (`/dashboard`)

La vista principal. Muestra el estado del día en tiempo real.

```
┌──────────────────────────────────────────────────────────────┐
│  TopBar: ← Miércoles 26 de marzo [Hoy] →    [+ Nueva Cita]  │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Capacidad Hoy│  │  Citas Hoy   │  │ Estado Sistema   │   │
│  │    85%  ████ │  │      3       │  │ ● MCP Active     │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
│                                                              │
│  Agenda del día                                              │
│  ┌────────┬──────────────────┬──────────────┬─────────────┐ │
│  │        │  Dr. Ana García  │ Dr. C. López │ L. Martínez │ │
│  │ 08:00  │                  │              │             │ │
│  │ 08:30  │                  │              │             │ │
│  │ 09:00  │ ┌──────────────┐ │              │             │ │
│  │        │ │ Consulta –   │ │              │             │ │
│  │        │ │ Daniel Prueba│ │              │             │ │
│  │        │ │ 09:00–09:30  │ │              │             │ │
│  │        │ └──────────────┘ │              │             │ │
│  │ 09:30  │                  │              │             │ │
│  └────────┴──────────────────┴──────────────┴─────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**KPI Cards:**
- **Capacidad Hoy** — porcentaje de slots confirmados vs. total posible (staff × 20 slots/día), con barra de progreso azul
- **Citas Hoy** — suma de citas confirmed + pending del día
- **Estado del Sistema** — badge verde con punto pulsante "MCP Active"

**CalendarGrid:**
- Filas: 20 slots de 30 min (08:00–18:00 UTC)
- Columnas: una por cada miembro del staff activo
- Citas: bloques `bg-blue-600` con nombre del paciente y horario
- Celdas vacías: hover azul claro, click abre el formulario pre-llenado con el doctor y hora seleccionados

### Formulario de Nueva Cita

Dialog modal con validación en cliente y servidor.

```
┌─────────────────────────────────┐
│  Nueva Cita                     │
├─────────────────────────────────┤
│  Paciente / Motivo              │
│  [ Consulta — Juan García     ] │
│                                 │
│  Doctor                         │
│  [ Dr. Ana García          ▾ ] │
│                                 │
│  Sala (opcional)                │
│  [ Consultation Room A     ▾ ] │
│                                 │
│  Fecha                          │
│  [ 📅 miércoles, 26 de marzo  ] │
│                                 │
│  Hora inicio    Duración        │
│  [ 09:00   ▾ ] [ 30 minutos ▾ ]│
│                                 │
│  [Cancelar]  [Confirmar cita]   │
└─────────────────────────────────┘
```

**Flujo de validación:**
1. Si faltan campos → toast naranja de error
2. POST a `/api/appointments` con los datos
3. Si HTTP 409 → toast rojo: `"Conflicto detectado: staff is already booked (...)`
4. Si HTTP 201 → toast verde: `"Cita creada exitosamente"` + cierre del dialog + refetch del grid

### Otras vistas

| Ruta | Contenido |
|------|-----------|
| `/calendario` | CalendarGrid a pantalla completa con navegación de fecha |
| `/equipo` | Cards de staff: nombre, email, rol, badge Activo/Inactivo |
| `/salas` | Cards de salas: nombre, capacidad, badge Activa/Inactiva |
| `/configuracion` | Datos del negocio y estado del protocolo MCP |

---

## Base de datos

### Diagrama de tablas

```
┌─────────────────────┐
│      businesses     │
├─────────────────────┤
│ id (PK, uuid)       │◄──────────────────────────────┐
│ name                │                               │
│ timezone            │                               │
│ created_at          │                               │
└─────────────────────┘                               │
                                                      │ business_id (FK)
          ┌───────────────────────┬───────────────────┤
          │                       │                   │
          ▼                       ▼                   ▼
┌──────────────────┐   ┌──────────────────┐  ┌──────────────────────┐
│      staff       │   │      rooms       │  │     appointments     │
├──────────────────┤   ├──────────────────┤  ├──────────────────────┤
│ id (PK)          │   │ id (PK)          │  │ id (PK)              │
│ business_id (FK) │   │ business_id (FK) │  │ business_id (FK)     │
│ name             │   │ name             │  │ staff_id (FK, null?) │
│ email (unique)   │   │ capacity         │  │ room_id  (FK, null?) │
│ role             │   │ is_active        │  │ title                │
│ is_active        │   │ created_at       │  │ description          │
│ created_at       │   └──────────────────┘  │ start_time (UTC)     │
└──────────────────┘          ▲              │ end_time   (UTC)     │
         ▲                    │              │ status               │
         │                    │              │ metadata (jsonb)     │
         └────────────────────┘              │ created_at           │
              staff_id / room_id (FK)        │ updated_at           │
                                             └──────────────────────┘

Regla: staff_id y room_id son opcionales individualmente,
       pero al menos uno de los dos debe estar presente (CHECK constraint).
```

### Tipos de `status` en appointments

```
pending ──► confirmed ──► completed
   │             │
   └─────────────┴──► cancelled
```

---

## Lógica de conflictos

La función `checkConflicts()` en `services/appointmentService.ts` impide doble-reserva.

```
Cita existente:    [====================================]
                   start_existing                end_existing

Caso 1 – Conflicto (solape total):
Nueva cita:              [==================]
                         ✗ CONFLICTO

Caso 2 – Conflicto (solape parcial):
Nueva cita:    [=============]
                             ✗ CONFLICTO

Caso 3 – Sin conflicto (adyacente):
Nueva cita:                                  [=========]
                                             ✓ OK (borde compartido no es conflicto)

Fórmula SQL: existing.start_time < new.end_time
         AND existing.end_time   > new.start_time
```

---

## API REST

Base URL: `http://localhost:3000`

### Appointments

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/appointments` | Listar citas (`?business_id=&date=&staff_id=&room_id=&status=`) |
| `POST` | `/api/appointments` | Crear cita (detecta conflictos, devuelve 409 si hay solape) |
| `GET` | `/api/appointments/:id` | Detalle de cita con relaciones staff y room |
| `DELETE` | `/api/appointments/:id` | Cancelar cita (cambia status a `cancelled`) |
| `GET` | `/api/appointments/availability` | Slots libres (`?business_id=&date=&duration_minutes=&staff_id=&room_id=`) |

### Staff & Rooms

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/staff` | Listar staff activo (`?business_id=`) |
| `POST` | `/api/staff` | Crear miembro del staff |
| `GET` | `/api/rooms` | Listar salas activas (`?business_id=`) |
| `POST` | `/api/rooms` | Crear sala |

---

## MCP Tools (para agentes de IA)

Cuando un agente como Claude se conecta al servidor MCP, tiene acceso a estas herramientas:

| Tool | Qué hace |
|------|----------|
| `get_availability` | Devuelve los slots libres para una fecha y duración |
| `book_appointment` | Reserva una cita (incluye validación de conflictos) |
| `list_appointments` | Lista citas con filtros opcionales |
| `cancel_appointment` | Cancela una cita por ID |
| `list_staff` | Lista el staff activo de un negocio |
| `list_rooms` | Lista las salas activas de un negocio |

---

## Configuración inicial

### 1. Variables de entorno

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
NEXT_PUBLIC_BUSINESS_ID=a1b2c3d4-0000-0000-0000-000000000001
```

### 2. Base de datos

En el editor SQL de Supabase, ejecuta los scripts en orden:

```
supabase/migrations/001_initial_schema.sql  ← tablas e índices
supabase/migrations/002_rls.sql             ← seguridad por fila
supabase/migrations/003_seed.sql            ← datos de ejemplo
```

### 3. Arrancar el servidor de desarrollo

```bash
npm run dev
# → http://localhost:3000/dashboard
```

### 4. Probar la API desde la terminal

```bash
# Slots disponibles para el 1 de abril (negocio de prueba, citas de 30 min)
curl "http://localhost:3000/api/appointments/availability?\
business_id=a1b2c3d4-0000-0000-0000-000000000001&date=2026-04-01&duration_minutes=30"

# Reservar una cita
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "a1b2c3d4-0000-0000-0000-000000000001",
    "staff_id": "b1000000-0000-0000-0000-000000000001",
    "room_id": "c1000000-0000-0000-0000-000000000001",
    "title": "Consulta de prueba",
    "start_time": "2026-04-01T15:00:00Z",
    "end_time": "2026-04-01T15:30:00Z"
  }'
```

### 5. Arrancar el servidor MCP

```bash
npm run mcp
# El servidor escucha por stdin/stdout (JSON-RPC 2.0)
```

Para conectar Claude Code al servidor MCP, agrega esto a tu configuración MCP:

```json
{
  "mcpServers": {
    "agent-cal": {
      "command": "node",
      "args": ["--env-file=.env.local", "--import", "tsx", "mcp/server.ts"],
      "cwd": "C:/Users/Daniel/OneDrive/Escritorio/prueba-de-repos/AgentCal"
    }
  }
}
```

---

## Datos de ejemplo (seed)

El archivo `003_seed.sql` crea un negocio de prueba listo para usar:

```
Business ID: a1b2c3d4-0000-0000-0000-000000000001
Nombre: Demo Clinic

Staff:
  b1000000-...-0001  Dr. Ana García    (doctor)
  b1000000-...-0002  Dr. Carlos López  (doctor)
  b1000000-...-0003  Laura Martínez    (nurse)

Rooms:
  c1000000-...-0001  Consultation Room A  (capacity: 2)
  c1000000-...-0002  Consultation Room B  (capacity: 2)
  c1000000-...-0003  Waiting Room         (capacity: 10)

Citas pre-cargadas:
  2026-04-01 13:00–13:30 UTC  →  Dr. Ana + Room A
  2026-04-01 14:00–14:30 UTC  →  Dr. Carlos + Room B
```

---

## Convenciones del proyecto

- **Todos los timestamps son UTC** — la columna `businesses.timezone` existe solo para mostrar la hora al usuario final, nunca para calcular.
- **El `adminClient` (service role)** se usa exclusivamente en API routes y el servicio MCP. Jamás se expone al navegador.
- **RLS es defensa en profundidad** — las políticas filtran por `business_id` extraído del JWT. En el MVP, las rutas de API usan el admin client, por lo que RLS no bloquea las operaciones internas.
- **Hooks con `mounted` flag** — los tres hooks de datos (`useStaff`, `useRooms`, `useAppointments`) usan un flag `mounted` para evitar actualizaciones de estado tras desmontaje, previniendo errores de navegación cliente-side en Next.js App Router.
- **`<select>` nativos en formularios** — el `Select` de shadcn v4 usa `@base-ui/react` que tiene conflictos de portal con `Dialog`. Los formularios usan `<select>` HTML nativo estilizado con Tailwind para máxima compatibilidad.
- **Sin gestor de estado externo** — `useState` + `useEffect` es suficiente para las tres fuentes de datos independientes del MVP.
