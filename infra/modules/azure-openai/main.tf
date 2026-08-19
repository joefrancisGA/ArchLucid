resource "azurerm_cognitive_account" "openai" {
  name                  = var.account_name
  location              = var.location
  resource_group_name   = var.resource_group_name
  kind                  = "OpenAI"
  sku_name              = "S0"
  custom_subdomain_name = var.account_name

  tags = var.tags
}

resource "azurerm_cognitive_deployment" "default" {
  name                 = var.deployment_name
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = var.model_name
    version = var.model_version
  }

  sku {
    name     = var.sku_name
    capacity = var.sku_capacity
  }
}

resource "azurerm_cognitive_deployment" "economy" {
  count = var.enable_economy_deployment ? 1 : 0

  name                 = var.economy_deployment_name
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = var.economy_model_name
    version = var.economy_model_version
  }

  sku {
    name     = var.sku_name
    capacity = var.economy_sku_capacity
  }
}

resource "azurerm_cognitive_deployment" "premium" {
  count = var.enable_premium_deployment ? 1 : 0

  name                 = var.premium_deployment_name
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = var.premium_model_name
    version = var.premium_model_version
  }

  sku {
    name     = var.sku_name
    capacity = var.premium_sku_capacity
  }
}
