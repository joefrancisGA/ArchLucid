using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Merges Topology agent <see cref="AgentTopologyProposal" /> into the run's graph so authority commit
///     can project <see cref="ManifestService" /> / <see cref="ManifestDatastore" /> after execute, when the
///     graph from context ingestion had no <see cref="GraphNodeTypes.TopologyResource" /> nodes.
/// </summary>
public static class AgentTopologyProposalGraphMerge
{
    /// <summary>
    ///     <c>true</c> when topology agent proposals would add nodes to the persisted graph snapshot view.
    /// </summary>
    public static bool WouldChangeGraphForCommit(GraphSnapshot graph, IReadOnlyList<AgentResult> results)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(results);

        return !ReferenceEquals(graph, WithMergedTopologyProposals(graph, results));
    }

    public static GraphSnapshot WithMergedTopologyProposals(
        GraphSnapshot graph,
        IReadOnlyList<AgentResult> results)
    {
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(results);

        if (results.Count == 0)
            return graph;

        IReadOnlyList<AgentResult> validatedResults = AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, results);

        if (validatedResults.Count == 0)
            return graph;

        HashSet<string> seenLabels = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode n in graph.Nodes.Where(n => !string.IsNullOrWhiteSpace(n.Label)))
        {
            seenLabels.Add(n.Label);
        }

        List<GraphNode> added = [];
        List<GraphEdge> addedEdges = [];

        foreach (AgentResult result in validatedResults)
        {
            if (result.AgentType != AgentType.Topology)
                continue;

            AgentTopologyProposal? proposal = result.ProposedChanges;

            if (proposal is null)
                continue;

            string? reasoning = result.ReasoningTrace?.Trim();

            if (proposal.AddedServices is { Count: > 0 })
            {
                foreach (ManifestService svc in proposal.AddedServices)
                {
                    if (string.IsNullOrWhiteSpace(svc.ServiceName))
                        continue;

                    if (!seenLabels.Add(svc.ServiceName))
                        continue;

                    added.Add(TopologyServiceNode(svc, reasoning));
                }
            }

            if (proposal.AddedDatastores is not { Count: > 0 })
            {
                if (proposal.AddedRelationships is { Count: > 0 })
                {
                    addedEdges.AddRange(TopologyProposalRelationshipEdgeMapper.MapRelationships(
                        [.. graph.Nodes, .. added],
                        proposal.AddedRelationships));
                }

                continue;
            }

            foreach (ManifestDatastore ds in proposal.AddedDatastores)
            {
                if (string.IsNullOrWhiteSpace(ds.DatastoreName))
                    continue;

                if (!seenLabels.Add(ds.DatastoreName))
                    continue;

                added.Add(TopologyDatastoreNode(ds, reasoning));
            }

            if (proposal.AddedRelationships is { Count: > 0 })
            {
                addedEdges.AddRange(TopologyProposalRelationshipEdgeMapper.MapRelationships(
                    [.. graph.Nodes, .. added],
                    proposal.AddedRelationships));
            }
        }

        if (added.Count == 0 && addedEdges.Count == 0)
            return graph;

        return new GraphSnapshot
        {
            GraphSnapshotId = graph.GraphSnapshotId,
            ContextSnapshotId = graph.ContextSnapshotId,
            RunId = graph.RunId,
            CreatedUtc = graph.CreatedUtc,
            Nodes = added.Count == 0 ? [.. graph.Nodes] : [.. graph.Nodes, .. added],
            Edges = addedEdges.Count == 0 ? [.. graph.Edges] : [.. graph.Edges, .. addedEdges],
            Warnings = [.. graph.Warnings]
        };
    }

    private static GraphNode TopologyServiceNode(ManifestService svc, string? reasoningTrace)
    {
        return new GraphNode
        {
            NodeId = !string.IsNullOrWhiteSpace(svc.ServiceId) ? svc.ServiceId : $"svc-{svc.ServiceName}",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = svc.ServiceName,
            Category = GraphTopologyCategories.Compute,
            SourceType = nameof(AgentType.Topology),
            SourceId = "ProposedChanges",
            ReasoningTrace = reasoningTrace,
            Properties = EnumProperties("serviceType", svc.ServiceType, "runtimePlatform", svc.RuntimePlatform)
        };
    }

    private static GraphNode TopologyDatastoreNode(ManifestDatastore ds, string? reasoningTrace)
    {
        return new GraphNode
        {
            NodeId = !string.IsNullOrWhiteSpace(ds.DatastoreId) ? ds.DatastoreId : $"ds-{ds.DatastoreName}",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = ds.DatastoreName,
            Category = GraphTopologyCategories.Data,
            SourceType = nameof(AgentType.Topology),
            SourceId = "ProposedChanges",
            ReasoningTrace = reasoningTrace,
            Properties = EnumProperties("datastoreType", ds.DatastoreType, "runtimePlatform", ds.RuntimePlatform)
        };
    }

    private static Dictionary<string, string> EnumProperties(
        string key1,
        Enum e1,
        string key2,
        Enum e2)
    {
        return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) { [key1] = e1.ToString(), [key2] = e2.ToString() };
    }
}
