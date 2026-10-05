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
    }

    internal static void PreferCategorizedSyntheticAlias(
        Dictionary<string, string> aliasToNodeId,
        string? label,
        string? category,
        string nodeId)
    {
        if (string.IsNullOrWhiteSpace(label) || string.IsNullOrWhiteSpace(category))
            return;

        string? primaryKey = IsDatastoreCategory(category)
            ? TopologyProposalRelationshipEndpointIndex.BuildSyntheticDatastoreNodeId(label)
            : TopologyProposalRelationshipEndpointIndex.BuildSyntheticServiceNodeId(label);

        if (primaryKey is null)
            return;

        // An inventoried node that omits category registers both prefixes first.
        // The categorized node's own prefix must still win.
        aliasToNodeId[primaryKey] = nodeId;
    }

    internal static void AddGraphNodeTerraformSyntheticLabelResolutionFallback(
        Dictionary<string, string> aliasToNodeId,
        string? label,
        string? category,
        string? sourceId,
        string nodeId)
    {
        if (string.IsNullOrWhiteSpace(label) || string.IsNullOrWhiteSpace(category))
            return;

        if (IsDatastoreCategory(category) && LooksLikeTerraformServiceSourceId(sourceId))
        {
            TopologyProposalRelationshipEndpointIndex.AddResolutionAlias(
                aliasToNodeId,
                TopologyProposalRelationshipEndpointIndex.BuildSyntheticServiceNodeId(label),
                nodeId);
        }
        else if (!IsDatastoreCategory(category) && LooksLikeTerraformDatastoreSourceId(sourceId))
        {
            TopologyProposalRelationshipEndpointIndex.AddResolutionAlias(
                aliasToNodeId,
                TopologyProposalRelationshipEndpointIndex.BuildSyntheticDatastoreNodeId(label),
                nodeId);
        }
    }

    internal static bool LooksLikeTerraformDatastoreSourceId(string? sourceId) =>
        RecognizesTerraformResourceType(sourceId);

    internal static bool LooksLikeTerraformServiceSourceId(string? sourceId) =>
        RecognizesTerraformResourceType(sourceId);

    // Pinned azurerm v5.6.0 membership, plus cited retired aliases.
    // A fragment such as "er" or "fty" is not a resource type.
    private static bool RecognizesTerraformResourceType(string? sourceId) =>
        TerraformAzurermResourceTypeCatalog.ContainsSourceId(sourceId)
        || TerraformAzurermRetiredResourceAliases.ContainsSourceId(sourceId);

    private static bool IsDatastoreCategory(string? category) =>
        string.Equals(category, GraphTopologyCategories.Data, StringComparison.OrdinalIgnoreCase)
        || string.Equals(category, GraphTopologyCategories.Storage, StringComparison.OrdinalIgnoreCase);

    internal static string? TryNormalizeTerraformEndpointIdentity(string? endpoint)
    {
        string? leafAddress = TerraformAzurermResourceTypeParser.TryParseLeafResourceAddress(endpoint);

        if (leafAddress is null || !RecognizesTerraformResourceType(leafAddress))
            return null;

        return leafAddress;
    }

    internal static void AddTerraformLeafResourceAddressKeys(HashSet<string> endpointKeys, string? terraformSourceId)
    {
        string? leafAddress = TerraformAzurermResourceTypeParser.TryParseLeafResourceAddress(terraformSourceId);

        if (leafAddress is null || !RecognizesTerraformResourceType(leafAddress))
            return;

        TopologyProposalRelationshipEndpointIndex.AddEndpointKey(endpointKeys, leafAddress);
    }

    internal static void AddTerraformLeafResourceAddressResolutionAliases(
        Dictionary<string, string> aliasToNodeId,
        string? terraformSourceId,
        string nodeId)
    {
        string? leafAddress = TerraformAzurermResourceTypeParser.TryParseLeafResourceAddress(terraformSourceId);

        if (leafAddress is null || !RecognizesTerraformResourceType(leafAddress))
            return;

        TopologyProposalRelationshipEndpointIndex.AddResolutionAlias(aliasToNodeId, leafAddress, nodeId);
    }
}
