using ArchLucid.KnowledgeGraph;

namespace ArchLucid.Application.Runs.Orchestration;

internal static class TopologyProposalTerraformSourceIdHeuristics
{
    internal static void AddGraphNodeSyntheticLabelEndpointKeys(
        HashSet<string> endpointKeys,
        string? label,
        string? category,
        string? sourceId)
    {
        if (string.IsNullOrWhiteSpace(label))
            return;

        if (IsDatastoreCategory(category))
        {
            TopologyProposalRelationshipEndpointIndex.AddSyntheticDatastoreEndpointKey(endpointKeys, label);

            if (LooksLikeTerraformServiceSourceId(sourceId))
                TopologyProposalRelationshipEndpointIndex.AddSyntheticServiceEndpointKey(endpointKeys, label);

            return;
        }

        if (string.IsNullOrWhiteSpace(category))
        {
            // Inventoried nodes may omit category; accept both synthetic service and datastore aliases.
            TopologyProposalRelationshipEndpointIndex.AddSyntheticServiceEndpointKey(endpointKeys, label);
            TopologyProposalRelationshipEndpointIndex.AddSyntheticDatastoreEndpointKey(endpointKeys, label);
            return;
        }

        TopologyProposalRelationshipEndpointIndex.AddSyntheticServiceEndpointKey(endpointKeys, label);

        if (LooksLikeTerraformDatastoreSourceId(sourceId))
            TopologyProposalRelationshipEndpointIndex.AddSyntheticDatastoreEndpointKey(endpointKeys, label);
    }

    internal static void AddGraphNodeSyntheticLabelResolutionAliases(
        Dictionary<string, string> aliasToNodeId,
        string? label,
        string? category,
        string? sourceId,
        string nodeId)
    {
        if (string.IsNullOrWhiteSpace(label))
            return;

        if (IsDatastoreCategory(category))
        {
            TopologyProposalRelationshipEndpointIndex.AddResolutionAlias(
                aliasToNodeId,
                TopologyProposalRelationshipEndpointIndex.BuildSyntheticDatastoreNodeId(label),
                nodeId);

            if (LooksLikeTerraformServiceSourceId(sourceId))
            {
                TopologyProposalRelationshipEndpointIndex.AddResolutionAlias(
                    aliasToNodeId,
                    TopologyProposalRelationshipEndpointIndex.BuildSyntheticServiceNodeId(label),
                    nodeId);
            }

            return;
        }

        if (string.IsNullOrWhiteSpace(category))
        {
            TopologyProposalRelationshipEndpointIndex.AddResolutionAlias(
                aliasToNodeId,
                TopologyProposalRelationshipEndpointIndex.BuildSyntheticServiceNodeId(label),
                nodeId);
            TopologyProposalRelationshipEndpointIndex.AddResolutionAlias(
                aliasToNodeId,
                TopologyProposalRelationshipEndpointIndex.BuildSyntheticDatastoreNodeId(label),
                nodeId);
            return;
        }

        TopologyProposalRelationshipEndpointIndex.AddResolutionAlias(
            aliasToNodeId,
            TopologyProposalRelationshipEndpointIndex.BuildSyntheticServiceNodeId(label),
            nodeId);

        if (LooksLikeTerraformDatastoreSourceId(sourceId))
        {
            TopologyProposalRelationshipEndpointIndex.AddResolutionAlias(
                aliasToNodeId,
                TopologyProposalRelationshipEndpointIndex.BuildSyntheticDatastoreNodeId(label),
                nodeId);
        }
    }

    internal static bool LooksLikeTerraformDatastoreSourceId(string? sourceId)
    {
        if (string.IsNullOrWhiteSpace(sourceId))
            return false;

        string normalized = sourceId.Trim();

        return normalized.Contains("mssql", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("sql_managed_instance", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("storage_account", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("cosmosdb", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("postgresql", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("mysql", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("redis_cache", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("sql_database", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("sql_server", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("key_vault", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("search_service", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("eventhub_namespace", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("cognitive_account", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("synapse_workspace", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("data_factory", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("mariadb", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("machine_learning", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("databricks", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("kusto_cluster", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("app_configuration", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("netapp", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("recovery_services", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("site_recovery", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("private_endpoint", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("log_analytics", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("application_insights", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("managed_disk", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("stream_analytics", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("iothub", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("powerbi", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("eventgrid", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("redis_enterprise", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("maps_account", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("data_share", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("digital_twins", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("media_services", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("elastic_san", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("healthcare_workspace", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("managed_lustre", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("video_indexer", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("hpc_cache", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("backup_vault", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("mobile_network", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("dev_center", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("graph_account", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("fabric_capacity", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("confidential_ledger", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("pinecone", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("mongo_cluster", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("elastic_cloud", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("neptune_cluster", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("oracle_cloud", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("oracle_autonomous", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("storage_mover", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("storage_share", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("storage_queue", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("storage_table", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("storage_blob", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("storage_container", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("storage_data_lake", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("data_lake_gen2", StringComparison.OrdinalIgnoreCase);
    }

    internal static bool LooksLikeTerraformServiceSourceId(string? sourceId)
    {
        if (string.IsNullOrWhiteSpace(sourceId))
            return false;

        string normalized = sourceId.Trim();

        return normalized.Contains("app_service", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("api_management", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("function_app", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("container_app", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("linux_web_app", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("windows_web_app", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("web_app", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("kubernetes_cluster", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("static_site", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("signalr_service", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("logic_app", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("service_plan", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("spring_cloud", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("servicebus_namespace", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("container_registry", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("service_fabric", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("application_gateway", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("virtual_machine", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("batch_account", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("traffic_manager", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("azurerm_lb", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("cdn_frontdoor", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("cdn_profile", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("cdn_endpoint", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("azurerm_firewall", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("container_group", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("express_route", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("automation_account", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("virtual_network_gateway", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("dns_zone", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("bastion_host", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("nat_gateway", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("azuread", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("active_directory", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("api_connection", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("monitor_action_group", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("log_analytics", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("application_insights", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("key_vault", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("search_service", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("eventhub_namespace", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("synapse_workspace", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("data_factory", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("redis_cache", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("cosmosdb", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("mssql", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("storage_account", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("postgresql", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("mysql", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("sql_server", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("sql_managed_instance", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("mariadb", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("sql_database", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("private_endpoint", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("redis_enterprise", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("machine_learning", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("databricks", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("kusto_cluster", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("app_configuration", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("stream_analytics", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("iothub", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("maps_account", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("powerbi", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("managed_disk", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("recovery_services", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("netapp", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("eventgrid", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("digital_twins", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("media_services", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("data_share", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("elastic_san", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("healthcare_workspace", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("backup_vault", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("storage_share", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("communication_service", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("cognitive_account", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("cognitive_services", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("cognitive_deployment", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("data_collection_endpoint", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("data_collection_rule", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("web_pubsub", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("healthbot", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("notification_hub", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("fluid_relay", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("orbital", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("virtual_hub", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("lab_service", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("load_test", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("dynatrace", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("kubernetes_fleet", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("kubernetes_configuration", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("relay_namespace", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("api_center", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("dashboard_grafana", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("chaos_studio", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("stack_hci", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("voice_services", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("workloads_sap", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("palo_alto", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("verifiedaccess", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("workloads_orchestrator", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("extended_location", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsDatastoreCategory(string? category) =>
        string.Equals(category, GraphTopologyCategories.Data, StringComparison.OrdinalIgnoreCase)
        || string.Equals(category, GraphTopologyCategories.Storage, StringComparison.OrdinalIgnoreCase);
}
