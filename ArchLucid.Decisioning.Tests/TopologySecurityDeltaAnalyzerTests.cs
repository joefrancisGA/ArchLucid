using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class TopologySecurityDeltaAnalyzerTests
{
    [Fact]
    public void Analyze_returns_empty_for_identical_graphs()
    {
        GraphSnapshot graph = BuildSqlGraph(includeReplica: true, includePublicNetwork: false);

        IReadOnlyList<TopologySecurityDelta> deltas = TopologySecurityDeltaAnalyzer.Analyze(graph, graph);

        deltas.Should().BeEmpty();
    }

    [Fact]
    public void Analyze_detects_replica_or_failover_removed()
    {
        GraphSnapshot prior = BuildSqlGraph(includeReplica: true, includePublicNetwork: false);
        GraphSnapshot current = BuildSqlGraph(includeReplica: false, includePublicNetwork: false);

        IReadOnlyList<TopologySecurityDelta> deltas = TopologySecurityDeltaAnalyzer.Analyze(current, prior);

        deltas.Should().ContainSingle()
            .Which.Kind.Should().Be(TopologySecurityDeltaKind.ReplicaOrFailoverRemoved);
    }

    [Fact]
    public void Analyze_detects_public_inbound_added()
    {
        GraphSnapshot prior = BuildSqlGraph(includeReplica: false, includePublicNetwork: false);
        GraphSnapshot current = BuildSqlGraph(includeReplica: false, includePublicNetwork: true);

        IReadOnlyList<TopologySecurityDelta> deltas = TopologySecurityDeltaAnalyzer.Analyze(current, prior);

        deltas.Should().ContainSingle()
            .Which.Kind.Should().Be(TopologySecurityDeltaKind.PublicInboundAdded);
    }

    [Fact]
    public void Analyze_detects_admin_inbound_widened()
    {
        GraphSnapshot prior = BuildNsgGraph(includeAdminInbound: false);
        GraphSnapshot current = BuildNsgGraph(includeAdminInbound: true);

        IReadOnlyList<TopologySecurityDelta> deltas = TopologySecurityDeltaAnalyzer.Analyze(current, prior);

        deltas.Should().ContainSingle()
            .Which.Kind.Should().Be(TopologySecurityDeltaKind.AdminInboundWidened);
    }

    private static GraphSnapshot BuildSqlGraph(bool includeReplica, bool includePublicNetwork)
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["terraformType"] = "azurerm_mssql_database",
        };

        if (includeReplica)
        {
            properties["geo_redundant"] = "enabled";
        }

        if (includePublicNetwork)
        {
            properties["publicNetworkAccess"] = "Enabled";
        }

        return new GraphSnapshot
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "sql-prod",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "prod-sql",
                    Properties = properties,
                },
            ],
        };
    }

    private static GraphSnapshot BuildNsgGraph(bool includeAdminInbound)
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["terraformType"] = "azurerm_network_security_group",
        };

        if (includeAdminInbound)
        {
            properties["tf.security_rule"] =
                "access = allow direction = inbound source_address_prefix = * destination_port_range = 3389";
        }

        return new GraphSnapshot
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "nsg-prod",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "prod-nsg",
                    Properties = properties,
                },
            ],
        };
    }
}
