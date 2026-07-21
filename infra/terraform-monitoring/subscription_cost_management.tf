# TB-909 — subscription-scope cost anomaly alert + rollup budget (not gated by TB-903 posture tier).

data "azurerm_client_config" "current" {}

data "azurerm_subscription" "current" {
  subscription_id = data.azurerm_client_config.current.subscription_id
}

locals {
  subscription_cost_management_enabled = local.enabled && var.enable_subscription_cost_management

  subscription_rollup_budget_component_sum = sum([
    for amount in values(var.subscription_cost_rollup_budget_components) : amount
  ])

  subscription_rollup_budget_amount = local.subscription_rollup_budget_component_sum * var.subscription_rollup_budget_headroom_multiplier

  subscription_cost_contact_emails = length(var.subscription_cost_rollup_budget_contact_emails) > 0 ? var.subscription_cost_rollup_budget_contact_emails : (
    length(trimspace(var.alert_email_address)) > 0 ? [trimspace(var.alert_email_address)] : []
  )
}

resource "azurerm_cost_anomaly_alert" "subscription" {
  count = local.subscription_cost_management_enabled ? 1 : 0

  name            = var.subscription_cost_anomaly_alert_name
  display_name    = var.subscription_cost_anomaly_alert_display_name
  subscription_id = data.azurerm_subscription.current.id
  email_subject   = var.subscription_cost_anomaly_alert_email_subject
  email_addresses = local.subscription_cost_contact_emails
}

resource "azurerm_consumption_budget_subscription" "rollup" {
  count = local.subscription_cost_management_enabled ? 1 : 0

  name            = var.subscription_cost_rollup_budget_name
  subscription_id = data.azurerm_subscription.current.id

  amount     = local.subscription_rollup_budget_amount
  time_grain = "Monthly"

  time_period {
    start_date = var.subscription_cost_rollup_budget_time_period_start
  }

  notification {
    enabled        = true
    threshold      = 50.0
    operator       = "GreaterThan"
    threshold_type = "Actual"
    contact_emails = local.subscription_cost_contact_emails
  }

  notification {
    enabled        = true
    threshold      = 75.0
    operator       = "GreaterThan"
    threshold_type = "Actual"
    contact_emails = local.subscription_cost_contact_emails
  }

  notification {
    enabled        = true
    threshold      = 90.0
    operator       = "GreaterThan"
    threshold_type = "Actual"
    contact_emails = local.subscription_cost_contact_emails
  }

  notification {
    enabled        = true
    threshold      = 100.0
    operator       = "GreaterThan"
    threshold_type = "Forecasted"
    contact_emails = local.subscription_cost_contact_emails
  }
}
