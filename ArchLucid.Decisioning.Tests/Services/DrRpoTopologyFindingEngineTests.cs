using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Services;

[Trait("Category", "Unit")]
public sealed class DrRpoTopologyFindingEngineTests
{
    [Fact]
    public async Task AnalyzeAsync_emits_finding_when_rpo_declared_and_sql_lacks_replica_keys()
    {
        GraphSnapshot graph = BuildFixture(includeFailoverGroup: false, includeRpoText: true);

        DrRpoTopologyFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.EngineType.Should().Be("dr-rpo-topology");
        finding.Category.Should().Be("Requirement");
        finding.Title.Should().Contain("RPO 15 min");
        finding.Title.Should().Contain("sql-pay-prod");
        finding.Trace!.Notes.Should().Contain("evidence:graph-node:req-dr-1");
        finding.Trace!.Notes.Should().Contain("evidence:graph-node:sql-pay-prod");

        DrRpoTopologyFindingPayload payload =
            finding.Payload.Should().BeOfType<DrRpoTopologyFindingPayload>().Subject;

        payload.RpoMinutes.Should().Be(15);
        payload.DatastoreNodeId.Should().Be("sql-pay-prod");
        finding.EvidenceRefs.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_populates_EvidenceRefs_from_datastore_arm_property()
    {
        const string armResourceId =
            "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg-pay/providers/Microsoft.Sql/servers/sql-pay-prod/databases/payments";

        GraphSnapshot graph = BuildFixture(includeFailoverGroup: false, includeRpoText: true, sqlResourceId: armResourceId);

        DrRpoTopologyFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.EvidenceRefs.Should().ContainSingle().Which.Should().Be(armResourceId);
    }

    [Fact]
    public async Task AnalyzeAsync_emits_finding_when_rpo_declared_and_storage_replication_is_zrs()
    {
        GraphSnapshot graph = BuildStorageReplicationFixture("zrs");

        DrRpoTopologyFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.EngineType.Should().Be("dr-rpo-topology");
        finding.Title.Should().Contain("st-logic");
        finding.Title.Should().Contain("RPO 15 min");
    }

    [Fact]
    public async Task AnalyzeAsync_emits_finding_when_rpo_declared_and_storage_replication_is_standard_zrs()
    {
        GraphSnapshot graph = BuildStorageReplicationFixture("standard_zrs");

        DrRpoTopologyFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().ContainSingle();
    }

    [Fact]
    public async Task AnalyzeAsync_emits_none_when_storage_replication_is_grs()
    {
        GraphSnapshot graph = BuildStorageReplicationFixture("grs");

        DrRpoTopologyFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_emits_none_when_storage_replication_is_gzrs()
    {
        GraphSnapshot graph = BuildStorageReplicationFixture("gzrs");

        DrRpoTopologyFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_emits_none_when_failover_group_present()
    {
        GraphSnapshot graph = BuildFixture(includeFailoverGroup: true, includeRpoText: true);

        DrRpoTopologyFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_emits_none_when_no_rpo_text()
    {
        GraphSnapshot graph = BuildFixture(includeFailoverGroup: false, includeRpoText: false);

        DrRpoTopologyFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_emits_finding_when_quality_attribute_has_typed_rto_hours()
    {
        GraphSnapshot graph = BuildQualityAttributeFixture(includeFailoverGroup: false);

        DrRpoTopologyFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.EngineType.Should().Be("dr-rpo-topology");
        finding.Title.Should().Contain("RTO 240 min");
        finding.Title.Should().Contain("sql-pay-prod");

        DrRpoTopologyFindingPayload payload =
            finding.Payload.Should().BeOfType<DrRpoTopologyFindingPayload>().Subject;

        payload.RtoMinutes.Should().Be(240);
        payload.RequirementNodeId.Should().Be("qa-availability-1");
    }

    [Fact]
    public async Task AnalyzeAsync_emits_finding_when_inventory_cosmos_account_has_data_category_and_no_replica()
    {
        GraphSnapshot graph = BuildInventoryCategoryFixture(
            label: "orders-catalog",
            sourceId: "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg-pay/providers/Microsoft.DocumentDB/databaseAccounts/orders-catalog",
            category: GraphTopologyCategories.Data);

        DrRpoTopologyFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.Title.Should().Contain("orders-catalog");
        finding.Title.Should().Contain("RPO 60 min");
    }

    [Fact]
    public async Task AnalyzeAsync_emits_finding_when_inventory_postgres_server_has_data_category_and_no_replica()
    {
        GraphSnapshot graph = BuildInventoryCategoryFixture(
            label: "app-db",
            sourceId: "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg-pay/providers/Microsoft.DBforPostgreSQL/flexibleServers/app-db",
            category: GraphTopologyCategories.Data);

        DrRpoTopologyFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().ContainSingle();
    }

    [Fact]
    public async Task AnalyzeAsync_emits_finding_when_terraform_cosmosdb_account_has_no_replica()
    {
        // Simple terraform names the resource "polyglot" and stores the type separately.
        // infra/terraform-cosmos/main.tf declares azurerm_cosmosdb_account "polyglot".
        GraphSnapshot graph = BuildTerraformTypeFixture(
            label: "polyglot",
            terraformType: "azurerm_cosmosdb_account");

        DrRpoTopologyFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.Title.Should().Contain("polyglot");
        finding.Title.Should().Contain("RPO 60 min");
    }

    [Fact]
    public async Task AnalyzeAsync_emits_none_when_terraform_type_is_cosmos_role_assignment()
    {
        // Same module assigns data-plane roles. Those types contain cosmosdb but are not replica targets.
        GraphSnapshot graph = BuildTerraformTypeFixture(
            label: "workload_data_contributor",
            terraformType: "azurerm_cosmosdb_sql_role_assignment");

        DrRpoTopologyFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_emits_none_when_inventory_data_factory_shares_the_data_diagram_category()
    {
        GraphSnapshot graph = BuildInventoryCategoryFixture(
            label: "etl",
            sourceId: "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg-pay/providers/Microsoft.DataFactory/factories/etl",
            category: GraphTopologyCategories.Data);

        DrRpoTopologyFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task RequestQualityAttributeMaterializer_output_drives_dr_rpo_topology_engine()
    {
        Guid snapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        IReadOnlyList<GraphNode> materialized =
            ArchLucid.KnowledgeGraph.Materialization.RequestQualityAttributeMaterializer.MaterializeFromQualityAttribute(
                "RTO 4 hours for payment API",
                snapshotId);

        GraphNode qualityAttribute = materialized.Should().ContainSingle().Subject;

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                qualityAttribute,
                new GraphNode
                {
                    NodeId = "sql-pay-prod",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql-pay-prod",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["category"] = GraphTopologyCategories.Data,
                        ["terraformType"] = "azurerm_mssql_database",
                    },
                },
            ],
        };

        DrRpoTopologyFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.Payload.Should().BeOfType<DrRpoTopologyFindingPayload>()
            .Subject.RtoMinutes.Should().Be(240);
    }

    private static GraphSnapshot BuildQualityAttributeFixture(bool includeFailoverGroup)
    {
        Dictionary<string, string> sqlProperties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["category"] = GraphTopologyCategories.Data,
            ["terraformType"] = "azurerm_mssql_database",
        };

        if (includeFailoverGroup)
            sqlProperties["failover_group"] = "fg-pay-prod";

        return new GraphSnapshot
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "qa-availability-1",
                    NodeType = GraphNodeTypes.QualityAttribute,
                    Label = "Availability quality attribute",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["theme"] = "availability",
                        ["rtoHours"] = "4",
                        ["sourceQualityAttribute"] = "RTO 4 hours for payment API",
                    },
                },
                new GraphNode
                {
                    NodeId = "sql-pay-prod",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql-pay-prod",
                    Properties = sqlProperties,
                },
            ],
        };
    }

    private static GraphSnapshot BuildFixture(
        bool includeFailoverGroup,
        bool includeRpoText,
        string? sqlResourceId = null)
    {
        GraphNode requirement = new()
        {
            NodeId = "req-dr-1",
            NodeType = GraphNodeTypes.Requirement,
            Label = "Payment DR",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["text"] = includeRpoText
                    ? "Payment SQL must meet RPO 15 min."
                    : "Application must be resilient.",
            },
        };

        GraphNode service = new()
        {
            NodeId = "svc-checkout",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "checkout-api",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["category"] = GraphTopologyCategories.Compute,
            },
        };

        Dictionary<string, string> sqlProperties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["category"] = GraphTopologyCategories.Data,
            ["terraformType"] = "azurerm_mssql_database",
        };

        if (includeFailoverGroup)
        {
            sqlProperties["failover_group"] = "fg-pay-prod";
        }

        if (!string.IsNullOrWhiteSpace(sqlResourceId))
        {
            sqlProperties["resourceId"] = sqlResourceId;
        }

        GraphNode sql = new()
        {
            NodeId = "sql-pay-prod",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "sql-pay-prod",
            Properties = sqlProperties,
        };

        return new GraphSnapshot
        {
            Nodes = [requirement, service, sql],
            Edges =
            [
                new GraphEdge
                {
                    FromNodeId = requirement.NodeId,
                    ToNodeId = service.NodeId,
                    EdgeType = GraphEdgeTypes.RelatesTo,
                    Weight = 1.0,
                },
                new GraphEdge
                {
                    FromNodeId = service.NodeId,
                    ToNodeId = sql.NodeId,
                    EdgeType = GraphEdgeTypes.DependsOn,
                    Weight = 1.0,
                },
            ],
        };
    }

    private static GraphSnapshot BuildStorageReplicationFixture(string replicationType)
    {
        GraphNode requirement = new()
        {
            NodeId = "req-dr-1",
            NodeType = GraphNodeTypes.Requirement,
            Label = "Payment DR",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["text"] = "Payment SQL must meet RPO 15 min.",
            },
        };

        GraphNode storage = new()
        {
            NodeId = "st-logic",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "st-logic",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["category"] = GraphTopologyCategories.Data,
                ["terraformType"] = "azurerm_storage_account",
                // Parser form of account_replication_type from infra/terraform-logicapps.
                ["tf.account_replication_type"] = replicationType,
            },
        };

        return new GraphSnapshot
        {
            Nodes = [requirement, storage],
            Edges =
            [
                new GraphEdge
                {
                    FromNodeId = requirement.NodeId,
                    ToNodeId = storage.NodeId,
                    EdgeType = GraphEdgeTypes.RelatesTo,
                    Weight = 1.0,
                },
            ],
        };
    }

    private static GraphSnapshot BuildInventoryCategoryFixture(string label, string sourceId, string category)
    {
        GraphNode qualityAttribute = new()
        {
            NodeId = "qa-availability-1",
            NodeType = GraphNodeTypes.QualityAttribute,
            Label = "Availability quality attribute",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["theme"] = "availability",
                ["rpoHours"] = "1",
            },
        };

        GraphNode datastore = new()
        {
            NodeId = "inventory-store",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            Category = category,
            SourceId = sourceId,
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["armResourceId"] = sourceId,
            },
        };

        return new GraphSnapshot
        {
            Nodes = [qualityAttribute, datastore],
        };
    }

    private static GraphSnapshot BuildTerraformTypeFixture(string label, string terraformType)
    {
        GraphNode qualityAttribute = new()
        {
            NodeId = "qa-availability-1",
            NodeType = GraphNodeTypes.QualityAttribute,
            Label = "Availability quality attribute",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["theme"] = "availability",
                ["rpoHours"] = "1",
            },
        };

        GraphNode datastore = new()
        {
            NodeId = "tf-store",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            SourceId = "decl-7f3a",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = terraformType,
            },
        };

        return new GraphSnapshot
        {
            Nodes = [qualityAttribute, datastore],
        };
    }
}
