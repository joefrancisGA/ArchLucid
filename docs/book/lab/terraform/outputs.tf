# Storage and app names carry a suffix. Use this map to translate the book's names to yours.
output "book_names" {
  description = "Book name to deployed name."
  value = {
    custdata      = azurerm_storage_account.custdata.name
    custarchive   = azurerm_storage_account.custarchive.name
    pay-reconcile = azurerm_linux_function_app.pay_reconcile.name
    payments-api  = azurerm_linux_web_app.payments_api.name
  }
}

output "payments_deploy_app_id" {
  value = azuread_application_registration.payments_deploy.client_id
}

output "federated_subject" {
  value = local.github_subject
}

output "collector_client_id" {
  value = azurerm_user_assigned_identity.collector.client_id
}

output "log_analytics_workspace_id" {
  value = azurerm_log_analytics_workspace.lab.id
}

# Chapter 3 Step 3: the expected scope is a human assertion. Record who wrote it and when.
output "expected_subscriptions_json" {
  value = jsonencode([{ subscriptionId = var.subscription_id, name = "sub-payments-prod" }])
}

output "user_passwords" {
  description = "Initial passwords; each user must change it at first sign-in."
  value = {
    dev-lead    = random_password.user["dev-lead"].result
    helpdesk-07 = random_password.user["helpdesk-07"].result
    analyst-04  = random_password.user["analyst-04"].result
  }
  sensitive = true
}
