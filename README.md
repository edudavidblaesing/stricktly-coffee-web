# Strictly Coffee Website

A one-page website showcasing the journey of Willemstrick through the world of specialty coffee.

## Features

- Animated story timeline
- Interactive route map showing the coffee journey through Latin America
- Services showcase
- Responsive design
- Dockerized for easy deployment

## Quick Start

### Deploy to GitHub (and optionally Docker)

```bash
# Push changes to GitHub
./deploy.sh "Your commit message"

# Push to GitHub AND deploy with Docker
./deploy.sh "Your commit message" --docker

# Quick deploy with auto-generated message
./deploy.sh --docker
```

### Using Docker Compose Manually

```bash
# HTTP deployment (development/testing)
docker-compose up -d --build

# Or use the Docker-specific script
./deploy-docker.sh http
```

Visit `http://localhost` or `http://stricktlycoffee.be` (once DNS is configured)

### Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on deploying with HTTPS/SSL.

```bash
# Production with SSL
./deploy-docker.sh https
```

### Local Development

```bash
# Start local server
./run-local.sh

# Stop local server
./stop-local.sh
```

### Manual Docker Commands

```bash
# Build and run
docker build -t strictly-coffee .
docker run -p 8080:80 strictly-coffee

# Using docker-compose
docker-compose up -d --build
docker-compose down
docker-compose logs -f
```

## Tech Stack

- HTML5
- CSS3 (vanilla, no frameworks)
- JavaScript (vanilla)
- Nginx (Alpine Linux)
- Docker

## License

© Strictly Coffee - All rights reserved
