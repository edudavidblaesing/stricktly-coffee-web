#!/bin/bash

# Strictly Coffee - Stop Local Docker Script
# This script stops the running Docker container

echo "☕ Strictly Coffee - Stopping Local Server"
echo "═══════════════════════════════════════════"
echo ""

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found"
    echo "Please run this script from the strictly-coffee-website directory"
    exit 1
fi

echo "🛑 Stopping Docker container..."
echo ""

# Stop the container
docker-compose down

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Container stopped successfully!"
    echo ""
else
    echo ""
    echo "❌ Failed to stop container"
    exit 1
fi
