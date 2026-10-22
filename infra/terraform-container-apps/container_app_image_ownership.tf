# TB-657 — Container App runtime image ownership
#
# Routine CD (`.github/workflows/cd.yml`) rolls API, worker, operator UI, and marketing UI revisions via
# `az containerapp update --image` (same `archlucid-ui` digest for both UI apps — TB-2016/TB-2020).
# Terraform `api_container_image` / `worker_container_image` / `ui_container_image` variables seed
# warm-start pins only; `lifecycle.ignore_changes` on each `azurerm_container_app` prevents
# `terraform apply` from reverting CD rollouts.
#
# See `docs/library/DEPLOYMENT_CD_PIPELINE.md` § Operational considerations.
