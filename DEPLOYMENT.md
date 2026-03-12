# HeliLog Production Deployment Guide

## Quick Start with Docker

### Prerequisites
- Docker 20.10+ installed
- Docker Compose 2.0+ installed
- 1GB RAM minimum
- 500MB disk space

### One-Command Deployment

```bash
./deploy.sh
```

That's it! The application will be available at:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000

---

## Manual Deployment Options

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd helilog
   ```

2. **Configure environment variables**
   
   Edit `backend/.env.production`:
   ```env
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=file:/data/prod.db
   CORS_ORIGIN=http://localhost
   ```
   
   Edit `frontend/.env.production`:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

3. **Deploy**
   ```bash
   docker-compose up -d
   ```

4. **View logs**
   ```bash
   docker-compose logs -f
   ```

---

### Option 2: Manual Build & Deploy

#### Backend Deployment

1. **Install dependencies**
   ```bash
   cd backend
   npm ci --only=production
   ```

2. **Build**
   ```bash
   npm run build
   ```

3. **Setup database**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

4. **Start**
   ```bash
   NODE_ENV=production npm start
   ```

#### Frontend Deployment

1. **Install dependencies**
   ```bash
   cd frontend
   npm ci
   ```

2. **Build**
   ```bash
   npm run build
   ```

3. **Serve**
   
   The `dist/` folder contains static files. Serve with any web server:
   
   **With Nginx:**
   ```nginx
   server {
       listen 80;
       root /path/to/helilog/frontend/dist;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```
   
   **With Node.js (serve package):**
   ```bash
   npm install -g serve
   serve -s dist -l 80
   ```

---

### Option 3: Cloud Platforms

#### Vercel (Frontend)

1. Import repository in Vercel dashboard
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variable: `VITE_API_URL=<your-backend-url>`
5. Deploy

#### Railway (Backend)

1. Create new project from GitHub
2. Add PostgreSQL database (or use SQLite with volume)
3. Set environment variables:
   - `NODE_ENV=production`
   - `DATABASE_URL=<postgres-connection-string>`
4. Deploy

#### DigitalOcean App Platform

1. Create new app from GitHub
2. Configure services:
   - **Backend**: Node.js, run command: `npm start`
   - **Frontend**: Static site, output directory: `dist`
3. Add database (PostgreSQL managed database)
4. Deploy

---

## Production Checklist

### Before Deployment

- [ ] Update CORS_ORIGIN to your frontend domain
- [ ] Update VITE_API_URL to your backend domain
- [ ] Review security headers in nginx.conf
- [ ] Set up SSL/TLS certificates (Let's Encrypt recommended)
- [ ] Configure database backups
- [ ] Set up monitoring (optional: Sentry, LogRocket)

### After Deployment

- [ ] Test all CRUD operations
- [ ] Verify helicopter hour calculations
- [ ] Check maintenance alerts
- [ ] Test on mobile devices
- [ ] Set up automated backups
- [ ] Monitor application logs

---

## Database Management

### Backup Database

**SQLite (Docker):**
```bash
docker-compose exec backend sqlite3 /data/prod.db .dump > backup.sql
```

**Manual:**
```bash
sqlite3 backend/prod.db .dump > backup.sql
```

### Restore Database

```bash
sqlite3 backend/prod.db < backup.sql
```

### Migrate to PostgreSQL (Production Recommended)

1. Update `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Update DATABASE_URL:
   ```
   postgresql://user:password@host:5432/database
   ```

3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

---

## Monitoring & Maintenance

### View Application Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

### Check Service Health

```bash
# List running containers
docker-compose ps

# Backend health check
curl http://localhost:3000/api/helicopters

# Frontend health check
curl http://localhost
```

### Update Application

```bash
git pull
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Restart Services

```bash
docker-compose restart
```

---

## Scaling & Performance

### Increase Backend Resources

Edit `docker-compose.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

### Enable Backend Caching

Consider adding Redis for caching statistics queries.

### CDN for Frontend

Upload frontend `dist/` to CDN (Cloudflare, AWS CloudFront) for better performance.

---

## Security Hardening

### Environment Variables

- Never commit `.env` files to Git
- Use secrets management (AWS Secrets Manager, HashiCorp Vault)

### SSL/TLS

Use Let's Encrypt with Certbot:
```bash
certbot --nginx -d yourdomain.com
```

### Rate Limiting

Add rate limiting to prevent API abuse (consider using nginx rate limiting or express-rate-limit).

### Database Security

- Use strong passwords
- Enable SSL connections for PostgreSQL
- Regular security updates

---

## Troubleshooting

### Backend not starting

```bash
# Check logs
docker-compose logs backend

# Common issues:
# - Port 3000 already in use: Change PORT in .env
# - Database permission issues: Check volume permissions
# - Missing environment variables: Verify .env.production
```

### Frontend not loading

```bash
# Check logs
docker-compose logs frontend

# Common issues:
# - CORS errors: Update CORS_ORIGIN in backend
# - API connection failed: Verify VITE_API_URL
# - 404 on routes: Check nginx.conf has try_files
```

### Database errors

```bash
# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d

# Or manually
docker-compose exec backend npx prisma migrate reset
```

---

## Support

For issues or questions:
1. Check the [README.md](README.md)
2. Review logs with `docker-compose logs`
3. Check [TEST_REPORT.md](TEST_REPORT.md) for validation steps

---

**Last Updated**: March 12, 2026  
**Deployment Version**: 1.0.0
