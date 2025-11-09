#!/bin/bash

# Strictly Coffee - Local Docker Test Script
# This script builds and runs the website locally using Docker Compose

echo "☕ Strictly Coffee - Local Docker Test"
echo "════════════════════════════════════════"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed"
    echo "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo "✅ Docker is installed and running"
echo ""

# Check if we're in the right directory
if [ ! -f "Dockerfile" ]; then
    echo "❌ Error: Dockerfile not found"
    echo "Please run this script from the strictly-coffee-website directory"
    exit 1
fi

echo "📦 Building Docker image..."
echo ""

# Build the Docker image
docker-compose -f docker-compose.local.yml build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "🚀 Starting the website..."
echo ""

# Start the container
docker-compose -f docker-compose.local.yml up -d

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Failed to start container. Please check the error messages above."
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ SUCCESS! Your website is now running!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🌐 Open your browser and visit:"
echo ""
echo "    http://localhost"
echo ""
echo "  (If another service is already on port 80, update docker-compose.yml to map a different host port like 8080:80.)"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 Useful commands:"
echo ""
echo "  View logs:        docker-compose -f docker-compose.local.yml logs -f"
echo "  Stop website:     docker-compose -f docker-compose.local.yml down"
echo "  Restart:          docker-compose -f docker-compose.local.yml restart"
echo "  Rebuild:          docker-compose -f docker-compose.local.yml up -d --build"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
