#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: ./reset-password.sh <new-password>"
  exit 1
fi

SCOPE="1qhs-projects"

echo "→ Removing old password..."
bunx vercel@latest env rm ADMIN_PASSWORD production --yes --scope "$SCOPE" 2>/dev/null || true

echo "→ Setting new password..."
printf '%s' "$1" | bunx vercel@latest env add ADMIN_PASSWORD production --scope "$SCOPE"

echo "→ Rotating session secret (revokes all sessions)..."
bunx vercel@latest env rm SESSION_SECRET production --yes --scope "$SCOPE" 2>/dev/null || true
printf '%s' "$(openssl rand -hex 32)" | bunx vercel@latest env add SESSION_SECRET production --scope "$SCOPE"

echo "→ Redeploying..."
bunx vercel@latest --yes --scope "$SCOPE" --prod >/dev/null 2>&1

echo "✓ Password changed. All sessions revoked."
