#!/usr/bin/env bash
# Apply the SecureNow / inventory analysis sandbox in the current Azure CLI subscription.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
sandbox_dir="${repo_root}/infra/terraform-analysis-sandbox"

if [[ ! -f "${sandbox_dir}/terraform.tfvars" ]]; then
  echo "Missing ${sandbox_dir}/terraform.tfvars — copy terraform.tfvars.example and set deployer_object_id." >&2
  exit 1
fi

cd "${sandbox_dir}"

terraform init -upgrade
terraform validate
terraform plan -out=tfplan
terraform apply tfplan

echo ""
terraform output
