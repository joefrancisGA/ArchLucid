# TB-093 — grant Cognitive Services OpenAI User to workload principals on the consumed account.

resource "azurerm_role_assignment" "openai_user_workloads" {
  for_each = length(local.openai_account_id_effective) > 0 ? toset(local.openai_workload_principal_ids) : toset([])

  scope                = local.openai_account_id_effective
  role_definition_name = "Cognitive Services OpenAI User"
  principal_id         = each.value
}
