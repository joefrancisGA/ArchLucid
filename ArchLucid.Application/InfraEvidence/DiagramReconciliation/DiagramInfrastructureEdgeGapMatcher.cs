using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.DiagramReconciliation;

internal static class DiagramInfrastructureEdgeGapMatcher
{
    private static readonly HashSet<string> StructuralAssociationTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        AzureInventoryRelationshipAssociationTypes.NicToSubnet,
        AzureInventoryRelationshipAssociationTypes.VmToNic,
        AzureInventoryRelationshipAssociationTypes.PublicIpToNic,
        AzureInventoryRelationshipAssociationTypes.VnetPeering,
        AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget,
        AzureInventoryRelationshipAssociationTypes.PeToNic,
        AzureInventoryRelationshipAssociationTypes.PeToSubnet,
        AzureInventoryRelationshipAssociationTypes.LbToBackend,
        AzureInventoryRelationshipAssociationTypes.AgwToBackend,
        AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet,
    };

    private static readonly HashSet<string> StrongNodeMatchKinds = new(StringComparer.Ordinal)
    {
        DiagramInfrastructureMatchKinds.Exact,
        DiagramInfrastructureMatchKinds.Probable,
        DiagramInfrastructureMatchKinds.Confirmed,
    };

    public static List<DiagramInfrastructureEdgeGapRow> MatchEdgeGaps(
        ArchitectureDiagramModelRecord diagram,
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyList<DiagramInfrastructureCorrespondenceRow> rows)
    {
        ArgumentNullException.ThrowIfNull(diagram);
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(rows);

        Dictionary<string, string> nodeIdToAzureResourceId = BuildStrongNodeAzureMap(rows);
        Dictionary<string, Guid> azureResourceIdToCloudResourceId = BuildAzureToCloudMap(rows);
        Dictionary<string, string> cloudResourceIdToNodeId = BuildCloudToNodeMap(rows, nodeIdToAzureResourceId, azureResourceIdToCloudResourceId);

        List<DiagramInfrastructureEdgeGapRow> gaps = [];
        HashSet<string> seenGapKeys = new(StringComparer.Ordinal);

        foreach (ArchitectureDiagramEdgeRecord edge in diagram.Edges.Where(candidate => !candidate.Removed))
        {
            if (!nodeIdToAzureResourceId.TryGetValue(edge.SourceId, out string? sourceAzureId)
                || !nodeIdToAzureResourceId.TryGetValue(edge.TargetId, out string? targetAzureId))
            {
                continue;
            }

            if (!azureResourceIdToCloudResourceId.TryGetValue(sourceAzureId, out Guid sourceCloudId)
                || !azureResourceIdToCloudResourceId.TryGetValue(targetAzureId, out Guid targetCloudId))
            {
                continue;
            }

            if (HasStructuralRelationship(snapshot, sourceAzureId, targetAzureId))
            {
                continue;
            }

            string gapKey = $"drawn|{sourceCloudId:D}|{targetCloudId:D}|{edge.Id}";
            if (!seenGapKeys.Add(gapKey))
            {
                continue;
            }

            gaps.Add(new DiagramInfrastructureEdgeGapRow
            {
                EdgeGapId = $"edge-gap-drawn-{edge.Id}-{sourceCloudId:N}-{targetCloudId:N}",
                FromCloudResourceId = sourceCloudId,
                ToCloudResourceId = targetCloudId,
                DiagramEdgeId = edge.Id,
                GapKind = DiagramInfrastructureEdgeGapKinds.DrawnNotPresent,
                ExplainText = "Drawn on the diagram and not present in this inventory capture.",
            });
        }

        foreach (AzureInventoryResourceRelationshipReadModel relationship in snapshot.Relationships)
        {
            if (!StructuralAssociationTypes.Contains(relationship.RelationshipType))
            {
                continue;
            }

            if (!azureResourceIdToCloudResourceId.TryGetValue(relationship.FromAzureResourceId, out Guid fromCloudId)
                || !azureResourceIdToCloudResourceId.TryGetValue(relationship.ToAzureResourceId, out Guid toCloudId))
            {
                continue;
            }

            string fromNodeId = cloudResourceIdToNodeId.GetValueOrDefault(fromCloudId.ToString("D"), string.Empty);
            string toNodeId = cloudResourceIdToNodeId.GetValueOrDefault(toCloudId.ToString("D"), string.Empty);

            if (fromNodeId.Length == 0 || toNodeId.Length == 0)
            {
                continue;
            }

            if (HasDiagramEdge(diagram, fromNodeId, toNodeId))
            {
                continue;
            }

            string gapKey = $"present|{fromCloudId:D}|{toCloudId:D}|{relationship.RelationshipType}";
            if (!seenGapKeys.Add(gapKey))
            {
                continue;
            }

            gaps.Add(new DiagramInfrastructureEdgeGapRow
            {
                EdgeGapId = $"edge-gap-present-{fromCloudId:N}-{toCloudId:N}-{relationship.RelationshipType}",
                FromCloudResourceId = fromCloudId,
                ToCloudResourceId = toCloudId,
                AssociationType = relationship.RelationshipType,
                GapKind = DiagramInfrastructureEdgeGapKinds.PresentNotDrawn,
                ExplainText = "Present in this inventory capture and not drawn.",
            });
        }

        return gaps.OrderBy(gap => gap.EdgeGapId, StringComparer.Ordinal).ToList();
    }

    private static Dictionary<string, string> BuildStrongNodeAzureMap(IReadOnlyList<DiagramInfrastructureCorrespondenceRow> rows)
    {
        Dictionary<string, string> map = new(StringComparer.Ordinal);

        foreach (DiagramInfrastructureCorrespondenceRow row in rows)
        {
            if (row.DiagramNodeId is null
                || row.AzureResourceId is null
                || !StrongNodeMatchKinds.Contains(row.MatchKind))
            {
                continue;
            }

            map[row.DiagramNodeId] = row.AzureResourceId;
        }

        return map;
    }

    private static Dictionary<string, Guid> BuildAzureToCloudMap(IReadOnlyList<DiagramInfrastructureCorrespondenceRow> rows)
    {
        Dictionary<string, Guid> map = new(StringComparer.OrdinalIgnoreCase);

        foreach (DiagramInfrastructureCorrespondenceRow row in rows)
        {
            if (row.AzureResourceId is null || row.CloudResourceId is not Guid cloudResourceId)
            {
                continue;
            }

            map[row.AzureResourceId] = cloudResourceId;
        }

        return map;
    }

    private static Dictionary<string, string> BuildCloudToNodeMap(
        IReadOnlyList<DiagramInfrastructureCorrespondenceRow> rows,
        Dictionary<string, string> nodeIdToAzureResourceId,
        Dictionary<string, Guid> azureResourceIdToCloudResourceId)
    {
        Dictionary<string, string> map = new(StringComparer.Ordinal);

        foreach (KeyValuePair<string, string> pair in nodeIdToAzureResourceId)
        {
            if (!azureResourceIdToCloudResourceId.TryGetValue(pair.Value, out Guid cloudResourceId))
            {
                continue;
            }

            map[cloudResourceId.ToString("D")] = pair.Key;
        }

        return map;
    }

    private static bool HasStructuralRelationship(
        AzureInventorySnapshotDetailReadModel snapshot,
        string sourceAzureId,
        string targetAzureId)
    {
        return snapshot.Relationships.Any(relationship =>
            StructuralAssociationTypes.Contains(relationship.RelationshipType)
            && ((string.Equals(relationship.FromAzureResourceId, sourceAzureId, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(relationship.ToAzureResourceId, targetAzureId, StringComparison.OrdinalIgnoreCase))
                || (string.Equals(relationship.FromAzureResourceId, targetAzureId, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(relationship.ToAzureResourceId, sourceAzureId, StringComparison.OrdinalIgnoreCase))));
    }

    private static bool HasDiagramEdge(ArchitectureDiagramModelRecord diagram, string fromNodeId, string toNodeId)
    {
        return diagram.Edges.Any(edge =>
            !edge.Removed
            && ((string.Equals(edge.SourceId, fromNodeId, StringComparison.Ordinal)
                    && string.Equals(edge.TargetId, toNodeId, StringComparison.Ordinal))
                || (string.Equals(edge.SourceId, toNodeId, StringComparison.Ordinal)
                    && string.Equals(edge.TargetId, fromNodeId, StringComparison.Ordinal))));
    }
}
