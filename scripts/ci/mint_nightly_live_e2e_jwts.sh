#!/usr/bin/env bash
# Mint the three nightly JwtBearer live-e2e tokens (admin, peer, rejector).
# Tokens must outlive demo-seed waits plus the Playwright suite inside the 95-minute job.
# mint_ci_jwt.py defaults to 3600s, which expired mid-suite on Live E2E nightly 38201873888.
set -euo pipefail

EXP_SECONDS="${NIGHTLY_JWT_EXP_SECONDS:-10800}"
PRIV="${NIGHTLY_JWT_PRIV_PEM:?NIGHTLY_JWT_PRIV_PEM is required}"
ISSUER="${NIGHTLY_JWT_ISSUER:?NIGHTLY_JWT_ISSUER is required}"
AUDIENCE="${NIGHTLY_JWT_AUDIENCE:?NIGHTLY_JWT_AUDIENCE is required}"
TENANT_ID="${NIGHTLY_JWT_TENANT_ID:?NIGHTLY_JWT_TENANT_ID is required}"
OUT_ADMIN="${NIGHTLY_JWT_OUT_ADMIN:?NIGHTLY_JWT_OUT_ADMIN is required}"
OUT_PEER="${NIGHTLY_JWT_OUT_PEER:?NIGHTLY_JWT_OUT_PEER is required}"
OUT_REJECTOR="${NIGHTLY_JWT_OUT_REJECTOR:?NIGHTLY_JWT_OUT_REJECTOR is required}"
MINT="${GITHUB_WORKSPACE:?GITHUB_WORKSPACE is required}/scripts/ci/mint_ci_jwt.py"

# Omit workspace/project claims so demo workspace A/B probes can send fixture scope headers.
python3 "${MINT}" \
  --private-key "${PRIV}" \
  --issuer "${ISSUER}" \
  --audience "${AUDIENCE}" \
  --tenant-id "${TENANT_ID}" \
  --exp-seconds "${EXP_SECONDS}" \
  --out-token "${OUT_ADMIN}"

python3 "${MINT}" \
  --private-key "${PRIV}" \
  --issuer "${ISSUER}" \
  --audience "${AUDIENCE}" \
  --tenant-id "${TENANT_ID}" \
  --exp-seconds "${EXP_SECONDS}" \
  --name "e2e-peer-reviewer" \
  --sub "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" \
  --out-token "${OUT_PEER}"

python3 "${MINT}" \
  --private-key "${PRIV}" \
  --issuer "${ISSUER}" \
  --audience "${AUDIENCE}" \
  --tenant-id "${TENANT_ID}" \
  --exp-seconds "${EXP_SECONDS}" \
  --name "e2e-rejector" \
  --sub "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee" \
  --out-token "${OUT_REJECTOR}"
