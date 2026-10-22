using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>
///     Restores diagnostic-setting edges from snapshot rows when association materialization
///     pointed at a NeverShow workspace that can still resolve to a visible ancestor.
/// </summary>
internal static class AzureInventorySnapshotDiagnosticEdgeHydrator
{
    public static void AddMissingDiagnosticEdges(
        AzureInventorySnapshotDetailReadModel snapshot,
        Dictionary<string, string> nodeIdByArmId,
        List<GraphEdge> edges,
        HashSet<string> edgeKeys)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(nodeIdByArmId);
        ArgumentNullException.ThrowIfNull(edges);
        ArgumentNullException.ThrowIfNull(edgeKeys);

        HashSet<string> inventoriedArmIds = AzureInventoryEventHubVisibleEndpointResolver.BuildInventoriedArmIds(
            snapshot.Resources.Select(resource => resource.AzureResourceId));

        foreach (AzureInventoryDiagnosticConfigurationReadModel diagnostic in snapshot.Diagnostics)
        {
            if (string.IsNullOrWhiteSpace(diagnostic.TargetAzureResourceId)
                || string.IsNullOrWhiteSpace(diagnostic.WorkspaceResourceId))
            {
                continue;
            }

            if (!AzureInventoryArmEndpointNodeResolver.TryResolveExactOrAncestorNodeId(
                    nodeIdByArmId,
                    ArmResourceIdNormalizer.Normalize(diagnostic.TargetAzureResourceId),
                    out string fromNodeId))
            {
                continue;
            }

            AzureInventoryEventHubVisibleEndpointResolver.ResolveDiagnosticDestination(
                diagnostic.WorkspaceResourceId,
                inventoriedArmIds,
                out string resolvedWorkspaceArmId,
                out string diagnosticInferenceSource);

            foreach (string toNodeId in AzureInventoryArmEndpointNodeResolver.ResolveRelatedNodeIds(
                         nodeIdByArmId,
                         ArmResourceIdNormalizer.Normalize(resolvedWorkspaceArmId)))
            {
                AzureInventorySnapshotGraphEdgeAppender.TryAdd(
                    edges,
                    edgeKeys,
                    fromNodeId,
                    toNodeId,
                    GraphEdgeTypes.ConnectsTo,
                    diagnosticInferenceSource,
                    provenanceKind: ProvenanceKind.ObservedFact.ToString());
            }
        }
    }
}
