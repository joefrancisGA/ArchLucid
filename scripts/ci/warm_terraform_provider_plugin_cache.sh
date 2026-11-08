#!/usr/bin/env bash
# Sequential terraform init across CI public-stack roots — populates ~/.terraform.d/plugin-cache once per push.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
INIT="${REPO_ROOT}/scripts/ci/terraform_init_registry_resilient.sh"

# Keep in sync with terraform-validate-public-stacks.matrix.directory in .github/workflows/ci.yml
roots=(
  infra/terraform
  infra/terraform-edge
  infra/terraform-entra
  infra/terraform-acr
  infra/terraform-container-apps
  infra/terraform-storage
  infra/terraform-redis
  infra/terraform-cosmos
  infra/terraform-monitoring
  infra/terraform-sql-failover
  infra/terraform-openai
  infra/terraform-keyvault
  infra/terraform-orchestrator
  infra/terraform-logicapps
  infra/terraform-servicebus
  infra/terraform-pilot
  infra/terraform/prod
  infra/terraform-securenow-in-tenant
  infra/terraform-private
)

failed=0
for root in "${roots[@]}"; do
  echo "Prewarm: ${root}" >&2
  if ! bash "${INIT}" "${root}"; then
    echo "Prewarm soft-fail: ${root} (continuing remaining roots)" >&2
    failed=$((failed + 1))
  fi
done

if [[ "${failed}" -gt 0 ]]; then
  echo "Terraform provider plugin cache prewarm finished with ${failed}/${#roots[@]} soft-failures; validate jobs retry init independently." >&2
  exit 0
fi

echo "Terraform provider plugin cache prewarm complete (${#roots[@]} roots)." >&2
