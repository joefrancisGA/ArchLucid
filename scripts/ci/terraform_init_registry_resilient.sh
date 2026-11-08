#!/usr/bin/env bash
# terraform init -backend=false with registry timeout + retries (HashiCorp / GitHub 504 flakes).
set -euo pipefail

ROOT_DIR="${1:?usage: terraform_init_registry_resilient.sh <repo-relative-terraform-root>}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WORKING_DIR="${REPO_ROOT}/${ROOT_DIR}"

if [[ ! -d "${WORKING_DIR}" ]]; then
  echo "terraform root not found: ${WORKING_DIR}" >&2
  exit 1
fi

export TF_PLUGIN_CACHE_DIR="${HOME}/.terraform.d/plugin-cache"
export TF_REGISTRY_CLIENT_TIMEOUT="${TF_REGISTRY_CLIENT_TIMEOUT:-90}"
export CHECKPOINT_DISABLE=1
mkdir -p "${TF_PLUGIN_CACHE_DIR}"

max_attempts="${TERRAFORM_INIT_MAX_ATTEMPTS:-10}"
attempt=1

cd "${WORKING_DIR}"

while true; do
  if terraform init -backend=false -upgrade=false; then
    echo "terraform init ok in ${ROOT_DIR}" >&2
    exit 0
  fi

  if [[ "${attempt}" -ge "${max_attempts}" ]]; then
    echo "terraform init failed after ${max_attempts} attempts in ${WORKING_DIR}" >&2
    exit 1
  fi

  rm -rf .terraform/providers 2>/dev/null || true

  sleep_seconds=$((attempt * 25))
  if [[ "${sleep_seconds}" -gt 180 ]]; then
    sleep_seconds=180
  fi
  echo "terraform init failed (attempt ${attempt}/${max_attempts}) in ${ROOT_DIR}; retrying in ${sleep_seconds}s..." >&2
  sleep "${sleep_seconds}"
  attempt=$((attempt + 1))
done
