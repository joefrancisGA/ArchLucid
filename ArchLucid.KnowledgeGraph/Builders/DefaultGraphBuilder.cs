using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inference;
using ArchLucid.KnowledgeGraph.Interfaces;
using ArchLucid.KnowledgeGraph.Mapping;
using ArchLucid.KnowledgeGraph.Materialization;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Builders;

public class DefaultGraphBuilder(
    IGraphNodeFactory nodeFactory,
    IGraphEdgeInferer edgeInferer)
    : IGraphBuilder
{
    public async Task<GraphBuildResult> BuildAsync(
        ContextSnapshot contextSnapshot,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(contextSnapshot);

        IReadOnlyList<CanonicalObject> canonicalObjects = contextSnapshot.CanonicalObjects;
        List<GraphNode> nodes = new(canonicalObjects.Count + 1);

        nodes.Add(CreateContextNode(contextSnapshot));

        bool hasCanonicalCostConstraints = false;
        bool hasCanonicalActors = false;
        bool hasCanonicalAssumptions = false;
        bool hasCanonicalQualityAttributes = false;
        bool hasCanonicalFailureModes = false;

        foreach (CanonicalObject item in canonicalObjects)
        {
            GraphNode node = nodeFactory.CreateNode(item);

            if (string.Equals(item.ObjectType, GraphNodeTypes.CostConstraint, StringComparison.OrdinalIgnoreCase))
                hasCanonicalCostConstraints = true;

            if (string.Equals(item.ObjectType, GraphNodeTypes.Actor, StringComparison.OrdinalIgnoreCase))
                hasCanonicalActors = true;

            if (string.Equals(item.ObjectType, GraphNodeTypes.Assumption, StringComparison.OrdinalIgnoreCase))
                hasCanonicalAssumptions = true;

            if (string.Equals(item.ObjectType, GraphNodeTypes.QualityAttribute, StringComparison.OrdinalIgnoreCase))
                hasCanonicalQualityAttributes = true;

            if (string.Equals(item.ObjectType, GraphNodeTypes.FailureMode, StringComparison.OrdinalIgnoreCase))
                hasCanonicalFailureModes = true;

            if (item.Properties.TryGetValue("associatedFindings", out string? associatedFindings) &&
                associatedFindings.Contains("WAF", StringComparison.OrdinalIgnoreCase))
            {
                node.Properties["WafAligned"] = "true";
            }
            else if (item.Properties.TryGetValue("findings", out string? findings) &&
                     findings.Contains("WAF", StringComparison.OrdinalIgnoreCase))
            {
                node.Properties["WafAligned"] = "true";
            }

            nodes.Add(node);
        }

        if (!hasCanonicalCostConstraints
            && contextSnapshot.SourceHashes.TryGetValue(ContextScopeMetadataKeys.Constraints, out string? constraints))
        {
            nodes.AddRange(
                RequestCostConstraintMaterializer.MaterializeFromConstraintsMetadata(
                    constraints,
                    contextSnapshot.SnapshotId));
        }

        if (!hasCanonicalActors
            && contextSnapshot.SourceHashes.TryGetValue(ContextScopeMetadataKeys.Actors, out string? actorsJson))
        {
            nodes.AddRange(
                RequestActorMaterializer.MaterializeFromActorsJson(
                    actorsJson,
                    contextSnapshot.SnapshotId));
        }

        if (!hasCanonicalAssumptions
            && contextSnapshot.SourceHashes.TryGetValue(ContextScopeMetadataKeys.Assumptions, out string? assumptions))
        {
            nodes.AddRange(
                RequestAssumptionMaterializer.MaterializeFromAssumptionsMetadata(
                    assumptions,
                    contextSnapshot.SnapshotId));
        }

        if (!hasCanonicalQualityAttributes
            && contextSnapshot.SourceHashes.TryGetValue(
                ContextScopeMetadataKeys.QualityAttribute,
                out string? qualityAttribute))
        {
            nodes.AddRange(
                RequestQualityAttributeMaterializer.MaterializeFromQualityAttribute(
                    qualityAttribute,
                    contextSnapshot.SnapshotId));
        }

        if (!hasCanonicalFailureModes
            && contextSnapshot.SourceHashes.TryGetValue(
                ContextScopeMetadataKeys.FailureModeNote,
                out string? failureModeNote))
        {
            nodes.AddRange(
                RequestFailureModeMaterializer.MaterializeFromFailureModeNote(
                    failureModeNote,
                    contextSnapshot.SnapshotId));
        }

        await CostConstraintProjectedSpendEnricher.EnrichFromTopologyAsync(nodes, ct).ConfigureAwait(false);

        IReadOnlyList<GraphEdge> inferredEdges = edgeInferer.InferEdges(contextSnapshot, nodes);

        GraphBuildResult result = new()
        {
            Nodes = nodes,
            Edges = inferredEdges.Count == 0 ? [] : [.. inferredEdges]
        };

        return result;
    }

    private static GraphNode CreateContextNode(ContextSnapshot contextSnapshot)
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["snapshotId"] = contextSnapshot.SnapshotId.ToString(),
            ["runId"] = contextSnapshot.RunId.ToString(),
            ["projectId"] = contextSnapshot.ProjectId
        };

        CopyScopeMetadata(contextSnapshot.SourceHashes, properties);

        return new GraphNode
        {
            NodeId = $"context-{contextSnapshot.SnapshotId:N}",
            NodeType = GraphNodeTypes.ContextSnapshot,
            Label = $"Context Snapshot {contextSnapshot.SnapshotId:N}",
            SourceType = GraphNodeTypes.ContextSnapshot,
            SourceId = contextSnapshot.SnapshotId.ToString(),
            Properties = properties
        };
    }

    private static void CopyScopeMetadata(
        Dictionary<string, string> sourceHashes,
        Dictionary<string, string> properties)
    {
        if (sourceHashes.TryGetValue(ContextScopeMetadataKeys.RequiredCapabilities, out string? capabilities)
            && !string.IsNullOrWhiteSpace(capabilities))
        {
            properties[ContextGraphPropertyKeys.RequiredCapabilities] = capabilities;
        }

        if (sourceHashes.TryGetValue(ContextScopeMetadataKeys.TopologyHints, out string? topologyHints)
            && !string.IsNullOrWhiteSpace(topologyHints))
        {
            properties[ContextGraphPropertyKeys.TopologyHints] = topologyHints;
        }

        if (sourceHashes.TryGetValue(ContextScopeMetadataKeys.Constraints, out string? constraints)
            && !string.IsNullOrWhiteSpace(constraints))
        {
            properties[ContextGraphPropertyKeys.Constraints] = constraints;
        }

        if (sourceHashes.TryGetValue(ContextScopeMetadataKeys.PriorTopologyCategories, out string? priorCategories)
            && !string.IsNullOrWhiteSpace(priorCategories))
        {
            properties[ContextGraphPropertyKeys.PriorTopologyCategories] = priorCategories;
        }

        if (sourceHashes.TryGetValue(ContextScopeMetadataKeys.PriorRequirementNames, out string? priorRequirements)
            && !string.IsNullOrWhiteSpace(priorRequirements))
        {
            properties[ContextGraphPropertyKeys.PriorRequirementNames] = priorRequirements;
        }

        if (sourceHashes.TryGetValue(ContextScopeMetadataKeys.Assumptions, out string? assumptions)
            && !string.IsNullOrWhiteSpace(assumptions))
        {
            properties[ContextGraphPropertyKeys.Assumptions] = assumptions;
        }

        if (sourceHashes.TryGetValue(ContextScopeMetadataKeys.Actors, out string? actors)
            && !string.IsNullOrWhiteSpace(actors))
        {
            properties[ContextGraphPropertyKeys.Actors] = actors;
        }

        if (sourceHashes.TryGetValue(ContextScopeMetadataKeys.QualityAttribute, out string? qualityAttribute)
            && !string.IsNullOrWhiteSpace(qualityAttribute))
        {
            properties[ContextGraphPropertyKeys.QualityAttribute] = qualityAttribute;
        }

        if (sourceHashes.TryGetValue(ContextScopeMetadataKeys.FailureModeNote, out string? failureModeNote)
            && !string.IsNullOrWhiteSpace(failureModeNote))
        {
            properties[ContextGraphPropertyKeys.FailureModeNote] = failureModeNote;
        }
    }
}
