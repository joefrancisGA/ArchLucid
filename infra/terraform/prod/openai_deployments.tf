# Azure OpenAI model deployments (TB-093) — GPT-5.6 Luna / Terra / Sol tier stack.
resource "azurerm_cognitive_deployment" "chat" {
  count = var.openai_compose_mode == "create" && var.openai_enable_chat_deployment ? 1 : 0

  name                 = var.openai_chat_deployment_name
  cognitive_account_id = azurerm_cognitive_account.openai[0].id

  model {
    format  = "OpenAI"
    name    = var.openai_chat_model_name
    version = var.openai_chat_model_version
  }

  sku {
    name     = var.openai_chat_sku_name
    capacity = var.openai_chat_capacity
  }
}

resource "azurerm_cognitive_deployment" "economy" {
  count = var.openai_compose_mode == "create" && var.openai_enable_economy_deployment ? 1 : 0

  name                 = var.openai_economy_deployment_name
  cognitive_account_id = azurerm_cognitive_account.openai[0].id

  model {
    format  = "OpenAI"
    name    = var.openai_economy_model_name
    version = var.openai_economy_model_version
  }

  sku {
    name     = var.openai_chat_sku_name
    capacity = var.openai_economy_capacity
  }
}

resource "azurerm_cognitive_deployment" "premium" {
  count = var.openai_compose_mode == "create" && var.openai_enable_premium_deployment ? 1 : 0

  name                 = var.openai_premium_deployment_name
  cognitive_account_id = azurerm_cognitive_account.openai[0].id

  model {
    format  = "OpenAI"
    name    = var.openai_premium_model_name
    version = var.openai_premium_model_version
  }

  sku {
    name     = var.openai_chat_sku_name
    capacity = var.openai_premium_capacity
  }
}

resource "azurerm_cognitive_deployment" "embedding" {
  count = var.openai_compose_mode == "create" && var.openai_enable_embedding_deployment ? 1 : 0

  name                 = var.openai_embedding_deployment_name
  cognitive_account_id = azurerm_cognitive_account.openai[0].id

  model {
    format  = "OpenAI"
    name    = var.openai_embedding_model_name
    version = var.openai_embedding_model_version
  }

  sku {
    name     = "Standard"
    capacity = var.openai_embedding_capacity
  }
}
