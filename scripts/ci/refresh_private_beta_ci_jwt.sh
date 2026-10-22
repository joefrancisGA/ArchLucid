#!/usr/bin/env bash
# Re-mint CI JWT immediately before private-beta Playwright so a 1h exp does not
# expire after long shell warm + earlier job setup (401 cascade on wave-3/access specs).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PRIVATE_KEY="${CI_JWT_PRIVATE_KEY_PATH:-${RUNNER_TEMP}/ci-jwt-priv.pem}"
OUT_TOKEN="${CI_JWT_OUT_TOKEN_PATH:-${RUNNER_TEMP}/ci-jwt-token.txt}"
TENANT_ID="${CI_JWT_TENANT_ID:-11111111-1111-1111-1111-111111111111}"
WORKSPACE_ID="${CI_JWT_WORKSPACE_ID:-22222222-2222-2222-2222-222222222222}"
PROJECT_ID="${CI_JWT_PROJECT_ID:-33333333-3333-3333-3333-333333333333}"
EXP_SECONDS="${CI_JWT_EXP_SECONDS:-7200}"

python3 "${REPO_ROOT}/scripts/ci/mint_ci_jwt.py" \
  --private-key "${PRIVATE_KEY}" \
  --issuer "https://ci.archlucid.local" \
  --audience "api://archlucid-live-e2e-jwt" \
  --tenant-id "${TENANT_ID}" \
  --workspace-id "${WORKSPACE_ID}" \
  --project-id "${PROJECT_ID}" \
  --exp-seconds "${EXP_SECONDS}" \
  --out-token "${OUT_TOKEN}"

echo "refresh_private_beta_ci_jwt: wrote fresh token (exp=${EXP_SECONDS}s) to ${OUT_TOKEN}"
