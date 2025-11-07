# Strictly Coffee Website

A one-page website showcasing the journey of Willemstrick through the world of specialty coffee.

## Features

- Animated story timeline
- Interactive route map showing the coffee journey through Latin America
- Services showcase
- Responsive design
- Dockerized for easy deployment

## Deployment with Dokploy

This repository is configured for automatic deployment with Dokploy.

### Setup Instructions

1. Push this repository to GitHub
2. In Dokploy, create a new application
3. Connect your GitHub repository
4. Dokploy will automatically detect the Dockerfile and deploy
5. Your website will be live!

### Local Development

To run locally with Docker:

```bash
docker build -t strictly-coffee .
docker run -p 8080:80 strictly-coffee
```

Visit `http://localhost:8080` to view the site.

## Tech Stack

- HTML5
- CSS3 (vanilla, no frameworks)
- JavaScript (vanilla)
- Nginx (Alpine Linux)
- Docker

## License

© Strictly Coffee - All rights reserved
