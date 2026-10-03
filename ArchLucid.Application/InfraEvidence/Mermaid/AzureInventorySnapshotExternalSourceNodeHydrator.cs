using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>
///     Ensures synthetic ADF external-source nodes exist when relationships reference them.
/// </summary>
internal static class AzureInventorySnapshotExternalSourceNodeHydrator
{
    public static void EnsureExternalSourceNodes(
        List<GraphNode> nodes,
        HashSet<string> seenNodeIds,
        Dictionary<string, string> nodeIdByArmId,
        IEnumerable<AzureInventoryResourceRelationshipReadModel> relationships,
        IReadOnlyList<AzureInventoryAdfExternalSourceReadModel> externalSources)
    {
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(seenNodeIds);
        ArgumentNullException.ThrowIfNull(nodeIdByArmId);
        ArgumentNullException.ThrowIfNull(relationships);

        foreach (AzureInventoryResourceRelationshipReadModel relationship in relationships)
        {
            EnsureExternalSourceNode(
                relationship.FromAzureResourceId,
                nodes,
                seenNodeIds,
                nodeIdByArmId,
                externalSources);
            EnsureExternalSourceNode(
                relationship.ToAzureResourceId,
                nodes,
                seenNodeIds,
                nodeIdByArmId,
                externalSources);
        }
    }

    public static void EnsureExternalSourceNode(
        string? armId,
        List<GraphNode> nodes,
        HashSet<string> seenNodeIds,
        Dictionary<string, string> nodeIdByArmId,
        IReadOnlyList<AzureInventoryAdfExternalSourceReadModel> externalSources)
    {
        if (string.IsNullOrWhiteSpace(armId))
        {
            return;
        }

        string normalized = ArmResourceIdNormalizer.Normalize(armId);

        if (!AzureInventoryAdfExternalSourceNodeFactory.IsExternalSourceNodeId(normalized)
            || nodeIdByArmId.ContainsKey(normalized))
        {
            return;
        }

        if (!AzureInventoryAdfExternalSourceNodeFactory.TryParseNodeKey(
                normalized,
                out _,
                out string linkedServiceName))
        {
            return;
        }

        GraphNode externalNode = AzureInventoryAdfExternalSourceNodeFactory.CreateGraphNode(
            normalized,
            externalSources
                .FirstOrDefault(source =>
                    string.Equals(source.ExternalNodeKey, normalized, StringComparison.OrdinalIgnoreCase))
                is { } source
                ? source.LinkedServiceName
                : linkedServiceName,
            externalSources
                .FirstOrDefault(source =>
                    string.Equals(source.ExternalNodeKey, normalized, StringComparison.OrdinalIgnoreCase))
                is { } typedSource
                ? typedSource.LinkedServiceType
                : null,
            externalSources
                .FirstOrDefault(source =>
                    string.Equals(source.ExternalNodeKey, normalized, StringComparison.OrdinalIgnoreCase))
                is { } hostedSource
                ? hostedSource.TargetHost
                : null);

        AzureInventoryAdfExternalSourceReadModel? persistedSource = externalSources
            .FirstOrDefault(source =>
                string.Equals(source.ExternalNodeKey, normalized, StringComparison.OrdinalIgnoreCase));

        if (persistedSource is not null)
        {
            if (!string.IsNullOrWhiteSpace(persistedSource.FactoryResourceId))
            {
                externalNode.Properties["arm.externalFactoryName"] =
                    ExtractArmResourceName(persistedSource.FactoryResourceId);
            }

            if (!string.IsNullOrWhiteSpace(persistedSource.IntegrationRuntimeName))
            {
                externalNode.Properties["arm.externalIntegrationRuntime"] =
                    persistedSource.IntegrationRuntimeName;
            }

            if (persistedSource.HostInKeyVault)
            {
                externalNode.Properties["arm.externalHostInKeyVault"] = "true";
            }

            if (!string.IsNullOrWhiteSpace(persistedSource.KeyVaultResourceId))
            {
                externalNode.Properties["arm.externalKeyVaultResourceId"] =
                    persistedSource.KeyVaultResourceId;
            }
        }

        if (seenNodeIds.Add(externalNode.NodeId))
        {
            nodes.Add(externalNode);
        }

        nodeIdByArmId[normalized] = externalNode.NodeId;
    }

    private static string ExtractArmResourceName(string armResourceId)
    {
        int separator = armResourceId.LastIndexOf('/');
        return separator >= 0 && separator < armResourceId.Length - 1
            ? armResourceId[(separator + 1)..]
            : armResourceId;
    }
}
