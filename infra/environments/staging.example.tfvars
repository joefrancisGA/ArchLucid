# Example knobs for STAGING (private data plane + monitoring; edge optional).
# azure_subscription_id = "00000000-0000-0000-0000-000000000000"
# location              = "eastus2"

# terraform-private
# enable_private_data_plane = true

# terraform-container-apps
# enable_container_apps = true

# SQL read-scale-out (perf wave 8) — enable geo/read replica in azure-sql module, then inject on API/Worker:
# enable_read_replica = true
# After apply, set Container App env (or Key Vault reference):
#   ArchLucid__Persistence__ReadOnlyConnectionStringTemplate = "<primary connection string + Application Intent=ReadOnly>"
# Optional authority list / governance routes:
#   SqlServer__ReadReplica__AuthorityRunListReadsConnectionString = "<same RO listener>"
#   SqlServer__ReadReplica__FailoverGroupReadOnlyListenerConnectionString = "<failover RO listener>"
# See docs/library/READ_REPLICA_ROUTING.md. Empty template = primary fallback (safe default).

# terraform-monitoring
# enable_monitoring_stack = true  # now the default (2026-07-20); still needs resource_group_name + alert_email_address set

# terraform-edge (optional)
# enable_front_door_waf = false

# terraform-redis + terraform-container-apps (TB-2141 HotPathCache L2)
# enable_redis_cache = true   # in terraform-redis staging.tfvars
# hot_path_cache_redis_connection_string = "<sensitive>"   # in terraform-container-apps staging.tfvars
# See docs/library/SCALE_TIER_CACHE_GUIDE.md
