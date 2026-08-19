using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArchLucid.Host.Core.Health;

/// <summary>
///     Sibling probe for <see cref="RunGoldenManifestConsistencyHealthCheck" /> — verifies merge invariant checker wiring.
/// </summary>
public sealed class GraphMergeInvariantProbeHealthCheck : IHealthCheck
{
    public const string RegistrationName = "graph_merge_invariant_probe";

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "probe-svc",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "probe",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Inventory",
                    SourceId = "probe-svc",
                }
            ],
            Edges = [],
            Warnings = [],
        };

        IReadOnlyList<GraphMergeInvariantViolation> violations = GraphMergeInvariantChecker.Check(graph);

        if (violations.Count > 0)
        {
            return Task.FromResult(
                HealthCheckResult.Degraded("Graph merge invariant self-test reported violations on a known-good graph."));
        }

        return Task.FromResult(
            HealthCheckResult.Healthy("Graph merge invariant checker self-test passed."));
    }
}
