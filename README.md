# AgentCal

Sistema de agendamiento de citas impulsado por IA. Permite que agentes de lenguaje (como Claude) reserven, consulten y cancelen citas a través de una API REST o directamente mediante el protocolo MCP (Model Context Protocol).

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript (strict) |
| Base de datos | Supabase (PostgreSQL) |
| Estilos (futuro frontend) | Tailwind CSS |
| Protocolo para agentes | MCP 2024-11-05 sobre stdio |

---

## Arquitectura general

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTES                             │
│                                                             │
│   Browser / Postman          Claude Code / Agente IA        │
│   (HTTP REST)                (Model Context Protocol)       │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────┐    ┌─────────────────────────────┐
│   /app/api/          │    │   /mcp/server.ts             │
│   Endpoints REST     │    │   Servidor MCP (stdio)       │
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
├── app/                          ← Next.js App Router
│   ├── layout.tsx                  Raíz del layout (HTML, metadata)
│   ├── page.tsx                    Página principal (placeholder frontend)
│   ├── globals.css                 Tailwind base styles
│   │
│   └── api/                      ← Endpoints HTTP REST
│       ├── appointments/
│       │   ├── route.ts            GET /api/appointments  → listar citas
│       │   │                       POST /api/appointments → crear cita
│       │   ├── [id]/
│       │   │   └── route.ts        GET  /api/appointments/:id → detalle
│       │   │                       DELETE /api/appointments/:id → cancelar
│       │   └── availability/
│       │       └── route.ts        GET /api/appointments/availability
│       │                           → slots libres para una fecha y duración
│       ├── staff/
│       │   └── route.ts            GET  → listar staff activo
│       │                           POST → crear staff
│       └── rooms/
│           └── route.ts            GET  → listar salas activas
│                                   POST → crear sala
│
├── lib/                          ← Utilidades compartidas (sin lógica de negocio)
│   ├── supabase.ts                 Dos clientes de Supabase:
│   │                               · supabase        (anon key, respeta RLS)
│   │                               · createAdminClient() (service role, sin RLS)
│   └── dateUtils.ts                Funciones de fechas en UTC:
│                                   · isValidISODate()   valida ISO 8601
│                                   · isValidTimeRange() start < end
│                                   · durationMinutes()  diferencia en minutos
│                                   · dayBoundsUTC()     límites de un día
│                                   · generateSlots()    genera franjas horarias
│                                   · rangesOverlap()    detecta solapamiento
│
├── services/                     ← Lógica de negocio pura
│   └── appointmentService.ts       Todas las operaciones críticas:
│                                   · checkConflicts()    ¿staff o sala ocupados?
│                                   · getAvailability()   slots libres del día
│                                   · bookAppointment()   valida + reserva + anti-solape
│                                   · cancelAppointment() marca como 'cancelled'
│                                   · getAppointment()    detalle con relaciones
│                                   · listAppointments()  listado con filtros
│
├── mcp/                          ← Protocolo MCP para agentes de IA
│   ├── tools.ts                    Definición de las 6 herramientas (JSON Schema):
│   │                               · get_availability
│   │                               · book_appointment
│   │                               · list_appointments
│   │                               · cancel_appointment
│   │                               · list_staff
│   │                               · list_rooms
│   └── server.ts                   Servidor MCP sobre stdio (JSON-RPC 2.0).
│                                   Recibe mensajes de Claude, despacha a services/,
│                                   devuelve respuestas estructuradas.
│                                   Arranque: npm run mcp
│
├── types/                        ← Definiciones TypeScript
│   ├── database.ts                 Tipos que reflejan exactamente el esquema SQL:
│   │                               BusinessRow, StaffRow, RoomRow, AppointmentRow
│   │                               + tipo Database<> genérico para Supabase client
│   └── appointments.ts             Tipos de dominio / lógica de negocio:
│                                   TimeSlot, AvailabilityQuery, AvailabilityResult,
│                                   BookAppointmentInput, ConflictCheckResult,
│                                   AppointmentWithRelations
│
├── supabase/
│   └── migrations/               ← Scripts SQL (ejecutar en orden en Supabase)
│       ├── 001_initial_schema.sql  Crea las 4 tablas, índices y trigger updated_at
│       ├── 002_rls.sql             Activa Row Level Security en todas las tablas
│       └── 003_seed.sql            Datos de ejemplo: Demo Clinic, 2 doctores,
│                                   3 salas, 2 citas de prueba
│
├── .env.local.example            ← Variables de entorno necesarias (copiar a .env.local)
├── next.config.ts                ← Configuración de Next.js
├── tailwind.config.ts            ← Configuración de Tailwind CSS
├── tsconfig.json                 ← TypeScript en modo strict, alias @/*
└── package.json                  ← Scripts: dev, build, start, lint, mcp
```

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
# → http://localhost:3000
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
      "command": "npx",
      "args": ["tsx", "mcp/server.ts"],
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
- **Sin frontend todavía** — `app/page.tsx` es un placeholder. Los componentes de UI se agregarán en la siguiente fase.
