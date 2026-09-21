data "azurerm_client_config" "current" {}

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

locals {
  suffix = random_string.suffix.result

  resource_group_name = length(trimspace(var.resource_group_name)) > 0 ? trimspace(var.resource_group_name) : "rg-${var.name_prefix}-analysis"

  # Globally unique name seeds (Azure limits differ per resource type).
  storage_account_name = substr(replace("${var.name_prefix}${local.suffix}sa", "-", ""), 0, 24)
  key_vault_name       = substr("${var.name_prefix}-${local.suffix}-kv", 0, 24)
  sql_server_name      = "${var.name_prefix}${local.suffix}sql"
  sql_admin_login      = "sqladmin${local.suffix}"

  merged_tags = merge(
    var.tags,
    {
      sandbox_id = local.suffix
    }
  )

  sql_connection_string_app = format(
    "Server=tcp:%s.database.windows.net,1433;Initial Catalog=%s;User ID=%s;Password=%s;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;",
    azurerm_mssql_server.main.name,
    azurerm_mssql_database.app.name,
    local.sql_admin_login,
    random_password.sql_admin.result
  )

  sql_connection_string_tenant = format(
    "Server=tcp:%s.database.windows.net,1433;Initial Catalog=%s;User ID=%s;Password=%s;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;",
    azurerm_mssql_server.main.name,
    azurerm_mssql_database.tenant.name,
    local.sql_admin_login,
    random_password.sql_admin.result
  )

  blob_service_uri = azurerm_storage_account.artifacts.primary_blob_endpoint
}

resource "random_password" "sql_admin" {
  length  = 24
  special = true
}

resource "azurerm_resource_group" "main" {
  name     = local.resource_group_name
  location = var.location
  tags     = local.merged_tags
}

resource "azurerm_consumption_budget_resource_group" "sandbox" {
  count = length(trimspace(var.budget_contact_email)) > 0 ? 1 : 0

  name              = "budget-${var.name_prefix}-${local.suffix}"
  resource_group_id = azurerm_resource_group.main.id

  amount     = var.monthly_budget_usd
  time_grain = "Monthly"

  time_period {
    start_date = formatdate("2006-01-02T00:00:00Z", timestamp())
  }

  notification {
    enabled        = true
    threshold      = 80
    operator       = "GreaterThan"
    threshold_type = "Actual"
    contact_emails = [trimspace(var.budget_contact_email)]
  }

  notification {
    enabled        = true
    threshold      = 100
    operator       = "GreaterThan"
    threshold_type = "Forecasted"
    contact_emails = [trimspace(var.budget_contact_email)]
  }

  lifecycle {
    ignore_changes = [time_period]
  }
}
