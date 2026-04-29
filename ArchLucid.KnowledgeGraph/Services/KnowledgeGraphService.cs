using ArchLucid.ContextIngestion.Models;
using ArchLucid.KnowledgeGraph.Configuration;
using ArchLucid.KnowledgeGraph.Interfaces;
using ArchLucid.KnowledgeGraph.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.KnowledgeGraph.Services;

/// <summary>
///     Builds and validates a knowledge graph snapshot from a <see cref="ContextSnapshot" />.
///     Delegates graph construction to <see cref="IGraphBuilder" /> and validation to <see cref="IGraphValidator" />.
/// </summary>
public class KnowledgeGraphService(
    IGraphBuilder graphBuilder,
    IGraphValidator graphValidator,
    IOptions<KnowledgeGraphLimitsOptions> limitsOptions)
    : IKnowledgeGraphService
{
    private readonly IOptions<KnowledgeGraphLimitsOptions> _limitsOptions =
        limitsOptions ?? throw new ArgumentNullException(nameof(limitsOptions));

    public async Task<GraphSnapshot> BuildSnapshotAsync(
        ContextSnapshot contextSnapshot,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(contextSnapshot);

        GraphBuildResult buildResult = await graphBuilder.BuildAsync(contextSnapshot, ct);

        KnowledgeGraphLimitsOptions limits = _limitsOptions.Value;
        List<GraphNode> nodes;
        List<GraphEdge> edges;
        List<string> warnings = [.. buildResult.Warnings];

        if (limits.MaxNodes > 0 && buildResult.Nodes.Count > limits.MaxNodes)
        {
            nodes = buildResult.Nodes.Take(limits.MaxNodes).ToList();
            HashSet<string> kept = nodes.Select(static n => n.NodeId).ToHashSet(StringComparer.Ordinal);

            edges = buildResult.Edges
                .Where(e => kept.Contains(e.FromNodeId) && kept.Contains(e.ToNodeId))
                .ToList();

            warnings.Add(
                $"Graph truncated to {limits.MaxNodes} nodes (configured {KnowledgeGraphLimitsOptions.SectionName}:MaxNodes).");
        }
        else
        {
            nodes = buildResult.Nodes;
            edges = buildResult.Edges;
        }

        GraphSnapshot snapshot = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = contextSnapshot.SnapshotId,
            RunId = contextSnapshot.RunId,
            CreatedUtc = DateTime.UtcNow,
            Nodes = nodes,
            Edges = edges,
            Warnings = warnings
        };

        graphValidator.Validate(snapshot);

        return snapshot;
    }
}
