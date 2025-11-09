# Deployment Guide for stricktlycoffee.be

## Quick Start (HTTP only)

1. Build and start the container:
```bash
docker-compose up -d --build
```

2. The site will be available at:
   - http://localhost (locally)
   - http://stricktlycoffee.be (on your server)

3. Stop the container:
```bash
docker-compose down
```

## Production Deployment with HTTPS

### Option 1: Using Let's Encrypt with Certbot

1. First, deploy with HTTP only to verify DNS is working:
```bash
docker-compose up -d --build
```

2. Install Certbot on your server:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install certbot

# Or use Docker
docker run -it --rm --name certbot \
  -v "/etc/letsencrypt:/etc/letsencrypt" \
  -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
  certbot/certbot certonly --standalone -d stricktlycoffee.be -d www.stricktlycoffee.be
```

3. Stop the HTTP-only container:
```bash
docker-compose down
```

4. Copy certificates to your project:
```bash
mkdir -p ssl
sudo cp /etc/letsencrypt/live/stricktlycoffee.be/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/stricktlycoffee.be/privkey.pem ssl/key.pem
sudo chmod 644 ssl/cert.pem
sudo chmod 600 ssl/key.pem
```

5. Update Dockerfile to use SSL configuration:
```dockerfile
COPY nginx-ssl.conf /etc/nginx/conf.d/default.conf
```

6. Deploy with HTTPS:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Option 2: Using nginx-proxy with Let's Encrypt companion

1. Create a reverse proxy network:
```bash
docker network create nginx-proxy
```

2. Start nginx-proxy with Let's Encrypt:
```bash
docker run -d -p 80:80 -p 443:443 \
  --name nginx-proxy \
  --net nginx-proxy \
  -v /var/run/docker.sock:/tmp/docker.sock:ro \
  -v nginx-certs:/etc/nginx/certs \
  -v nginx-vhost:/etc/nginx/vhost.d \
  -v nginx-html:/usr/share/nginx/html \
  nginxproxy/nginx-proxy

docker run -d \
  --name nginx-proxy-acme \
  --net nginx-proxy \
  --volumes-from nginx-proxy \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v nginx-acme:/etc/acme.sh \
  nginxproxy/acme-companion
```

3. Update docker-compose.prod.yml to use nginx-proxy network:
```yaml
networks:
  web:
    external:
      name: nginx-proxy
```

4. Deploy your site:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

## DNS Configuration

Ensure your DNS records are configured:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | Your-Server-IP | 3600 |
| A | www | Your-Server-IP | 3600 |

Or use a CNAME for www:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | Your-Server-IP | 3600 |
| CNAME | www | stricktlycoffee.be | 3600 |

## Server Requirements

- Docker Engine 20.10+
- Docker Compose 2.0+
- Ports 80 and 443 open in firewall
- Domain DNS pointing to server IP

## Maintenance

### View logs:
```bash
docker-compose logs -f
```

### Restart container:
```bash
docker-compose restart
```

### Update and redeploy:
```bash
git pull
docker-compose down
docker-compose up -d --build
```

### Renew SSL certificates (if using Certbot):
```bash
sudo certbot renew
# Then copy new certificates and restart container
```

## Troubleshooting

### Site not accessible
1. Check if container is running: `docker ps`
2. Check logs: `docker-compose logs`
3. Verify DNS: `nslookup stricktlycoffee.be`
4. Check firewall: `sudo ufw status`

### SSL issues
1. Verify certificate files exist in `ssl/` directory
2. Check certificate expiry: `openssl x509 -in ssl/cert.pem -text -noout`
3. Ensure certificate paths in nginx-ssl.conf are correct

### Port conflicts
If port 80/443 is already in use:
```bash
# Check what's using the port
sudo lsof -i :80
sudo lsof -i :443

# Stop conflicting service
sudo systemctl stop apache2  # or nginx, etc.
```
