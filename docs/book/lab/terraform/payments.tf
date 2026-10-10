# The payments estate: two customer data stores, two workloads, and the roles that join them into paths.

resource "azurerm_storage_account" "custdata" {
  name                     = "custdata${local.suffix}"
  resource_group_name      = azurerm_resource_group.payments_prod.name
  location                 = azurerm_resource_group.payments_prod.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  # Hop H7: Contributor can list keys, and keys work. Chapter 9 sets this to false.
  shared_access_key_enabled = true

  # Chapter 5's opening story: a private endpoint exists, and the public endpoint is still open to all networks.
  public_network_access_enabled = true

  allow_nested_items_to_be_public = false

  # No diagnostic setting on purpose: gap G1. Chapters 5 and 6 add one.
  tags = {
    owner = "payments"
  }
}

resource "azurerm_storage_container" "customers" {
  name                  = "customers"
  storage_account_id    = azurerm_storage_account.custdata.id
  container_access_type = "private"
}

resource "azurerm_storage_account" "custarchive" {
  name                            = "custarchive${local.suffix}"
  resource_group_name             = azurerm_resource_group.payments_prod.name
  location                        = azurerm_resource_group.payments_prod.location
  account_tier                    = "Standard"
  account_replication_type        = "LRS"
  shared_access_key_enabled       = true
  allow_nested_items_to_be_public = false

  # No diagnostic setting on purpose: gap G2.
  tags = {
    owner = "payments"
  }
}

resource "azurerm_storage_container" "settlements" {
  name                  = "settlements"
  storage_account_id    = azurerm_storage_account.custarchive.id
  container_access_type = "private"
}

resource "azurerm_user_assigned_identity" "mi_pay_reconcile" {
  name                = "mi-pay-reconcile"
  resource_group_name = azurerm_resource_group.payments_prod.name
  location            = azurerm_resource_group.payments_prod.location
}

resource "azurerm_user_assigned_identity" "mi_payments_api" {
  name                = "mi-payments-api"
  resource_group_name = azurerm_resource_group.payments_prod.name
  location            = azurerm_resource_group.payments_prod.location
}

# Basic tier is the cheapest plan that supports virtual network integration, which Chapter 5 needs.
resource "azurerm_service_plan" "payments" {
  name                = "asp-payments"
  resource_group_name = azurerm_resource_group.payments_prod.name
  location            = azurerm_resource_group.payments_prod.location
  os_type             = "Linux"
  sku_name            = "B1"
}

# The Functions host needs its own storage. It is not a path target and is kept out of rg-payments-prod.
resource "azurerm_storage_account" "payments_runtime" {
  name                     = "payrt${local.suffix}"
  resource_group_name      = azurerm_resource_group.payments_runtime.name
  location                 = azurerm_resource_group.payments_runtime.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

# Hop H8: whoever deploys code here can act as mi-pay-reconcile.
resource "azurerm_linux_function_app" "pay_reconcile" {
  name                       = "pay-reconcile-${local.suffix}"
  resource_group_name        = azurerm_resource_group.payments_prod.name
  location                   = azurerm_resource_group.payments_prod.location
  service_plan_id            = azurerm_service_plan.payments.id
  storage_account_name       = azurerm_storage_account.payments_runtime.name
  storage_account_access_key = azurerm_storage_account.payments_runtime.primary_access_key
  virtual_network_subnet_id  = var.deploy_network ? azurerm_subnet.payments_app[0].id : null

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.mi_pay_reconcile.id]
  }

  site_config {
    application_stack {
      python_version = "3.11"
    }
  }

  # Declared flow for Chapter 6. AZURE_CLIENT_ID tells the SDK which attached identity to use.
  app_settings = {
    ARCHIVE_ACCOUNT = azurerm_storage_account.custarchive.name
    AZURE_CLIENT_ID = azurerm_user_assigned_identity.mi_pay_reconcile.client_id
  }
}

# The payments API from Chapter 6: the one confirmed writer to custdata.
resource "azurerm_linux_web_app" "payments_api" {
  name                      = "payments-api-${local.suffix}"
  resource_group_name       = azurerm_resource_group.payments_prod.name
  location                  = azurerm_resource_group.payments_prod.location
  service_plan_id           = azurerm_service_plan.payments.id
  virtual_network_subnet_id = var.deploy_network ? azurerm_subnet.payments_app[0].id : null

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.mi_payments_api.id]
  }

  site_config {
    application_stack {
      python_version = "3.11"
    }
  }

  app_settings = {
    CUSTOMER_ACCOUNT = azurerm_storage_account.custdata.name
    AZURE_CLIENT_ID  = azurerm_user_assigned_identity.mi_payments_api.client_id
  }
}

# Hop H5: the convergence point of all six paths.
resource "azurerm_role_assignment" "payments_deploy_contributor" {
  scope                = azurerm_resource_group.payments_prod.id
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.payments_deploy.object_id
  principal_type       = "ServicePrincipal"
}

# Hop H9. Scoped to the account; Chapter 9's P4 acceptance narrows it to the settlements container.
resource "azurerm_role_assignment" "mi_pay_reconcile_archive_reader" {
  scope                = azurerm_storage_account.custarchive.id
  role_definition_name = "Storage Blob Data Reader"
  principal_id         = azurerm_user_assigned_identity.mi_pay_reconcile.principal_id
  principal_type       = "ServicePrincipal"
}

resource "azurerm_role_assignment" "mi_payments_api_custdata_writer" {
  scope                = azurerm_storage_account.custdata.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.mi_payments_api.principal_id
  principal_type       = "ServicePrincipal"
}
