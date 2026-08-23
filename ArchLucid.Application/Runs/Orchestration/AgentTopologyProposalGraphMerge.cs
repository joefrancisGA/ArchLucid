using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Merges agent topology proposals into the run's graph so authority commit can project
///     <see cref="ManifestService" /> / <see cref="ManifestDatastore" /> after execute. Topology agent
///     proposals may add nodes; topology, cost, compliance, and critic proposals may add relationship edges.
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

        validatedResults = validatedResults
            .OrderBy(static result => GetMergeOrder(result.AgentType))
            .ToList();

        bool greenfieldGraph = graph.Nodes.Count == 0;
        HashSet<string> seenTopologyKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in graph.Nodes)
        {
            if (!string.Equals(node.NodeType, GraphNodeTypes.TopologyResource, StringComparison.OrdinalIgnoreCase))
                continue;

            TopologyProposalRelationshipEndpointIndex.AddGraphNodeEndpointKeys(seenTopologyKeys, node);
        }

        List<GraphNode> added = [];
        List<GraphEdge> addedEdges = [];
        HashSet<string> seenDirectedEdgeKeys = CollectDirectedEdgeKeys(graph.Edges);
        Dictionary<string, string> accumulatedEndpointAliases = new(StringComparer.OrdinalIgnoreCase);

        foreach (AgentResult result in validatedResults)
        {
            if (!ContributesProposalEndpointAliases(result.AgentType))
                continue;

            AgentTopologyProposal? proposal = result.ProposedChanges;

            if (proposal is null)
                continue;

            bool materializeNodes = result.AgentType == AgentType.Topology || greenfieldGraph;
            string? reasoning = result.ReasoningTrace?.Trim();
            Dictionary<string, string> endpointAliases = new(StringComparer.OrdinalIgnoreCase);

            if (proposal.AddedServices is { Count: > 0 })
            {
                foreach (ManifestService svc in proposal.AddedServices)
                {
                    if (TopologyProposalRelationshipEndpointIndex.TryClaimService(svc, seenTopologyKeys))
                    {
                        if (materializeNodes)
                        {
                            added.Add(TopologyServiceNode(svc, reasoning));
                        }
                        else
                        {
                            TopologyProposalRelationshipEndpointIndex.AddDeclaredManifestServiceEndpointAliases(
                                endpointAliases,
                                svc);
                        }

                        continue;
                    }

                    TopologyProposalRelationshipEndpointIndex.AddManifestServiceEndpointAliases(
                        endpointAliases,
                        svc,
                        [.. graph.Nodes, .. added]);
                }
            }

            if (proposal.AddedDatastores is { Count: > 0 })
            {
                foreach (ManifestDatastore ds in proposal.AddedDatastores)
                {
                    if (TopologyProposalRelationshipEndpointIndex.TryClaimDatastore(ds, seenTopologyKeys))
                    {
                        if (materializeNodes)
                        {
                            added.Add(TopologyDatastoreNode(ds, reasoning));
                        }
                        else
                        {
                            TopologyProposalRelationshipEndpointIndex.AddDeclaredManifestDatastoreEndpointAliases(
                                endpointAliases,
                                ds);
                        }

                        continue;
                    }

                    TopologyProposalRelationshipEndpointIndex.AddManifestDatastoreEndpointAliases(
                        endpointAliases,
                        ds,
                        [.. graph.Nodes, .. added]);
                }
            }

            MergeEndpointAliasesInto(accumulatedEndpointAliases, endpointAliases);
        }

        foreach (AgentResult result in validatedResults)
        {
            if (!MaterializesProposalRelationships(result.AgentType))
                continue;

            AgentTopologyProposal? proposal = result.ProposedChanges;

            if (proposal is null || proposal.AddedRelationships is not { Count: > 0 })
                continue;

            AppendUniqueEdges(
                addedEdges,
                seenDirectedEdgeKeys,
                TopologyProposalRelationshipEdgeMapper.MapRelationships(
                    [.. graph.Nodes, .. added],
                    proposal.AddedRelationships,
                    accumulatedEndpointAliases));
        }

        addedEdges = DropDanglingEdges(addedEdges, graph.Nodes, added);

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

    private static bool ContributesProposalEndpointAliases(AgentType agentType) =>
        agentType is AgentType.Topology or AgentType.Cost or AgentType.Compliance or AgentType.Critic;

    private static bool MaterializesProposalRelationships(AgentType agentType) =>
        ContributesProposalEndpointAliases(agentType);

    private static HashSet<string> CollectDirectedEdgeKeys(IReadOnlyList<GraphEdge> edges)
    {
        HashSet<string> seenDirectedEdgeKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphEdge edge in edges)
        {
            seenDirectedEdgeKeys.Add(BuildDirectedEdgeKey(edge.FromNodeId, edge.ToNodeId, edge.EdgeType));
        }

        return seenDirectedEdgeKeys;
    }

    private static void AppendUniqueEdges(
        List<GraphEdge> target,
        HashSet<string> seenDirectedEdgeKeys,
        IReadOnlyList<GraphEdge> candidateEdges)
    {
        foreach (GraphEdge edge in candidateEdges)
        {
            string edgeKey = BuildDirectedEdgeKey(edge.FromNodeId, edge.ToNodeId, edge.EdgeType);

            if (!seenDirectedEdgeKeys.Add(edgeKey))
                continue;

            target.Add(edge);
        }
    }

    private static List<GraphEdge> DropDanglingEdges(
        List<GraphEdge> edges,
        IReadOnlyList<GraphNode> existingNodes,
        IReadOnlyList<GraphNode> addedNodes)
    {
        HashSet<string> nodeIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (GraphNode node in existingNodes)
        {
            nodeIds.Add(node.NodeId);
        }

        foreach (GraphNode node in addedNodes)
        {
            nodeIds.Add(node.NodeId);
        }

        List<GraphEdge> kept = [];

        foreach (GraphEdge edge in edges)
        {
            if (!nodeIds.Contains(edge.FromNodeId) || !nodeIds.Contains(edge.ToNodeId))
                continue;

            kept.Add(edge);
        }

        return kept;
    }

    private static string BuildDirectedEdgeKey(string fromNodeId, string toNodeId, string edgeType) =>
        $"{fromNodeId}|{toNodeId}|{edgeType}";

    private static void MergeEndpointAliasesInto(
        Dictionary<string, string> target,
        IReadOnlyDictionary<string, string> source)
    {
        foreach (KeyValuePair<string, string> alias in source)
        {
            target.TryAdd(alias.Key, alias.Value);
        }
    }

    private static int GetMergeOrder(AgentType agentType) =>
        agentType switch
        {
            AgentType.Topology => 10,
            AgentType.Cost => 20,
            AgentType.Compliance => 30,
            AgentType.Critic => 40,
            _ => 100,
        };
}
