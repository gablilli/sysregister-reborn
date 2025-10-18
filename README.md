# SysRegister Reborn

⭐ Star us on GitHub — your support keeps us motivated!

SysRegister offers an improved web UI for the ClasseViva school register and adds a few quality-of-life features.

## 🐳 Docker Deployment (Self-Hosting)

To avoid geo-blocking issues with cloud hosting providers like Vercel, you can self-host SysRegister using Docker.

### Quick Start

```bash
# Clone the repository
git clone https://github.com/gablilli/SysRegister.git
cd SysRegister

# Configure environment
cp .env.docker .env
# Edit .env and set JWT_SECRET to a secure random string

# Build and run with Docker Compose
docker-compose up -d

# Access the application
open http://localhost:3000
```

📖 **See [DOCKER_SETUP.md](./DOCKER_SETUP.md) for detailed instructions**, including:
- Production deployment with Nginx
- SSL/HTTPS setup
- Backup and maintenance
- Troubleshooting

### Why Self-Host?

ClasseViva's API blocks requests from certain cloud hosting providers (Vercel, PythonAnywhere, etc.) using geo-blocking/WAF. Self-hosting on your own server or VPS with a non-blocked IP address solves this issue.
