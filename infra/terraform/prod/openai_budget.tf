# OpenAI consumption budget (TB-093 acceptance — preserved from terraform-openai pattern).
resource "azurerm_consumption_budget_resource_group" "openai" {
  count = var.enable_openai_consumption_budget ? 1 : 0

  name              = var.openai_consumption_budget_name
  resource_group_id = azurerm_resource_group.prod.id

  amount     = var.openai_consumption_budget_amount
  time_grain = "Monthly"

  time_period {
    start_date = var.openai_consumption_budget_period_start
  }

  notification {
    enabled        = true
    threshold      = 90
    operator       = "GreaterThan"
    contact_emails = length(var.openai_consumption_budget_contact_emails) > 0 ? var.openai_consumption_budget_contact_emails : null
    contact_roles  = length(var.openai_consumption_budget_contact_emails) > 0 ? null : var.openai_consumption_budget_contact_roles
  }

  notification {
    enabled        = true
    threshold      = 100
    operator       = "GreaterThan"
    contact_emails = length(var.openai_consumption_budget_contact_emails) > 0 ? var.openai_consumption_budget_contact_emails : null
    contact_roles  = length(var.openai_consumption_budget_contact_emails) > 0 ? null : var.openai_consumption_budget_contact_roles
  }
}
