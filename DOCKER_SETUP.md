# Docker Setup Guide for SysRegister

This guide will help you self-host SysRegister using Docker and Docker Compose, avoiding geo-blocking issues with cloud hosting providers.

## Prerequisites

- Docker installed ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed (usually included with Docker Desktop)
- At least 2GB of free disk space
- A server or VPS with a non-blocked IP address

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/gablilli/SysRegister.git
cd SysRegister
```

### 2. Configure Environment Variables

Create a `.env` file from the example:

```bash
cp .env.docker .env
```

Edit the `.env` file and **change the JWT_SECRET**:

```bash
# Generate a secure JWT secret
openssl rand -base64 32

# Or use this online generator: https://www.random.org/strings/
```

Update your `.env` file:

```env
JWT_SECRET=your_secure_random_string_here
```

### 3. Build and Run with Docker Compose

```bash
# Build and start the container
docker-compose up -d

# Check if it's running
docker-compose ps

# View logs
docker-compose logs -f
```

The application will be available at: **http://localhost:3000**

### 4. Database Initialization

On first run, the database schema is **automatically created** when the container starts. The startup script runs `prisma db push` to initialize all required database tables. 

The SQLite database file (`database.db`) is stored in the `./data` directory on your host machine and persisted across container restarts. No manual database setup is required.

## Configuration

### Environment Variables

- **JWT_SECRET** (Required): Secret key for JWT token generation. Must be at least 32 characters.
- **NEXT_PUBLIC_APP_URL** (Optional): The URL where the application is accessible. Used for server-side rendering calling own API routes. Defaults to `http://localhost:3000`. Set to your domain in production (e.g., `https://yourdomain.com`).
- **NEXT_PUBLIC_POSTHOG_KEY** (Optional): PostHog analytics key
- **NEXT_PUBLIC_POSTHOG_HOST** (Optional): PostHog analytics host
- **COOKIE_SECURE** (Optional): Set to `false` for local development or Docker without HTTPS, `true` when behind an HTTPS reverse proxy. Defaults to `false`.

### Ports

By default, the application runs on port **3000**. To change this, edit `docker-compose.yml`:

```yaml
ports:
  - "8080:3000"  # Map to port 8080 instead
```

### Data Persistence

The following directories are persisted:
- `./data` - SQLite database
- `./public/userassets` - User avatars and banners

## Management Commands

### Start the Application

```bash
docker-compose up -d
```

### Stop the Application

```bash
docker-compose down
```

### View Logs

```bash
# All logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100 -f
```

### Restart the Application

```bash
docker-compose restart
```

### Update to Latest Version

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build
```

### Backup Database

```bash
# Create a backup of the SQLite database
cp ./data/database.db ./data/database.db.backup.$(date +%Y%m%d_%H%M%S)
```

### Reset Database

```bash
# Stop the application
docker-compose down

# Remove the database
rm -rf ./data/database.db*

# Start again (database will be recreated)
docker-compose up -d
```

## Troubleshooting

### Container won't start

Check logs:
```bash
docker-compose logs
```

### Permission issues

Ensure the data directory has correct permissions:
```bash
sudo chown -R 1001:1001 ./data
```

### Can't connect to the application

1. Check if the container is running:
   ```bash
   docker-compose ps
   ```

2. Check if port 3000 is available:
   ```bash
   netstat -tuln | grep 3000
   ```

3. Try accessing from the host:
   ```bash
   curl http://localhost:3000
   ```

### Database errors

If you see Prisma/database errors, the database schema should be automatically initialized on container startup. If issues persist:
```bash
# Access the container
docker-compose exec sysregister sh

# Manually push database schema
npx prisma db push --skip-generate

# Exit the container
exit
```

Note: The database schema is automatically initialized when the container starts, so manual intervention should not be necessary in most cases.

## Production Deployment

### Reverse Proxy Setup (Nginx)

For production, use a reverse proxy like Nginx with SSL:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Security Recommendations

1. **Change JWT_SECRET**: Use a strong, random secret
2. **Use HTTPS**: Always use SSL/TLS in production
3. **Firewall**: Only expose port 443 (HTTPS) publicly
4. **Updates**: Keep Docker and the application updated
5. **Backups**: Regularly backup the `./data` directory
6. **Monitoring**: Set up monitoring and alerts

### Resource Requirements

Minimum recommended specifications:
- **CPU**: 1 core
- **RAM**: 512MB (1GB recommended)
- **Disk**: 5GB free space
- **Network**: Stable internet connection

## Support

For issues and questions:
- GitHub Issues: https://github.com/gablilli/SysRegister/issues
- Check logs: `docker-compose logs -f`

## License

See the main repository for license information.
