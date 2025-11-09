# Docker Configuration Summary

## Files Created/Updated

### Docker Configuration Files
- `docker-compose.yml` - Standard development/staging deployment (HTTP)
- `docker-compose.prod.yml` - Production deployment with SSL support
- `Dockerfile` - Container image definition
- `.dockerignore` - Optimizes build by excluding unnecessary files

### Nginx Configuration
- `nginx.conf` - HTTP configuration for stricktlycoffee.be
- `nginx-ssl.conf` - HTTPS configuration with SSL/TLS support

### Deployment Scripts
- `deploy-docker.sh` - Automated deployment script with HTTP/HTTPS/prod modes
- `DEPLOYMENT.md` - Complete deployment guide

## Quick Commands

### Development/Testing
```bash
# Start HTTP server
docker-compose up -d --build

# Or use the script
./deploy-docker.sh http

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Production Deployment
```bash
# Deploy with production config
./deploy-docker.sh prod

# Or manually
docker-compose -f docker-compose.prod.yml up -d --build
```

### HTTPS/SSL Setup
```bash
# After obtaining SSL certificates
./deploy-docker.sh https
```

## Port Configuration

The Docker setup exposes:
- **Port 80**: HTTP traffic
- **Port 443**: HTTPS traffic (when SSL configured)

## Domain Configuration

The site is configured for:
- Primary domain: `stricktlycoffee.be`
- www subdomain: `www.stricktlycoffee.be` (redirects to primary)

## DNS Requirements

Configure these DNS records with your domain registrar:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_SERVER_IP | 3600 |
| A | www | YOUR_SERVER_IP | 3600 |

Or use CNAME for www:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_SERVER_IP | 3600 |
| CNAME | www | stricktlycoffee.be | 3600 |

## Next Steps

1. **Test Locally**: Run `docker-compose up -d --build` to test locally
2. **Configure DNS**: Point stricktlycoffee.be to your server's IP
3. **Deploy to Server**: Copy files to server and run deployment
4. **Setup SSL**: Obtain SSL certificates (Let's Encrypt recommended)
5. **Enable HTTPS**: Use `./deploy-docker.sh https` after SSL setup

## Monitoring

```bash
# Check container status
docker ps

# View real-time logs
docker-compose logs -f

# Check nginx config
docker exec stricktly-coffee nginx -t

# Restart container
docker-compose restart
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 80/443
sudo lsof -i :80
sudo lsof -i :443

# Stop conflicting service
sudo systemctl stop apache2  # or nginx
```

### Container Won't Start
```bash
# Check logs
docker-compose logs web

# Validate nginx config
docker exec stricktly-coffee nginx -t
```

### Site Not Accessible
1. Verify container is running: `docker ps`
2. Check firewall allows ports 80/443
3. Verify DNS points to server IP: `nslookup stricktlycoffee.be`
4. Check nginx logs: `docker-compose logs`

## Security Notes

- HTTP is suitable for development/testing
- Production should use HTTPS (nginx-ssl.conf)
- Keep SSL certificates secure and updated
- Consider using Let's Encrypt for automatic renewals
- Security headers are configured in nginx conf
