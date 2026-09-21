#!/usr/bin/env bash
# Destroy the SecureNow / inventory analysis sandbox (same state as apply-analysis-sandbox.sh).
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
sandbox_dir="${repo_root}/infra/terraform-analysis-sandbox"

cd "${sandbox_dir}"

if [[ ! -d .terraform ]]; then
  terraform init
fi

terraform destroy
