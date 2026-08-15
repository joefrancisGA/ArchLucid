using ArchLucid.KnowledgeGraph;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

/// <summary>
///     Graph fixtures for the agent-topology proposal tests (<see cref="AgentTopologyProposalGraphMergeTests" /> and
///     <see cref="AgentTopologyProposalMergeGateTests" />).
///     Both suites exercise endpoint resolution against an existing inventory graph, so nearly every case needs the same
///     shape: a Terraform-sourced compute node and a Terraform-sourced data node. The factories here carry those
///     defaults so each test states only the attribute under test.
///     The snapshot envelope (ids and timestamp) is generated rather than parameterized: the merge copies it to the
///     output untouched and never branches on it, so no test needs to control it.
/// </summary>
internal static class AgentTopologyProposalTestGraph
{
    /// <summary>Source system for inventory nodes; the extractor stamps this on every Terraform-derived resource.</summary>
    internal const string TerraformSourceType = "Terraform";

    internal const string ComputeNodeId = "svc-1";
    internal const string ComputeLabel = "api";
    internal const string ComputeSourceId = "azurerm_app_service.main";

    internal const string DataNodeId = "ds-1";
    internal const string DataLabel = "sql";
    internal const string DataSourceId = "azurerm_mssql_server.main";

    /// <summary>Snapshot holding <paramref name="nodes" /> and no edges — the usual pre-merge inventory state.</summary>
    internal static GraphSnapshot Graph(params GraphNode[] nodes) => GraphWithEdges(nodes, []);

    /// <summary>Snapshot holding both <paramref name="nodes" /> and pre-existing <paramref name="edges" />.</summary>
    internal static GraphSnapshot GraphWithEdges(IReadOnlyList<GraphNode> nodes, IReadOnlyList<GraphEdge> edges)
    {
        ArgumentNullException.ThrowIfNull(nodes);
        ArgumentNullException.ThrowIfNull(edges);

        return new GraphSnapshot
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Nodes = [.. nodes],
            Edges = [.. edges]
        };
    }

    /// <summary>Inventoried compute resource, the "api" service that proposals normally name as the relationship source.</summary>
    internal static GraphNode ComputeNode(
        string nodeId = ComputeNodeId,
        string label = ComputeLabel,
        string? sourceId = ComputeSourceId,
        string? sourceType = TerraformSourceType,
        Dictionary<string, string>? properties = null) =>
        Node(nodeId, label, GraphTopologyCategories.Compute, sourceType, sourceId, properties);

    /// <summary>Inventoried data resource, the "sql" datastore that proposals normally name as the relationship target.</summary>
    internal static GraphNode DataNode(
        string nodeId = DataNodeId,
        string label = DataLabel,
        string? sourceId = DataSourceId,
        string? sourceType = TerraformSourceType,
        Dictionary<string, string>? properties = null) =>
        Node(nodeId, label, GraphTopologyCategories.Data, sourceType, sourceId, properties);

    /// <summary>
    ///     Topology node with an explicit <paramref name="category" />, for cases that assert on category-sensitive
    ///     resolution (storage nodes, miscategorized nodes, nodes with no category at all).
    /// </summary>
    internal static GraphNode Node(
        string nodeId,
        string label,
        string? category = null,
        string? sourceType = null,
        string? sourceId = null,
        Dictionary<string, string>? properties = null,
        string nodeType = GraphNodeTypes.TopologyResource)
    {
        GraphNode node = new()
        {
            NodeId = nodeId,
            NodeType = nodeType,
            Label = label,
            Category = category,
            SourceType = sourceType,
            SourceId = sourceId
        };

        // GraphNode.Properties defaults to an empty dictionary; only replace it when a case supplies one so the
        // generated node stays identical to a hand-written literal that omitted Properties.
        if (properties is not null)
        {
            node.Properties = properties;
        }

        return node;
    }
}
