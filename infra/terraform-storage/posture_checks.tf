check "posture_production_requires_private_blob_access" {
  assert {
    condition     = !local.posture_is_production || !var.enable_storage_account || !var.public_network_access_enabled
    error_message = "posture_tier = production requires public_network_access_enabled = false on the artifacts storage account (use terraform-private private endpoints)."
  }
}

check "posture_production_requires_geo_redundant_blob_replication" {
  assert {
    condition = !local.posture_is_production || !var.enable_storage_account || contains(
      local.posture_geo_redundant_replication_types,
      var.account_replication_type
    )
    error_message = "posture_tier = production requires account_replication_type GRS, RAGRS, GZRS, or RAGZRS when enable_storage_account is true."
  }
}
