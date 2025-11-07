#!/usr/bin/env bash
# github-initial-deploy.sh
# Bootstraps a local repository and pushes an initial commit to GitHub.
#
# Usage:
#   ./deploy.sh [repo-name|repo-url] [branch-name] [commit-message]
# Example:
#   ./deploy.sh stricktly-coffee-web main "Initial deploy"
#   ./deploy.sh https://github.com/edudavidblaesing/stricktly-coffee-web.git
#
# Before running:
#   1. Export your GitHub Personal Access Token (classic) with repo scope.
#        export GITHUB_TOKEN="YOUR_GITHUB_TOKEN_PLACEHOLDER"
#   2. Ensure the target repository does not already exist, or delete the
#      remote first if you want this script to create it.
#
# Notes:
#   - The script can create the remote repository for you via GitHub's REST API.
#   - All commands run in the current working directory.
#   - Remote URL authentication uses HTTPS with the provided token.

set -euo pipefail

ACCOUNT="edudavidblaesing"
DEFAULT_REPO_NAME="stricktly-coffee-web"
DEFAULT_REPO_URL="https://github.com/${ACCOUNT}/${DEFAULT_REPO_NAME}.git"
TOKEN=${GITHUB_TOKEN:?YOUR_GITHUB_TOKEN_PLACEHOLDER}

if [[ "${TOKEN}" == "YOUR_GITHUB_TOKEN_PLACEHOLDER" ]]; then
  printf '⚠️  Please export GITHUB_TOKEN with a valid GitHub token before running this script.\n' >&2
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  printf '❌ git is required but not found in PATH.\n' >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  printf '❌ curl is required but not found in PATH.\n' >&2
  exit 1
fi

TARGET="${1:-${DEFAULT_REPO_NAME}}"
BRANCH_NAME="${2:-main}"
COMMIT_MESSAGE="${3:-Initial deploy}"

if [[ "${TARGET}" == https://* ]]; then
  trimmed_target="${TARGET%/}"
  REPO_URL="${trimmed_target%.git}.git"
  repo_path="${REPO_URL#https://github.com/}"
  if [[ "${repo_path}" == "${REPO_URL}" ]]; then
    printf 'Expected a GitHub URL but received "%s".\n' "${TARGET}" >&2
    exit 1
  fi
  REPO_OWNER="${repo_path%%/*}"
  repo_name_with_ext="${repo_path#*/}"
  REPO_NAME="${repo_name_with_ext%.git}"
else
  REPO_OWNER="${ACCOUNT}"
  REPO_NAME="${TARGET}"
  REPO_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}.git"
fi

if [[ -z "${REPO_OWNER}" || -z "${REPO_NAME}" ]]; then
  printf 'Unable to determine repository owner/name from input "%s".\n' "${TARGET}" >&2
  exit 1
fi

AUTH_REMOTE_URL="https://${ACCOUNT}:${TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git"

create_remote_repo() {
  printf 'Creating GitHub repository "%s/%s"...\n' "${ACCOUNT}" "${REPO_NAME}"
  local response
  response=$(curl -sS -w '%{http_code}' \
    -H 'Accept: application/vnd.github+json' \
    -H 'X-GitHub-Api-Version: 2022-11-28' \
    -H "Authorization: Bearer ${TOKEN}" \
    https://api.github.com/user/repos \
    -d "{\"name\":\"${REPO_NAME}\"}")

  local http_status=${response: -3}
  local body=${response::-3}

  if [[ ${http_status} == "201" ]]; then
    printf '✅ GitHub repository created.\n'
    return 0
  elif [[ ${http_status} == "422" && ${body} == *"name already exists"* ]]; then
    printf 'ℹ️  Repository already exists on GitHub; continuing.\n'
    return 0
  else
    printf '❌ Failed to create repository (HTTP %s).\n' "${http_status}" >&2
    printf '%s\n' "${body}" >&2
    exit 1
  fi
}

if [[ ! -d .git ]]; then
  printf 'Initializing new git repository...\n'
  git init
  git checkout -b "${BRANCH_NAME}"
else
  current_branch=$(git symbolic-ref --short HEAD 2>/dev/null || true)
  if [[ -n "${current_branch}" && "${current_branch}" != "${BRANCH_NAME}" ]]; then
    printf 'Switching from branch "%s" to "%s"...\n' "${current_branch}" "${BRANCH_NAME}"
    git checkout -B "${BRANCH_NAME}"
  fi
fi

if [[ -z "$(git remote 2>/dev/null)" ]]; then
  printf 'Adding origin remote...\n'
  git remote add origin "${AUTH_REMOTE_URL}"
else
  printf 'Remote(s) already configured; ensuring origin matches...\n'
  git remote set-url origin "${AUTH_REMOTE_URL}"
fi

if [[ "${REPO_OWNER}" == "${ACCOUNT}" ]]; then
  create_remote_repo
else
  printf 'ℹ️  Skipping GitHub repo creation because owner "%s" differs from ACCOUNT "%s".\n' "${REPO_OWNER}" "${ACCOUNT}"
fi

printf 'Staging files...\n'
git add .

if git diff --cached --quiet; then
  printf 'ℹ️  No staged changes detected; skipping commit.\n'
else
  printf 'Creating commit "%s"...\n' "${COMMIT_MESSAGE}"
  git commit -m "${COMMIT_MESSAGE}"
fi

printf 'Pushing to GitHub (origin/%s)...\n' "${BRANCH_NAME}"
git push -u origin "${BRANCH_NAME}"

printf '🚀 Initial deployment complete.\n'
