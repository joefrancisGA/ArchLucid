#!/usr/bin/env bash
# Grant Enterprise commercial tier for ScopeIds.DefaultTenant in live CI (invalidates tenant hot-path cache).
#
# Usage: grant_ci_live_e2e_enterprise_tenant.sh
# Env:
#   API_URL (default http://127.0.0.1:5128)
#   LIVE_E2E_HARNESS_SECRET (required)
#   ARCHLUCID_CI_LIVE_E2E_TENANT_ID (default 11111111-1111-1111-1111-111111111111)
set -euo pipefail

API_URL="${API_URL:-http://127.0.0.1:5128}"
TENANT_ID="${ARCHLUCID_CI_LIVE_E2E_TENANT_ID:-11111111-1111-1111-1111-111111111111}"
SECRET="${LIVE_E2E_HARNESS_SECRET:-}"

if [ -z "${SECRET}" ]; then
  echo "::error::LIVE_E2E_HARNESS_SECRET is required for grant_ci_live_e2e_enterprise_tenant.sh" >&2
  exit 1
fi

status="$(curl -sS -o /dev/null -w "%{http_code}" \
  -X POST "${API_URL}/v1/e2e/tenant/grant-enterprise-commercial" \
  -H "Content-Type: application/json" \
  -H "X-ArchLucid-E2e-Harness-Secret: ${SECRET}" \
  --data "{\"tenantId\":\"${TENANT_ID}\"}")"

if [ "${status}" != "204" ]; then
  echo "::error::grant-enterprise-commercial failed (HTTP ${status}) for tenant ${TENANT_ID}" >&2
  exit 1
fi

echo "Granted Enterprise commercial tier for tenant ${TENANT_ID} (HTTP 204)."
