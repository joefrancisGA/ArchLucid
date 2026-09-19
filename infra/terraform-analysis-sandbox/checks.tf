check "deployer_object_id_required" {
  assert {
    condition     = length(trimspace(var.deployer_object_id)) > 0
    error_message = "Set deployer_object_id to your signed-in Entra object ID (az ad signed-in-user show --query id -o tsv)."
  }
}

check "deployer_object_id_is_guid" {
  assert {
    condition     = can(regex("^[0-9a-fA-F-]{36}$", trimspace(var.deployer_object_id)))
    error_message = "deployer_object_id must be a GUID."
  }
}
