#!/usr/bin/env bash
# deploy-docker.sh
# Deploys the Stricktly Coffee website using Docker Compose
#
# Usage:
#   ./deploy-docker.sh [http|https|prod]
#
# Examples:
#   ./deploy-docker.sh http     # Deploy with HTTP only
#   ./deploy-docker.sh https    # Deploy with HTTPS (requires SSL certs)
#   ./deploy-docker.sh prod     # Deploy with production config

set -euo pipefail

MODE="${1:-http}"

case "${MODE}" in
  http)
    echo "🚀 Deploying with HTTP configuration..."
    docker-compose down 2>/dev/null || true
    docker-compose up -d --build
    echo "✅ Deployment complete!"
    echo "📡 Site available at:"
    echo "   - http://localhost"
    echo "   - http://stricktlycoffee.be (if DNS configured)"
    ;;
    
  https)
    echo "🚀 Deploying with HTTPS configuration..."
    
    # Check if SSL certificates exist
    if [ ! -d "ssl" ] || [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
      echo "❌ Error: SSL certificates not found!"
      echo "Please ensure ssl/cert.pem and ssl/key.pem exist."
      echo "See DEPLOYMENT.md for instructions on obtaining SSL certificates."
      exit 1
    fi
    
    # Update Dockerfile to use SSL config
    if grep -q "# COPY nginx-ssl.conf" Dockerfile; then
      sed -i.bak 's/COPY nginx.conf /# COPY nginx.conf /' Dockerfile
      sed -i.bak 's/# COPY nginx-ssl.conf /COPY nginx-ssl.conf /' Dockerfile
      echo "✅ Dockerfile updated to use HTTPS configuration"
    fi
    
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    docker-compose -f docker-compose.prod.yml up -d --build
    
    echo "✅ Deployment complete!"
    echo "🔒 Site available at:"
    echo "   - https://localhost"
    echo "   - https://stricktlycoffee.be (if DNS configured)"
    ;;
    
  prod)
    echo "🚀 Deploying with production configuration..."
    
    if [ ! -f "docker-compose.prod.yml" ]; then
      echo "❌ Error: docker-compose.prod.yml not found!"
      exit 1
    fi
    
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    docker-compose -f docker-compose.prod.yml up -d --build
    
    echo "✅ Deployment complete!"
    echo "📡 Site deployed in production mode"
    ;;
    
  *)
    echo "❌ Invalid mode: ${MODE}"
    echo "Usage: ./deploy-docker.sh [http|https|prod]"
    exit 1
    ;;
esac

echo ""
echo "📊 Container status:"
docker ps | grep stricktly-coffee || echo "No containers running"

echo ""
echo "📝 View logs with: docker-compose logs -f"
echo "🛑 Stop with: docker-compose down"
