namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
/// Source-id slugs that hand-written merge-gate tests still assert, and that
/// azurerm v5.6.0 no longer documents under that exact name.
/// A retired slug matches only as a whole parsed type, not as a substring.
/// </summary>
internal static class TerraformAzurermRetiredResourceAliases
{
    internal static IReadOnlyList<string> Aliases { get; } =
    [
        // FilterValidatedProposals_keeps_relationship_when_active_directory_node_has_data_category_but_synthetic_service_id_used
        "active_directory",
        // FilterValidatedProposals_keeps_relationship_when_api_center_node_has_compute_category_but_synthetic_datastore_id_used
        "api_center",
        // FilterValidatedProposals_keeps_relationship_when_graph_terraform_source_id_has_surrounding_whitespace
        "app_service",
        // FilterValidatedProposals_keeps_relationship_when_entra_id_node_has_data_category_but_synthetic_service_id_used
        "azuread_application",
        // FilterValidatedProposals_keeps_relationship_when_backup_vault_node_has_compute_category_but_synthetic_datastore_id_used
        "backup_vault",
        // FilterValidatedProposals_keeps_relationship_when_cognitive_services_account_node_has_compute_category_but_synthetic_datastore_id_used
        "cognitive_services_account",
        // FilterValidatedProposals_keeps_relationship_when_data_collection_endpoint_node_has_compute_category_but_synthetic_datastore_id_used
        "data_collection_endpoint",
        // FilterValidatedProposals_keeps_relationship_when_data_lake_gen2_node_has_data_category_but_synthetic_service_id_used
        "data_lake_gen2_filesystem",
        // FilterValidatedProposals_keeps_relationship_when_extended_location_custom_node_has_compute_category_but_synthetic_datastore_id_used
        "extended_location_custom",
        // FilterValidatedProposals_keeps_relationship_when_function_app_node_has_compute_category_but_synthetic_datastore_id_used
        "function_app",
        // FilterValidatedProposals_keeps_relationship_when_graph_account_node_has_compute_category_but_synthetic_datastore_id_used
        "graph_account",
        // FilterValidatedProposals_keeps_relationship_when_healthbot_healthbot_node_has_compute_category_but_synthetic_datastore_id_used
        "healthbot_healthbot",
        // FilterValidatedProposals_keeps_relationship_when_hpc_cache_node_has_compute_category_but_synthetic_datastore_id_used
        "hpc_cache",
        // FilterValidatedProposals_keeps_relationship_when_kubernetes_configuration_flux_node_has_compute_category_but_synthetic_datastore_id_used
        "kubernetes_configuration_flux",
        // FilterValidatedProposals_keeps_relationship_when_lab_service_node_has_compute_category_but_synthetic_datastore_id_used
        "lab_service",
        // FilterValidatedProposals_keeps_relationship_when_mariadb_server_node_has_compute_category_but_synthetic_datastore_id_used
        "mariadb_server",
        // FilterValidatedProposals_keeps_relationship_when_media_services_node_has_compute_category_but_synthetic_datastore_id_used
        "media_services_account",
        // FilterValidatedProposals_keeps_relationship_when_mobile_network_node_has_compute_category_but_synthetic_datastore_id_used
        "mobile_network",
        // FilterValidatedProposals_keeps_relationship_when_neptune_cluster_node_has_data_category_but_synthetic_service_id_used
        "neptune_cluster",
        // FilterValidatedProposals_keeps_relationship_when_oracle_cloud_vmcluster_node_has_compute_category_but_synthetic_datastore_id_used
        "oracle_cloud_vmcluster",
        // FilterValidatedProposals_keeps_relationship_when_orbital_spacecraft_node_has_data_category_but_synthetic_service_id_used
        "orbital_spacecraft",
        // FilterValidatedProposals_keeps_relationship_when_pinecone_node_has_data_category_but_synthetic_service_id_used
        "pinecone",
        // FilterValidatedProposals_keeps_relationship_when_policy_assignment_node_has_data_category_but_synthetic_service_id_used
        "policy_assignment",
        // FilterValidatedProposals_keeps_relationship_when_redis_enterprise_cache_node_has_data_category_but_synthetic_service_id_used
        "redis_enterprise_cache",
        // FilterValidatedProposals_keeps_relationship_when_site_recovery_vault_node_has_data_category_but_synthetic_service_id_used
        "site_recovery_vault",
        // FilterValidatedProposals_keeps_relationship_when_sql_database_node_has_data_category_but_synthetic_service_id_used
        "sql_database",
        // FilterValidatedProposals_keeps_relationship_when_sql_managed_instance_node_has_compute_category_but_synthetic_datastore_id_used
        "sql_managed_instance",
        // FilterValidatedProposals_keeps_relationship_when_sql_server_node_has_compute_category_but_synthetic_datastore_id_used
        "sql_server",
        // FilterValidatedProposals_keeps_relationship_when_static_site_node_has_compute_category_but_synthetic_datastore_id_used
        "static_site",
        // FilterValidatedProposals_keeps_relationship_when_storage_data_lake_node_has_data_category_but_synthetic_service_id_used
        "storage_data_lake",
        // FilterValidatedProposals_keeps_relationship_when_verifiedaccess_instance_node_has_compute_category_but_synthetic_datastore_id_used
        "verifiedaccess_instance",
        // FilterValidatedProposals_keeps_relationship_when_video_indexer_node_has_compute_category_but_synthetic_datastore_id_used
        "video_indexer",
        // FilterValidatedProposals_keeps_relationship_when_voice_services_gateway_node_has_compute_category_but_synthetic_datastore_id_used
        "voice_services_communications_gateway",
        // FilterValidatedProposals_keeps_relationship_when_web_app_node_has_compute_category_but_synthetic_datastore_id_used
        "web_app",
        // FilterValidatedProposals_keeps_relationship_when_workloads_orchestrator_node_has_compute_category_but_synthetic_datastore_id_used
        "workloads_orchestrator",
        // FilterValidatedProposals_keeps_relationship_when_workloads_sap_node_has_compute_category_but_synthetic_datastore_id_used
        "workloads_sap",
        // FilterValidatedProposals_keeps_relationship_when_workloads_sap_discovery_site_node_has_data_category_but_synthetic_service_id_used
        "workloads_sap_discovery_site",
    ];

    private static readonly HashSet<string> AliasSet = new(Aliases, StringComparer.OrdinalIgnoreCase);

    internal static bool ContainsSourceId(string? sourceId)
    {
        string? slug = TerraformAzurermResourceTypeParser.TryParseSlug(sourceId);

        if (slug is null)
            return false;

        return AliasSet.Contains(slug);
    }
}
