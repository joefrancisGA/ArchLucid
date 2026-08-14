# Example knobs for PRODUCTION (private endpoints, edge, HA SQL listener — coordinate change windows).
# azure_subscription_id = "00000000-0000-0000-0000-000000000000"
# location              = "eastus2"

# terraform-private
# enable_private_data_plane = true

# terraform-storage (before Container Apps when large-payload offload is on)
# enable_storage_account = true

# terraform-container-apps
# enable_container_apps = true

# terraform-sql-failover (after servers + databases exist)
# enable_sql_failover_group = true

# SQL read-scale-out (perf wave 8) — pair with failover RO listener after enable_sql_failover_group:
# enable_read_replica = true
# Inject on API/Worker (Key Vault preferred):
#   ArchLucid__Persistence__ReadOnlyConnectionStringTemplate = "<listener + Application Intent=ReadOnly>"
#   SqlServer__ReadReplica__AuthorityRunListReadsConnectionString = "<same>"
#   SqlServer__ReadReplica__FailoverGroupReadOnlyListenerConnectionString = "<failover RO listener>"
# Confirm /health/ready sql-read-replica is Healthy. See docs/library/READ_REPLICA_ROUTING.md.

# terraform-edge
# enable_front_door_waf = true

# terraform-monitoring
# enable_monitoring_stack = true  # now the default (2026-07-20); still needs resource_group_name + alert_email_address set

# terraform-redis + terraform-container-apps (TB-2141 HotPathCache L2)
# enable_redis_cache = true   # in terraform-redis production.tfvars (private endpoint recommended)
# hot_path_cache_redis_connection_string = "<sensitive>"   # in terraform-container-apps production.tfvars
# See docs/library/SCALE_TIER_CACHE_GUIDE.md
