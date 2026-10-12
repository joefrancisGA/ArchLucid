resource "azurerm_role_assignment" "analyst_04_conditioned_reader" {
  scope                = azurerm_storage_account.custdata.id
  role_definition_name = "Storage Blob Data Reader"
  principal_id         = azuread_user.analyst_04.object_id
  principal_type       = "User"
  condition_version    = "2.0"
  condition            = <<-EOT
    (
      (!(ActionMatches{'Microsoft.Storage/storageAccounts/blobServices/containers/blobs/read'}))
      OR
      (
        @Resource[Microsoft.Storage/storageAccounts/blobServices/containers:name]
          StringEquals 'reports'
      )
    )
  EOT
}
