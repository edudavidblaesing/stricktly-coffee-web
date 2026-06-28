#!/usr/bin/env bash
# deploy.sh
# Unified deployment script: pushes to GitHub and optionally deploys via Docker
#
# Usage:
#   ./deploy.sh [commit-message] [--docker]
#
# Examples:
#   ./deploy.sh "Update journey map"              # Push to GitHub only
#   ./deploy.sh "Update journey map" --docker     # Push to GitHub + deploy Docker
#   ./deploy.sh --docker                          # Use default message + deploy
#
# Before running:
#   1. Export your GitHub Personal Access Token (classic) with repo scope.
#        export GITHUB_TOKEN="YOUR_TOKEN"
#   2. Ensure git repository is initialized

set -euo pipefail

ACCOUNT="edudavidblaesing"
REPO_NAME="stricktly-coffee-web"
REPO_URL="https://github.com/${ACCOUNT}/${REPO_NAME}.git"
BRANCH_NAME=$(git symbolic-ref --short HEAD 2>/dev/null || echo "main")
DEFAULT_MESSAGE="Update site - $(date '+%Y-%m-%d %H:%M')"

# Parse arguments
COMMIT_MESSAGE="${DEFAULT_MESSAGE}"
DEPLOY_DOCKER=false

for arg in "$@"; do
  case "$arg" in
    --docker)
      DEPLOY_DOCKER=true
      ;;
    *)
      if [[ "$arg" != "--docker" ]]; then
        COMMIT_MESSAGE="$arg"
      fi
      ;;
  esac
done

# Check for required commands
if ! command -v git >/dev/null 2>&1; then
  printf '❌ git is required but not found in PATH.\n' >&2
  exit 1
fi

# Check if we're in a git repository
if [[ ! -d .git ]]; then
  printf '❌ Not a git repository. Run: git init\n' >&2
  exit 1
fi

printf '\n📦 DEPLOYMENT STARTING\n'
printf '═══════════════════════════════════════\n\n'

# Deploying on current active branch
if [[ -z "${BRANCH_NAME}" ]]; then
  BRANCH_NAME="main"
fi
printf '📌 Deploying on branch: "%s"\n' "${BRANCH_NAME}"

# Check if remote exists, add if not
if ! git remote | grep -q "^origin$"; then
  printf '🔗 Adding remote origin...\n'
  git remote add origin "${REPO_URL}"
else
  printf '🔗 Remote origin already configured\n'
fi

# Stage all changes
printf '\n📝 Staging changes...\n'
git add .

# Check if there are changes to commit
if git diff --cached --quiet; then
  printf '   ℹ️  No changes to commit\n'
  HAS_CHANGES=false
else
  # Show what's being committed
  printf '\n📋 Files changed:\n'
  git diff --cached --name-status | head -20
  
  # Commit changes
  printf '\n💾 Creating commit: "%s"\n' "${COMMIT_MESSAGE}"
  git commit -m "${COMMIT_MESSAGE}"
  HAS_CHANGES=true
fi

# Push to GitHub
if [[ "${HAS_CHANGES}" == "true" ]] || [[ $(git rev-list origin/${BRANCH_NAME}..HEAD 2>/dev/null | wc -l) -gt 0 ]]; then
  printf '\n⬆️  Pushing to GitHub (origin/%s)...\n' "${BRANCH_NAME}"
  git push origin "${BRANCH_NAME}" 2>&1 | grep -v "Total\|Delta\|Compressing\|Writing" || true
  printf '   ✅ Push complete\n'
else
  printf '\n   ℹ️  Already up to date with GitHub\n'
fi

# Deploy with Docker if requested
if [[ "${DEPLOY_DOCKER}" == "true" ]]; then
  printf '\n� DOCKER DEPLOYMENT\n'
  printf '═══════════════════════════════════════\n\n'
  
  if ! command -v docker >/dev/null 2>&1; then
    printf '   ⚠️  Docker not found, skipping Docker deployment\n'
  elif ! command -v docker-compose >/dev/null 2>&1; then
    printf '   ⚠️  docker-compose not found, skipping Docker deployment\n'
  else
    printf '�🚀 Building and starting containers...\n'
    docker-compose down 2>/dev/null || true
    docker-compose up -d --build
    
    printf '\n📊 Container status:\n'
    docker-compose ps
    
    printf '\n✅ Docker deployment complete!\n'
    printf '📡 Site available at:\n'
    printf '   - http://localhost\n'
    printf '   - http://stricktlycoffee.be (if DNS configured)\n'
  fi
fi

printf '\n═══════════════════════════════════════\n'
printf '🎉 DEPLOYMENT COMPLETE!\n'
printf '═══════════════════════════════════════\n\n'

printf '📚 Useful commands:\n'
printf '   View logs:        docker-compose logs -f\n'
printf '   Stop containers:  docker-compose down\n'
printf '   Check status:     git status\n'
printf '   View commits:     git log --oneline -5\n\n'
