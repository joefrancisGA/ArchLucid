#!/usr/bin/env bash
# Dev CD maintenance window: deploy only during 22:00-22:59 America/New_York unless overridden.
set -euo pipefail

TARGET="${1:-}"
OVERRIDE="${CD_MAINTENANCE_WINDOW_OVERRIDE:-}"

if [ "$TARGET" != "dev" ]; then
  echo "Maintenance window guard skipped (target=${TARGET})."
  exit 0
fi

if [ "$OVERRIDE" = "true" ]; then
  echo "CD_MAINTENANCE_WINDOW_OVERRIDE=true — maintenance window bypassed."
  exit 0
fi

HOUR=$(TZ=America/New_York date +%H)
MIN=$(TZ=America/New_York date +%M)

if [ "$HOUR" != "22" ]; then
  echo "::error::Dev CD is allowed only during 22:00-23:00 America/New_York (current ${HOUR}:${MIN} ET). Set repository variable CD_MAINTENANCE_WINDOW_OVERRIDE=true for break-glass."
  exit 1
fi

echo "Within dev maintenance window (${HOUR}:${MIN} America/New_York)."
