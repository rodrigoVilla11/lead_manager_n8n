# Lead Manager Pro

Dashboard para gestionar Email Scrappers de n8n. Permite administrar multiples clientes, cada uno con su propio workflow de scraping, desde una interfaz centralizada.

## Funcionalidades

- **Gestion de Clientes**: Crear, editar y eliminar clientes con su configuracion de scraping
- **Control de Workflows**: Activar/desactivar/duplicar workflows de n8n sin abrir n8n
- **Editor Visual de Config**: Modificar nichos, regiones, producto y mas desde una UI amigable
- **Metricas y Leads**: Ver estadisticas de leads por cliente, graficos temporales
- **Historial de Ejecuciones**: Monitorear el estado de cada ejecucion con detalle de errores
- **Dark Mode**: Soporte completo de tema claro/oscuro

## Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Estilos**: Tailwind CSS 4 + shadcn/ui
- **Base de datos**: PostgreSQL + Prisma ORM
- **API externa**: n8n REST API (self-hosted)
- **Graficos**: Recharts
- **Estado**: TanStack Query (React Query)
- **Notificaciones**: Sonner

## Requisitos previos

- Node.js 20.19+
- PostgreSQL
- n8n self-hosted con API habilitada

## Instalacion

```bash
# 1. Clonar el repositorio
git clone <tu-repo>
cd lead-manager-pro

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores reales

# 4. Crear la base de datos y ejecutar migraciones
npx prisma db push
# O para generar migraciones:
# npx prisma migrate dev --name init

# 5. Generar el cliente de Prisma
npx prisma generate

# 6. Iniciar en desarrollo
npm run dev
```

La app estara disponible en [http://localhost:3000](http://localhost:3000).

## Variables de entorno

| Variable | Descripcion | Ejemplo |
|---|---|---|
| `DATABASE_URL` | URL de conexion a PostgreSQL | `postgresql://user:pass@localhost:5432/lead_manager` |
| `N8N_API_URL` | URL base de la API de n8n | `http://tu-vps:5678/api/v1` |
| `N8N_API_KEY` | API Key de n8n | `n8n_api_...` |
| `N8N_TEMPLATE_WORKFLOW_ID` | ID del workflow template base | `abc123` |
| `NEXT_PUBLIC_APP_URL` | URL publica de la app | `http://localhost:3000` |

## Configuracion de n8n

### Obtener API Key

1. Abre tu instancia de n8n
2. Ve a **Settings > API**
3. Crea una nueva API Key
4. Copia la key en tu `.env`

### Preparar Workflow Template

Tu workflow template de n8n debe tener un nodo llamado **"CONFIGURACION"** de tipo **Set** con estas variables:

- `nichos` - Nichos de negocio a buscar (ej: "dentistas, clinicas dentales")
- `regiones` - Regiones geograficas (ej: "Cordoba Capital, Rosario")
- `pais` - Pais (ej: "Argentina")
- `producto` - Producto/servicio a ofrecer
- `propuesta_valor` - Propuesta de valor para emails
- `max_resultados_por_busqueda` - Limite de resultados por busqueda

El dashboard automaticamente detecta y modifica estos valores al crear o editar un cliente.

## Estructura del proyecto

```
app/
  (dashboard)/          # Layout con sidebar
    page.tsx            # Dashboard principal
    clients/            # Gestion de clientes
    workflows/          # Vista de workflows
    leads/              # Estadisticas de leads
    settings/           # Configuracion
  api/                  # API routes
    clients/            # CRUD clientes + config
    workflows/          # Control de workflows n8n
    leads/              # Estadisticas
components/
  ui/                   # shadcn/ui components
  dashboard/            # Componentes del dashboard
  clients/              # Componentes de clientes
  workflows/            # Componentes de workflows
lib/
  n8n-service.ts        # Servicio de comunicacion con n8n
  prisma.ts             # Cliente de Prisma
  validations.ts        # Schemas de Zod
hooks/                  # React Query hooks
types/                  # TypeScript types
prisma/
  schema.prisma         # Schema de base de datos
```

## API Endpoints

### Clientes
- `GET /api/clients` - Listar todos los clientes
- `POST /api/clients` - Crear cliente (+ duplicar workflow)
- `GET /api/clients/:id` - Obtener detalle de cliente
- `PUT /api/clients/:id` - Actualizar cliente
- `DELETE /api/clients/:id` - Eliminar cliente
- `PUT /api/clients/:id/config` - Actualizar configuracion de scraping

### Workflows
- `GET /api/workflows` - Listar workflows de n8n
- `POST /api/workflows/:id/activate` - Activar workflow
- `POST /api/workflows/:id/deactivate` - Desactivar workflow
- `POST /api/workflows/:id/duplicate` - Duplicar workflow
- `POST /api/workflows/sync` - Sincronizar estado con n8n

### Leads
- `GET /api/leads?clientId=X&days=7` - Estadisticas de leads

## Uso

### Crear un nuevo cliente

1. Ir a **Clientes > Nuevo Cliente**
2. Completar datos del cliente y configuracion del scrapper
3. Al guardar, automaticamente se duplica el workflow template en n8n con la config del cliente

### Editar configuracion de scraping

1. Ir al detalle del cliente > tab **Configuracion**
2. Modificar nichos, regiones, producto, etc.
3. Al guardar, se actualiza tanto en la base de datos como en n8n

### Activar/Desactivar workflows

- Desde la lista de clientes: usar el switch en cada card
- Desde la pagina de workflows: usar el toggle en cada workflow
