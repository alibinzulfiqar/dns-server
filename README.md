# DNS Manager

A modern, full-featured DNS management system with a beautiful web interface, built for deployment with Docker.

![DNS Manager Dashboard](https://via.placeholder.com/800x400?text=DNS+Manager+Dashboard)

## Features

- 🌐 **Complete DNS Zone Management**
  - Create, edit, and delete domains
  - Full CRUD operations for DNS records (A, AAAA, CNAME, MX, TXT, NS, SRV, PTR, CAA)
  - SOA record configuration with TTL settings

- 🔐 **Authentication & Security**
  - JWT-based authentication
  - Secure password hashing with bcrypt
  - Role-based access control (admin/user)

- 📊 **Dashboard & Analytics**
  - Overview of all domains
  - Record count statistics by type
  - Recent activity tracking

- 🎨 **Modern UI/UX**
  - Responsive design with Tailwind CSS
  - Clean, intuitive interface
  - Modal dialogs for record management
  - Confirmation dialogs for destructive actions
  - Toast notifications for feedback

- 🐳 **Docker Ready**
  - Production and development configurations
  - Docker Compose for easy deployment
  - Health checks for all services
  - Persistent data volumes

- 🔌 **PowerDNS Integration**
  - Optional integration with real PowerDNS servers
  - Mock DNS mode for development/testing

## Tech Stack

### Backend
- Node.js with Express
- Sequelize ORM
- PostgreSQL database
- JWT authentication
- Winston logging

### Frontend
- React 18 with Vite
- React Router for navigation
- Tailwind CSS for styling
- React Hook Form for form handling
- Axios for API calls

### Infrastructure
- Docker & Docker Compose
- Nginx (production frontend)
- PostgreSQL 16

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Git (for cloning the repository)

### Production Deployment

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dns-server
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set secure values:
   ```env
   DB_PASSWORD=your_secure_database_password
   JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters
   ```

3. **Build and start the containers**
   ```bash
   docker-compose up -d --build
   ```

4. **Access the application**
   - Open http://localhost in your browser
   - Register a new account to get started

### Development Setup

1. **Start development containers**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d --build
   ```

2. **Access development servers**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - PostgreSQL: localhost:5432

3. **View logs**
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f
   ```

### Local Development (without Docker)

1. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

2. **Configure backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database settings
   ```

3. **Start PostgreSQL** (using Docker or local installation)
   ```bash
   docker run -d --name dns-postgres \
     -e POSTGRES_DB=dns_manager \
     -e POSTGRES_PASSWORD=password \
     -p 5432:5432 \
     postgres:16-alpine
   ```

4. **Start the servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## Deployment on Coolify

### Step 1: Create New Service
1. Go to your Coolify dashboard
2. Create a new **Docker Compose** service
3. Connect your GitHub repository

### Step 2: Required Environment Variables
Add these in Coolify's environment variables section:

| Variable | Required | Example Value |
|----------|----------|---------------|
| `DB_PASSWORD` | ✅ Yes | `MySecurePassword123!` |
| `JWT_SECRET` | ✅ Yes | `your-32-char-random-secret-key-here` |

### Step 3: Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_PORT` | `8580` | External port (change if conflicts exist) |
| `DB_USER` | `postgres` | Database username |
| `DB_NAME` | `dns_manager` | Database name |
| `FRONTEND_URL` | (empty/wildcard) | For CORS restrictions |

### Step 4: Deploy
- Click Deploy
- Wait for all containers to be healthy
- Access via: `http://your-server-ip:8580`

### Troubleshooting Coolify Deployment

**Port Conflict?** Change `APP_PORT` to another value (e.g., `8581`, `8590`)

**Build Failing?** Check that both `backend/package-lock.json` and `frontend/package-lock.json` exist

**Container Names Conflict?** All containers use unique `dns-manager-*` prefix to avoid conflicts

**Network Issues?** Uses isolated `dns-manager-network` network

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/password` | Change password |

### Domains
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/domains` | List all domains |
| GET | `/api/domains/stats` | Get domain statistics |
| GET | `/api/domains/:id` | Get single domain |
| POST | `/api/domains` | Create domain |
| PUT | `/api/domains/:id` | Update domain |
| DELETE | `/api/domains/:id` | Delete domain |

### DNS Records
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/domains/:id/records` | List domain records |
| GET | `/api/domains/:id/records/:recordId` | Get single record |
| POST | `/api/domains/:id/records` | Create record |
| POST | `/api/domains/:id/records/bulk` | Bulk create records |
| PUT | `/api/domains/:id/records/:recordId` | Update record |
| DELETE | `/api/domains/:id/records/:recordId` | Delete record |

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_PASSWORD` | Database password | - | ✅ Yes |
| `JWT_SECRET` | JWT signing secret | - | ✅ Yes |
| `APP_PORT` | External app port | `8580` | No |
| `NODE_ENV` | Environment mode | `production` | No |
| `PORT` | Backend internal port | `3001` | No |
| `DB_HOST` | PostgreSQL host | `dns-postgres` | No |
| `DB_PORT` | PostgreSQL port | `5432` | No |
| `DB_NAME` | Database name | `dns_manager` | No |
| `DB_USER` | Database user | `postgres` | No |
| `JWT_EXPIRES_IN` | JWT expiration | `7d` | No |
| `USE_MOCK_DNS` | Use mock DNS server | `true` | No |
| `PDNS_API_URL` | PowerDNS API URL | - | No |
| `PDNS_API_KEY` | PowerDNS API key | - | No |
| `FRONTEND_URL` | Frontend URL for CORS | (wildcard) | No |

### PowerDNS Integration

To use with a real PowerDNS server:

1. Set `USE_MOCK_DNS=false`
2. Configure `PDNS_API_URL` with your PowerDNS API endpoint
3. Set `PDNS_API_KEY` with your API key

Add PowerDNS to docker-compose.yml:

```yaml
powerdns:
  image: powerdns/pdns-auth-48:latest
  environment:
    PDNS_AUTH_API_KEY: your_api_key
  ports:
    - "53:53/udp"
    - "53:53/tcp"
    - "8081:8081"
```

## Project Structure

```
dns-server/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── app.js          # Express app entry
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React context
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml      # Production config
├── docker-compose.dev.yml  # Development config
├── .env.example
└── README.md
```

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Connect to PostgreSQL directly
docker exec -it dns-postgres psql -U postgres -d dns_manager
```

### Backend Issues
```bash
# View backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### Frontend Issues
```bash
# View frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend
```

### Reset Everything
```bash
# Stop and remove all containers and volumes
docker-compose down -v

# Rebuild from scratch
docker-compose up -d --build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Express.js](https://expressjs.com/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [PowerDNS](https://www.powerdns.com/)
- [Docker](https://www.docker.com/)
