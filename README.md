# HeliLog - RC Helicopter Flight Logger

A full-stack web application for logging and tracking RC helicopter flights, maintenance, and statistics.

## Features

- **Helicopter Management**: Track multiple helicopters with specs (model, manufacturer, rotor diameter, weight)
- **Flight Logging**: Record flights with detailed information (duration, battery cycles, flight mode, weather, location, notes)
- **Flight History**: Search and filter flights by date, helicopter, mode, and duration
- **Dashboard**: View statistics including total flights, flight hours, average duration, and trends
- **Maintenance Tracking**: Track maintenance records and get alerts for overdue maintenance

## Tech Stack

### Backend
- **Hono** - Fast, lightweight TypeScript web framework
- **Prisma** - Type-safe ORM with SQLite database
- **Zod** - Schema validation
- **LibSQL** - SQLite database adapter

### Frontend
- **React 19** - UI framework
- **Vite 8** - Build tool and dev server
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **Axios** - HTTP client

## Project Structure

```
helilog/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Main server entry point
│   │   ├── db.ts             # Prisma client
│   │   └── routes/           # API routes
│   │       ├── helicopters.ts
│   │       ├── flights.ts
│   │       ├── stats.ts
│   │       └── maintenance.ts
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── lib/
│   │   │   └── api.ts        # API client
│   │   ├── types/
│   │   │   └── index.ts      # TypeScript types
│   │   ├── App.tsx
│   │   └── App.css
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository** (or use existing project)

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   
   # Create and migrate database
   npm run db:migrate
   
   # Generate Prisma Client
   npx prisma generate
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   
   # Copy environment variables
   cp .env.example .env.local
   ```

### Running the Application

**Start Backend** (from `backend/` directory):
```bash
npm run dev
```
Backend runs on http://localhost:3000

**Start Frontend** (from `frontend/` directory):
```bash
npm run dev
```
Frontend runs on http://localhost:5173

### Database Management

**Create a new migration:**
```bash
cd backend
npm run db:migrate -- --name your_migration_name
```

**Reset database (WARNING: deletes all data):**
```bash
cd backend
npm run db:reset
```

**Open Prisma Studio (database GUI):**
```bash
cd backend
npm run db:studio
```

## API Endpoints

### Helicopters
- `GET /api/helicopters` - List all helicopters
- `GET /api/helicopters/:id` - Get helicopter details
- `POST /api/helicopters` - Create helicopter
- `PUT /api/helicopters/:id` - Update helicopter
- `DELETE /api/helicopters/:id` - Delete helicopter

### Flights
- `GET /api/flights` - List flights (with filtering)
  - Query params: `helicopterId`, `startDate`, `endDate`, `flightMode`, `minDuration`, `maxDuration`
- `GET /api/flights/:id` - Get flight details
- `POST /api/flights` - Create flight
- `PUT /api/flights/:id` - Update flight
- `DELETE /api/flights/:id` - Delete flight

### Statistics
- `GET /api/stats` - Get overall statistics
- `GET /api/stats/recent` - Get recent flights
- `GET /api/stats/trends/weekly` - Get weekly trends
- `GET /api/stats/trends/monthly` - Get monthly trends

### Maintenance
- `POST /api/maintenance` - Record maintenance
- `GET /api/helicopters/:id/maintenance` - Get maintenance history
- `GET /api/maintenance/alerts` - Get maintenance alerts

## Development

### Backend Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run db:migrate` - Run database migrations
- `npm run db:reset` - Reset database
- `npm run db:studio` - Open Prisma Studio

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Database Schema

### Helicopter
- `id` - Auto-incrementing ID
- `name` - Unique helicopter name
- `model` - Model name
- `manufacturer` - Optional manufacturer
- `rotorDiameter` - Optional rotor diameter (mm)
- `weight` - Optional weight (kg)
- `totalHours` - Calculated total flight hours
- `maintenanceInterval` - Optional maintenance interval (hours)
- `lastMaintenance` - Last maintenance date

### Flight
- `id` - Auto-incrementing ID
- `helicopterId` - Foreign key to Helicopter
- `date` - Flight date
- `duration` - Duration in minutes
- `batteryCycles` - Optional battery cycles used
- `flightMode` - Optional flight mode (3D, Sport, GPS, Manual)
- `weather` - Optional weather conditions
- `temperature` - Optional temperature (°C)
- `windSpeed` - Optional wind speed (km/h)
- `notes` - Optional notes
- `location` - Optional flight location

### MaintenanceRecord
- `id` - Auto-incrementing ID
- `helicopterId` - Foreign key to Helicopter
- `date` - Maintenance date
- `description` - Maintenance description
- `hoursAtMaintenance` - Flight hours at time of maintenance

## Contributing

This is a personal project for logging RC helicopter flights. Feel free to fork and adapt for your own use.

## Deployment

### Production Deployment with Docker

The easiest way to deploy HeliLog is using Docker Compose:

1. **Prerequisites**
   - Docker and Docker Compose installed
   - Update environment variables in `.env.production` files

2. **Configure Environment**
   ```bash
   # Backend: backend/.env.production
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=file:/data/prod.db
   CORS_ORIGIN=http://your-domain.com
   
   # Frontend: frontend/.env.production
   VITE_API_URL=http://your-domain.com:3000/api
   ```

3. **Deploy**
   ```bash
   # Run the deployment script
   ./deploy.sh
   
   # Or manually with docker-compose
   docker-compose up -d
   ```

4. **Access Application**
   - Frontend: http://localhost (port 80)
   - Backend: http://localhost:3000

5. **Manage Deployment**
   ```bash
   # View logs
   docker-compose logs -f
   
   # Restart services
   docker-compose restart
   
   # Stop services
   docker-compose down
   
   # Update application
   git pull
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Manual Production Build

**Backend:**
```bash
cd backend
npm run build
NODE_ENV=production npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the dist/ folder with any static file server
```

### Cloud Deployment Options

- **Vercel**: Deploy frontend (automatic via Git integration)
- **Railway/Render**: Deploy backend with PostgreSQL
- **DigitalOcean/Linode**: Deploy with Docker Compose on VPS
- **AWS/GCP/Azure**: Use container services (ECS, Cloud Run, Container Apps)

## License

MIT
