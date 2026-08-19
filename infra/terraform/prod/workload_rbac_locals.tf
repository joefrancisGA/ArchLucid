# Unified Entra principal IDs for consumed-service RBAC (OpenAI + Key Vault).
# Merge list-style API/Worker principals with the legacy single workload_identity_principal_id input.

locals {
  workload_principal_ids_unified = distinct(compact(concat(
    local.openai_workload_principal_ids,
    var.workload_identity_principal_id != null && trimspace(var.workload_identity_principal_id) != "" ? [trimspace(var.workload_identity_principal_id)] : []
  )))
}
