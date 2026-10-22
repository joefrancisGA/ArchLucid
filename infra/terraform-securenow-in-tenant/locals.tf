locals {
  edition_config = lower(var.edition) == "uhg" ? "Uhg" : "Generic"

  # UHG cannot opt in. Generic stays off until enable_support_telemetry is set.
  support_telemetry_enabled = local.edition_config == "Generic" && var.enable_support_telemetry

  storage_account_name = length(trimspace(var.storage_account_name)) > 0 ? trimspace(var.storage_account_name) : substr("${replace(var.name_prefix, "-", "")}st", 0, 24)

  openai_account_name = length(trimspace(var.openai_account_name)) > 0 ? trimspace(var.openai_account_name) : substr("${replace(var.name_prefix, "-", "")}oai", 0, 24)

  virtual_network_name = "${var.name_prefix}-vnet"

  tags = merge(var.tags, {
    product = "securenow"
    edition = local.edition_config
    hosting = "InTenant"
  })
}

data "azurerm_client_config" "current" {}
