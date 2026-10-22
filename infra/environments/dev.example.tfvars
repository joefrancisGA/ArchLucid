# Example knobs for DEVELOPMENT / shared non-prod (copy per root or merge into root tfvars).
# Uncomment and align variable names with the target root (see infra/<root>/variables.tf).

# azure_subscription_id = "00000000-0000-0000-0000-000000000000"
# location              = "centralus"

# terraform-container-apps
# enable_container_apps   = true
# enable_private_sql      = false

# Least-privilege SQL runtime identity, separate from the API's system-assigned identity used for
# schema bootstrap (see docs/security/MANAGED_IDENTITY_SQL_BLOB.md). After apply, create a matching
# SQL user (CREATE USER [<api_sql_runtime_identity_name output>] FROM EXTERNAL PROVIDER) in the tenant
# catalog database(s), add it to the [ArchLucidApp] role, and build ConnectionStrings:ArchLucidRuntime
# using api_sql_runtime_identity_client_id.
# enable_api_sql_runtime_identity = true

# terraform-private
# enable_private_data_plane = false

# terraform-edge
# enable_front_door_waf = false
