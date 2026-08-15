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
    public Task<GraphBuildResult> BuildAsync(
        ContextSnapshot contextSnapshot,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(contextSnapshot);

        IReadOnlyList<CanonicalObject> canonicalObjects = contextSnapshot.CanonicalObjects;
        List<GraphNode> nodes = new(canonicalObjects.Count + 1);

        nodes.Add(CreateContextNode(contextSnapshot));

        bool hasCanonicalCostConstraints = false;

        foreach (CanonicalObject item in canonicalObjects)
        {
            GraphNode node = nodeFactory.CreateNode(item);

            if (string.Equals(item.ObjectType, GraphNodeTypes.CostConstraint, StringComparison.OrdinalIgnoreCase))
                hasCanonicalCostConstraints = true;

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

        IReadOnlyList<GraphEdge> inferredEdges = edgeInferer.InferEdges(contextSnapshot, nodes);

        GraphBuildResult result = new()
        {
            Nodes = nodes,
            Edges = inferredEdges.Count == 0 ? [] : [.. inferredEdges]
        };

        return Task.FromResult(result);
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
    }
}
