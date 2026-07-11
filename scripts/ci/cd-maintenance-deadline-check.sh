#!/usr/bin/env bash
# Fails when dev maintenance confirmation deadline (23:00 America/New_York) has passed.
set -euo pipefail

TARGET="${1:-}"

if [ "$TARGET" != "dev" ]; then
  exit 0
fi

HOUR=$(TZ=America/New_York date +%H)
MIN=$(TZ=America/New_York date +%M)

if [ "$HOUR" -ge 23 ]; then
  echo "::error::Dev maintenance confirmation deadline passed (${HOUR}:${MIN} ET). Deployment was not verified healthy before 23:00 — rollback should run."
  exit 1
fi

echo "Before dev maintenance confirmation deadline (${HOUR}:${MIN} ET)."
