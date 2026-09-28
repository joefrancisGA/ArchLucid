using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
public sealed class TopologyProposalRelationshipEndpointIndexTests
{
    [Fact]
    public void EndpointKeyIsKnown_accepts_synthetic_endpoint_with_internal_whitespace_after_prefix()
    {
        HashSet<string> knownEndpointKeys = new(StringComparer.OrdinalIgnoreCase)
        {
            "svc-api",
            "ds-sql",
        };

        TopologyProposalRelationshipEndpointIndex.EndpointKeyIsKnown("svc-  api", knownEndpointKeys)
            .Should()
            .BeTrue();
        TopologyProposalRelationshipEndpointIndex.EndpointKeyIsKnown("ds-  sql", knownEndpointKeys)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void FilterKnownRelationships_keeps_relationship_when_synthetic_endpoints_have_internal_whitespace_after_prefix()
    {
        List<ManifestService> services =
        [
            new ManifestService { ServiceName = "api", ServiceId = "svc-api" },
        ];

        List<ManifestDatastore> datastores =
        [
            new ManifestDatastore { DatastoreName = "sql", DatastoreId = "ds-sql" },
        ];

        List<ManifestRelationship> relationships =
        [
            new ManifestRelationship
            {
                SourceId = "svc-  api",
                TargetId = "ds-  sql",
                RelationshipType = RelationshipType.ReadsFrom,
            },
        ];

        List<ManifestRelationship> filtered = TopologyProposalRelationshipEndpointIndex.FilterKnownRelationships(
            services,
            datastores,
            relationships);

        filtered.Should().ContainSingle(relationship =>
            relationship.SourceId == "svc-  api" && relationship.TargetId == "ds-  sql");
    }

    [Fact]
    public void AddGraphNodeEndpointKeys_omits_ProposedChanges_source_id_from_known_endpoint_keys()
    {
        HashSet<string> knownEndpointKeys = new(StringComparer.OrdinalIgnoreCase);

        GraphNode node = new()
        {
            NodeId = "svc-worker",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "worker",
            Category = GraphTopologyCategories.Compute,
            SourceId = "ProposedChanges",
            SourceType = nameof(AgentType.Topology),
            Properties = new()
        };

        TopologyProposalRelationshipEndpointIndex.AddGraphNodeEndpointKeys(knownEndpointKeys, node);

        knownEndpointKeys.Should().NotContain("ProposedChanges");
        knownEndpointKeys.Should().Contain("worker");
        knownEndpointKeys.Should().Contain("svc-worker");
    }

    [Fact]
    public void AddGraphNodeResolutionKeys_omits_ProposedChanges_source_id_from_resolution_aliases()
    {
        Dictionary<string, string> endpointKeyToNodeId = new(StringComparer.OrdinalIgnoreCase);

        GraphNode node = new()
        {
            NodeId = "svc-worker",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "worker",
            Category = GraphTopologyCategories.Compute,
            SourceId = "ProposedChanges",
            SourceType = nameof(AgentType.Topology),
            Properties = new()
        };

        TopologyProposalRelationshipEndpointIndex.AddGraphNodeResolutionKeys(endpointKeyToNodeId, node);

        endpointKeyToNodeId.Should().NotContainKey("ProposedChanges");
        endpointKeyToNodeId["worker"].Should().Be("svc-worker");
        endpointKeyToNodeId["svc-worker"].Should().Be("svc-worker");
    }

    [Fact]
    public void EndpointKeyIsKnown_returns_false_for_null_or_whitespace_endpoint()
    {
        HashSet<string> knownEndpointKeys = new(StringComparer.OrdinalIgnoreCase) { "svc-api" };

        TopologyProposalRelationshipEndpointIndex.EndpointKeyIsKnown(null, knownEndpointKeys).Should().BeFalse();
        TopologyProposalRelationshipEndpointIndex.EndpointKeyIsKnown("   ", knownEndpointKeys).Should().BeFalse();
    }

    [Fact]
    public void FilterKnownRelationships_drops_relationship_when_either_endpoint_is_unknown()
    {
        List<ManifestService> services =
        [
            new ManifestService { ServiceName = "api", ServiceId = "svc-api" },
        ];

        List<ManifestDatastore> datastores =
        [
            new ManifestDatastore { DatastoreName = "sql", DatastoreId = "ds-sql" },
        ];

        List<ManifestRelationship> relationships =
        [
            new ManifestRelationship
            {
                SourceId = "svc-api",
                TargetId = "ds-missing",
                RelationshipType = RelationshipType.ReadsFrom,
            },
        ];

        List<ManifestRelationship> filtered = TopologyProposalRelationshipEndpointIndex.FilterKnownRelationships(
            services,
            datastores,
            relationships);

        filtered.Should().BeEmpty();
    }

    [Fact]
    public void FilterKnownRelationships_returns_empty_when_relationships_are_null_or_empty()
    {
        List<ManifestService> services =
        [
            new ManifestService { ServiceName = "api", ServiceId = "svc-api" },
        ];

        List<ManifestDatastore> datastores =
        [
            new ManifestDatastore { DatastoreName = "sql", DatastoreId = "ds-sql" },
        ];

        TopologyProposalRelationshipEndpointIndex.FilterKnownRelationships(services, datastores, null)
            .Should()
            .BeEmpty();
        TopologyProposalRelationshipEndpointIndex.FilterKnownRelationships(services, datastores, [])
            .Should()
            .BeEmpty();
    }

    [Fact]
    public void FilterKnownRelationships_drops_relationship_when_source_endpoint_is_unknown()
    {
        List<ManifestService> services =
        [
            new ManifestService { ServiceName = "api", ServiceId = "svc-api" },
        ];

        List<ManifestDatastore> datastores =
        [
            new ManifestDatastore { DatastoreName = "sql", DatastoreId = "ds-sql" },
        ];

        List<ManifestRelationship> relationships =
        [
            new ManifestRelationship
            {
                SourceId = "svc-missing",
                TargetId = "ds-sql",
                RelationshipType = RelationshipType.ReadsFrom,
            },
        ];

        List<ManifestRelationship> filtered = TopologyProposalRelationshipEndpointIndex.FilterKnownRelationships(
            services,
            datastores,
            relationships);

        filtered.Should().BeEmpty();
    }

    [Fact]
    public void CollectKnownEndpointKeys_includes_manifest_names_ids_and_synthetic_aliases()
    {
        List<ManifestService> services =
        [
            new ManifestService { ServiceName = "api", ServiceId = "svc-api" },
        ];

        List<ManifestDatastore> datastores =
        [
            new ManifestDatastore { DatastoreName = "sql", DatastoreId = "ds-sql" },
        ];

        HashSet<string> keys = TopologyProposalRelationshipEndpointIndex.CollectKnownEndpointKeys(services, datastores);

        keys.Should().Contain("api");
        keys.Should().Contain("svc-api");
        keys.Should().Contain("sql");
        keys.Should().Contain("ds-sql");
        TopologyProposalRelationshipEndpointIndex.EndpointKeyIsKnown("svc-api", keys).Should().BeTrue();
        TopologyProposalRelationshipEndpointIndex.EndpointKeyIsKnown("ds-sql", keys).Should().BeTrue();
    }

    [Fact]
    public void FilterKnownRelationships_keeps_relationship_when_endpoints_exist_only_in_additional_keys()
    {
        List<ManifestService> services = [];
        List<ManifestDatastore> datastores = [];

        List<ManifestRelationship> relationships =
        [
            new ManifestRelationship
            {
                SourceId = "svc-inventoried",
                TargetId = "ds-inventoried",
                RelationshipType = RelationshipType.ReadsFrom,
            },
        ];

        List<ManifestRelationship> withoutAdditional = TopologyProposalRelationshipEndpointIndex.FilterKnownRelationships(
            services,
            datastores,
            relationships);

        withoutAdditional.Should().BeEmpty();

        List<ManifestRelationship> withAdditional = TopologyProposalRelationshipEndpointIndex.FilterKnownRelationships(
            ["svc-inventoried", "ds-inventoried"],
            services,
            datastores,
            relationships);

        withAdditional.Should().ContainSingle(relationship =>
            relationship.SourceId == "svc-inventoried" && relationship.TargetId == "ds-inventoried");
    }

    [Fact]
    public void RelationshipEndpointsAreKnown_requires_both_source_and_target_in_known_set()
    {
        HashSet<string> knownEndpointKeys = new(StringComparer.OrdinalIgnoreCase)
        {
            "svc-api",
            "ds-sql",
        };

        ManifestRelationship bothKnown = new()
        {
            SourceId = "svc-api",
            TargetId = "ds-sql",
            RelationshipType = RelationshipType.ReadsFrom,
        };

        TopologyProposalRelationshipEndpointIndex.RelationshipEndpointsAreKnown(bothKnown, knownEndpointKeys)
            .Should()
            .BeTrue();

        ManifestRelationship unknownTarget = new()
        {
            SourceId = "svc-api",
            TargetId = "ds-missing",
            RelationshipType = RelationshipType.ReadsFrom,
        };

        TopologyProposalRelationshipEndpointIndex.RelationshipEndpointsAreKnown(unknownTarget, knownEndpointKeys)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void TryClaimService_returns_false_when_name_id_or_synthetic_already_claimed()
    {
        HashSet<string> claimed = new(StringComparer.OrdinalIgnoreCase);

        ManifestService first = new() { ServiceName = "api", ServiceId = "svc-api" };

        TopologyProposalRelationshipEndpointIndex.TryClaimService(first, claimed).Should().BeTrue();

        ManifestService duplicateName = new() { ServiceName = "api", ServiceId = "svc-other" };

        TopologyProposalRelationshipEndpointIndex.TryClaimService(duplicateName, claimed).Should().BeFalse();

        ManifestService duplicateId = new() { ServiceName = "other", ServiceId = "svc-api" };

        TopologyProposalRelationshipEndpointIndex.TryClaimService(duplicateId, claimed).Should().BeFalse();

        ManifestService duplicateSynthetic = new() { ServiceName = "api", ServiceId = "other-id" };

        TopologyProposalRelationshipEndpointIndex.TryClaimService(duplicateSynthetic, claimed).Should().BeFalse();
    }

    [Fact]
    public void TryClaimDatastore_returns_false_when_name_id_or_synthetic_already_claimed()
    {
        HashSet<string> claimed = new(StringComparer.OrdinalIgnoreCase);

        ManifestDatastore first = new() { DatastoreName = "sql", DatastoreId = "ds-sql" };

        TopologyProposalRelationshipEndpointIndex.TryClaimDatastore(first, claimed).Should().BeTrue();

        ManifestDatastore duplicateName = new() { DatastoreName = "sql", DatastoreId = "ds-other" };

        TopologyProposalRelationshipEndpointIndex.TryClaimDatastore(duplicateName, claimed).Should().BeFalse();
    }

    [Fact]
    public void TryClaimService_returns_false_when_service_name_and_id_are_blank()
    {
        HashSet<string> claimed = new(StringComparer.OrdinalIgnoreCase);

        ManifestService blank = new() { ServiceName = "   ", ServiceId = "   " };

        TopologyProposalRelationshipEndpointIndex.TryClaimService(blank, claimed).Should().BeFalse();
        claimed.Should().BeEmpty();
    }

    [Fact]
    public void IsRenameAliasService_returns_true_when_accepted_service_shares_id_but_differs_name()
    {
        List<ManifestService> accepted =
        [
            new ManifestService { ServiceName = "api", ServiceId = "svc-api" },
        ];

        ManifestService rename = new() { ServiceName = "billing-api", ServiceId = "svc-api" };

        TopologyProposalRelationshipEndpointIndex.IsRenameAliasService(rename, accepted).Should().BeTrue();
    }

    [Fact]
    public void IsRenameAliasService_returns_false_when_no_accepted_service_matches_id()
    {
        List<ManifestService> accepted =
        [
            new ManifestService { ServiceName = "api", ServiceId = "svc-api" },
        ];

        ManifestService unrelated = new() { ServiceName = "worker", ServiceId = "svc-worker" };

        TopologyProposalRelationshipEndpointIndex.IsRenameAliasService(unrelated, accepted).Should().BeFalse();
    }

    [Fact]
    public void IsRenameAliasService_treats_padded_service_ids_as_same_id()
    {
        List<ManifestService> accepted =
        [
            new ManifestService { ServiceName = "api", ServiceId = "  svc-api  " },
        ];

        ManifestService rename = new() { ServiceName = "billing-api", ServiceId = "svc-api" };

        TopologyProposalRelationshipEndpointIndex.IsRenameAliasService(rename, accepted).Should().BeTrue();
    }

    [Fact]
    public void IsRenameAliasDatastore_returns_true_when_accepted_datastore_shares_id_but_differs_name()
    {
        List<ManifestDatastore> accepted =
        [
            new ManifestDatastore { DatastoreName = "sql", DatastoreId = "ds-sql" },
        ];

        ManifestDatastore rename = new() { DatastoreName = "orders-db", DatastoreId = "ds-sql" };

        TopologyProposalRelationshipEndpointIndex.IsRenameAliasDatastore(rename, accepted).Should().BeTrue();
    }

    [Fact]
    public void IsRenameAliasService_returns_false_when_accepted_service_has_same_id_and_name()
    {
        List<ManifestService> accepted =
        [
            new ManifestService { ServiceName = "api", ServiceId = "svc-api" },
        ];

        ManifestService duplicate = new() { ServiceName = "api", ServiceId = "svc-api" };

        TopologyProposalRelationshipEndpointIndex.IsRenameAliasService(duplicate, accepted).Should().BeFalse();
    }

    [Fact]
    public void TryClaimDatastore_returns_false_when_datastore_name_and_id_are_blank()
    {
        HashSet<string> claimed = new(StringComparer.OrdinalIgnoreCase);

        ManifestDatastore blank = new() { DatastoreName = "   ", DatastoreId = "   " };

        TopologyProposalRelationshipEndpointIndex.TryClaimDatastore(blank, claimed).Should().BeFalse();
        claimed.Should().BeEmpty();
    }

    [Fact]
    public void AddDeclaredManifestServiceEndpointAliases_registers_name_id_and_synthetic_keys()
    {
        Dictionary<string, string> aliases = new(StringComparer.OrdinalIgnoreCase);

        ManifestService service = new() { ServiceName = "billing-api", ServiceId = "svc-billing" };

        TopologyProposalRelationshipEndpointIndex.AddDeclaredManifestServiceEndpointAliases(aliases, service);

        aliases["billing-api"].Should().Be("svc-billing");
        aliases["svc-billing"].Should().Be("svc-billing");
        aliases["svc-billing-api"].Should().Be("svc-billing");
    }

    [Fact]
    public void AddDeclaredManifestDatastoreEndpointAliases_registers_name_id_and_synthetic_keys()
    {
        Dictionary<string, string> aliases = new(StringComparer.OrdinalIgnoreCase);

        ManifestDatastore datastore = new() { DatastoreName = "orders-db", DatastoreId = "ds-orders" };

        TopologyProposalRelationshipEndpointIndex.AddDeclaredManifestDatastoreEndpointAliases(aliases, datastore);

        aliases["orders-db"].Should().Be("ds-orders");
        aliases["ds-orders"].Should().Be("ds-orders");
        aliases["ds-orders-db"].Should().Be("ds-orders");
    }

    [Fact]
    public void EndpointKeyIsKnown_resolves_arm_resource_id_via_normalization()
    {
        const string canonicalArmId =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api-app";
        const string mixedCaseArmId =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Web/sites/api-app";

        HashSet<string> knownEndpointKeys = new(StringComparer.OrdinalIgnoreCase) { canonicalArmId };

        TopologyProposalRelationshipEndpointIndex.EndpointKeyIsKnown(mixedCaseArmId, knownEndpointKeys)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void IsRenameAliasDatastore_returns_false_when_accepted_datastore_has_same_id_and_name()
    {
        List<ManifestDatastore> accepted =
        [
            new ManifestDatastore { DatastoreName = "sql", DatastoreId = "ds-sql" },
        ];

        ManifestDatastore duplicate = new() { DatastoreName = "sql", DatastoreId = "ds-sql" };

        TopologyProposalRelationshipEndpointIndex.IsRenameAliasDatastore(duplicate, accepted).Should().BeFalse();
    }

    [Fact]
    public void AddManifestServiceEndpointAliases_maps_inventoried_graph_node_for_service_name()
    {
        List<GraphNode> graphNodes =
        [
            new()
            {
                NodeId = "svc-inventoried",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            }
        ];

        Dictionary<string, string> aliases = new(StringComparer.OrdinalIgnoreCase);

        ManifestService service = new() { ServiceName = "api", ServiceId = "svc-proposed" };

        TopologyProposalRelationshipEndpointIndex.AddManifestServiceEndpointAliases(aliases, service, graphNodes);

        aliases["api"].Should().Be("svc-inventoried");
        aliases["svc-proposed"].Should().Be("svc-inventoried");
        aliases["svc-api"].Should().Be("svc-inventoried");
    }

    [Fact]
    public void AddManifestDatastoreEndpointAliases_maps_inventoried_graph_node_for_datastore_name()
    {
        List<GraphNode> graphNodes =
        [
            new()
            {
                NodeId = "ds-inventoried",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        Dictionary<string, string> aliases = new(StringComparer.OrdinalIgnoreCase);

        ManifestDatastore datastore = new() { DatastoreName = "sql", DatastoreId = "ds-proposed" };

        TopologyProposalRelationshipEndpointIndex.AddManifestDatastoreEndpointAliases(aliases, datastore, graphNodes);

        aliases["sql"].Should().Be("ds-inventoried");
        aliases["ds-proposed"].Should().Be("ds-inventoried");
        aliases["ds-sql"].Should().Be("ds-inventoried");
    }

    [Fact]
    public void IsRenameAliasService_returns_false_when_candidate_name_or_id_is_blank()
    {
        List<ManifestService> accepted =
        [
            new ManifestService { ServiceName = "api", ServiceId = "svc-api" },
        ];

        ManifestService blankName = new() { ServiceName = "   ", ServiceId = "svc-api" };

        TopologyProposalRelationshipEndpointIndex.IsRenameAliasService(blankName, accepted).Should().BeFalse();

        ManifestService blankId = new() { ServiceName = "billing-api", ServiceId = "   " };

        TopologyProposalRelationshipEndpointIndex.IsRenameAliasService(blankId, accepted).Should().BeFalse();
    }

    [Fact]
    public void AddGraphNodeEndpointKeys_includes_arm_resource_id_from_topology_node_properties()
    {
        const string canonicalArmId =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.sql/servers/sql-srv";
        const string mixedCaseArmId =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Sql/servers/sql-srv";

        HashSet<string> knownEndpointKeys = new(StringComparer.OrdinalIgnoreCase);

        GraphNode node = new()
        {
            NodeId = "ds-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "sql",
            Category = GraphTopologyCategories.Data,
            Properties = new Dictionary<string, string> { ["resourceId"] = canonicalArmId }
        };

        TopologyProposalRelationshipEndpointIndex.AddGraphNodeEndpointKeys(knownEndpointKeys, node);

        TopologyProposalRelationshipEndpointIndex.EndpointKeyIsKnown(mixedCaseArmId, knownEndpointKeys)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void FilterKnownRelationships_keeps_relationship_when_arm_endpoints_exist_only_in_additional_keys()
    {
        const string sourceArm =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api-app";
        const string targetArm =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.sql/servers/sql-srv";

        List<ManifestService> services = [];
        List<ManifestDatastore> datastores = [];

        List<ManifestRelationship> relationships =
        [
            new ManifestRelationship
            {
                SourceId = sourceArm,
                TargetId = targetArm,
                RelationshipType = RelationshipType.ReadsFrom,
            },
        ];

        List<ManifestRelationship> filtered = TopologyProposalRelationshipEndpointIndex.FilterKnownRelationships(
            [sourceArm, targetArm],
            services,
            datastores,
            relationships);

        filtered.Should().ContainSingle(relationship =>
            relationship.SourceId == sourceArm && relationship.TargetId == targetArm);
    }

    [Fact]
    public void IsRenameAliasDatastore_returns_false_when_candidate_name_or_id_is_blank()
    {
        List<ManifestDatastore> accepted =
        [
            new ManifestDatastore { DatastoreName = "sql", DatastoreId = "ds-sql" },
        ];

        ManifestDatastore blankName = new() { DatastoreName = "   ", DatastoreId = "ds-sql" };

        TopologyProposalRelationshipEndpointIndex.IsRenameAliasDatastore(blankName, accepted).Should().BeFalse();

        ManifestDatastore blankId = new() { DatastoreName = "orders-db", DatastoreId = "   " };

        TopologyProposalRelationshipEndpointIndex.IsRenameAliasDatastore(blankId, accepted).Should().BeFalse();
    }

    [Fact]
    public void AddDeclaredManifestServiceEndpointAliases_uses_synthetic_node_id_when_service_id_is_blank()
    {
        Dictionary<string, string> aliases = new(StringComparer.OrdinalIgnoreCase);

        ManifestService service = new() { ServiceName = "api", ServiceId = "   " };

        TopologyProposalRelationshipEndpointIndex.AddDeclaredManifestServiceEndpointAliases(aliases, service);

        aliases["api"].Should().Be("svc-api");
        aliases["svc-api"].Should().Be("svc-api");
    }

    [Fact]
    public void AddGraphNodeResolutionKeys_includes_arm_resource_id_resolution_alias()
    {
        const string canonicalArmId =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api-app";
        const string mixedCaseArmId =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Web/sites/api-app";

        Dictionary<string, string> endpointKeyToNodeId = new(StringComparer.OrdinalIgnoreCase);

        GraphNode node = new()
        {
            NodeId = "svc-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "api",
            Category = GraphTopologyCategories.Compute,
            Properties = new Dictionary<string, string> { ["resourceId"] = canonicalArmId }
        };

        TopologyProposalRelationshipEndpointIndex.AddGraphNodeResolutionKeys(endpointKeyToNodeId, node);

        endpointKeyToNodeId[mixedCaseArmId].Should().Be("svc-1");
    }

    [Fact]
    public void AddManifestServiceEndpointAliases_leaves_dictionary_empty_when_no_graph_node_matches()
    {
        Dictionary<string, string> aliases = new(StringComparer.OrdinalIgnoreCase);

        ManifestService service = new() { ServiceName = "missing", ServiceId = "svc-missing" };

        TopologyProposalRelationshipEndpointIndex.AddManifestServiceEndpointAliases(aliases, service, []);

        aliases.Should().BeEmpty();
    }

    [Fact]
    public void AddDeclaredManifestDatastoreEndpointAliases_uses_synthetic_node_id_when_datastore_id_is_blank()
    {
        Dictionary<string, string> aliases = new(StringComparer.OrdinalIgnoreCase);

        ManifestDatastore datastore = new() { DatastoreName = "sql", DatastoreId = "   " };

        TopologyProposalRelationshipEndpointIndex.AddDeclaredManifestDatastoreEndpointAliases(aliases, datastore);

        aliases["sql"].Should().Be("ds-sql");
        aliases["ds-sql"].Should().Be("ds-sql");
    }

    [Fact]
    public void AddManifestDatastoreEndpointAliases_leaves_dictionary_empty_when_no_graph_node_matches()
    {
        Dictionary<string, string> aliases = new(StringComparer.OrdinalIgnoreCase);

        ManifestDatastore datastore = new() { DatastoreName = "missing", DatastoreId = "ds-missing" };

        TopologyProposalRelationshipEndpointIndex.AddManifestDatastoreEndpointAliases(aliases, datastore, []);

        aliases.Should().BeEmpty();
    }

    [Fact]
    public void TryResolveGraphTopologyNodeIdForService_returns_true_when_service_id_matches_graph_node_label()
    {
        List<GraphNode> graphNodes =
        [
            new()
            {
                NodeId = "svc-tf",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "azurerm_linux_web_app.app",
                Category = GraphTopologyCategories.Compute,
                SourceType = "Terraform",
                SourceId = "azurerm_linux_web_app.app",
                Properties = new()
            }
        ];

        ManifestService service = new()
        {
            ServiceName = "app",
            ServiceId = "azurerm_linux_web_app.app"
        };

        TopologyProposalRelationshipEndpointIndex.TryResolveGraphTopologyNodeIdForService(service, graphNodes, out string nodeId)
            .Should()
            .BeTrue();

        nodeId.Should().Be("svc-tf");
    }

    [Fact]
    public void TryResolveGraphTopologyNodeIdForDatastore_returns_true_when_datastore_id_matches_graph_node_label()
    {
        List<GraphNode> graphNodes =
        [
            new()
            {
                NodeId = "ds-tf",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "azurerm_mssql_server.main",
                Category = GraphTopologyCategories.Data,
                SourceType = "Terraform",
                SourceId = "azurerm_mssql_server.main",
                Properties = new()
            }
        ];

        ManifestDatastore datastore = new()
        {
            DatastoreName = "sql",
            DatastoreId = "azurerm_mssql_server.main"
        };

        TopologyProposalRelationshipEndpointIndex.TryResolveGraphTopologyNodeIdForDatastore(datastore, graphNodes, out string nodeId)
            .Should()
            .BeTrue();

        nodeId.Should().Be("ds-tf");
    }

    [Fact]
    public void TryResolveGraphTopologyNodeIdForService_returns_false_when_graph_node_is_not_topology_resource()
    {
        List<GraphNode> graphNodes =
        [
            new()
            {
                NodeId = "req-1",
                NodeType = GraphNodeTypes.Requirement,
                Label = "api",
                Properties = new()
            }
        ];

        ManifestService service = new() { ServiceName = "api", ServiceId = "svc-api" };

        TopologyProposalRelationshipEndpointIndex.TryResolveGraphTopologyNodeIdForService(service, graphNodes, out string nodeId)
            .Should()
            .BeFalse();

        nodeId.Should().BeEmpty();
    }

    [Fact]
    public void TryResolveGraphTopologyNodeIdForService_returns_true_when_service_id_is_datastore_synthetic_for_node_label()
    {
        List<GraphNode> graphNodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            }
        ];

        ManifestService service = new() { ServiceName = "overlay", ServiceId = "ds-api" };

        TopologyProposalRelationshipEndpointIndex.TryResolveGraphTopologyNodeIdForService(service, graphNodes, out string nodeId)
            .Should()
            .BeTrue();

        nodeId.Should().Be("svc-1");
    }

    [Fact]
    public void RelationshipEndpointsAreKnown_trims_surrounding_whitespace_on_endpoint_ids()
    {
        HashSet<string> knownEndpointKeys = new(StringComparer.OrdinalIgnoreCase)
        {
            "svc-api",
            "ds-sql",
        };

        ManifestRelationship relationship = new()
        {
            SourceId = "  svc-api  ",
            TargetId = "  ds-sql  ",
            RelationshipType = RelationshipType.ReadsFrom,
        };

        TopologyProposalRelationshipEndpointIndex.RelationshipEndpointsAreKnown(relationship, knownEndpointKeys)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void TryResolveGraphTopologyNodeIdForDatastore_returns_true_when_datastore_id_is_service_synthetic_for_node_label()
    {
        List<GraphNode> graphNodes =
        [
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        ManifestDatastore datastore = new() { DatastoreName = "overlay", DatastoreId = "svc-sql" };

        TopologyProposalRelationshipEndpointIndex.TryResolveGraphTopologyNodeIdForDatastore(datastore, graphNodes, out string nodeId)
            .Should()
            .BeTrue();

        nodeId.Should().Be("ds-1");
    }

    [Fact]
    public void TryResolveGraphTopologyNodeIdForDatastore_returns_false_when_graph_node_is_not_topology_resource()
    {
        List<GraphNode> graphNodes =
        [
            new()
            {
                NodeId = "req-1",
                NodeType = GraphNodeTypes.Requirement,
                Label = "sql",
                Properties = new()
            }
        ];

        ManifestDatastore datastore = new() { DatastoreName = "sql", DatastoreId = "ds-sql" };

        TopologyProposalRelationshipEndpointIndex.TryResolveGraphTopologyNodeIdForDatastore(datastore, graphNodes, out string nodeId)
            .Should()
            .BeFalse();

        nodeId.Should().BeEmpty();
    }

    [Fact]
    public void AddGraphNodeEndpointKeys_indexes_node_id_as_known_endpoint()
    {
        HashSet<string> knownEndpointKeys = new(StringComparer.OrdinalIgnoreCase);

        GraphNode node = new()
        {
            NodeId = "svc-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "api",
            Category = GraphTopologyCategories.Compute,
            Properties = new()
        };

        TopologyProposalRelationshipEndpointIndex.AddGraphNodeEndpointKeys(knownEndpointKeys, node);

        TopologyProposalRelationshipEndpointIndex.EndpointKeyIsKnown("svc-1", knownEndpointKeys).Should().BeTrue();
        TopologyProposalRelationshipEndpointIndex.EndpointKeyIsKnown("api", knownEndpointKeys).Should().BeTrue();
    }

    [Fact]
    public void TryResolveGraphTopologyNodeIdForService_returns_true_when_service_id_matches_graph_node_source_id()
    {
        List<GraphNode> graphNodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                SourceId = "azurerm_linux_web_app.app",
                Properties = new()
            }
        ];

        ManifestService service = new() { ServiceName = "app", ServiceId = "azurerm_linux_web_app.app" };

        TopologyProposalRelationshipEndpointIndex.TryResolveGraphTopologyNodeIdForService(service, graphNodes, out string nodeId)
            .Should()
            .BeTrue();

        nodeId.Should().Be("svc-1");
    }

    [Fact]
    public void TryResolveGraphTopologyNodeIdForService_returns_true_when_service_id_matches_arm_resource_id_on_node()
    {
        const string canonicalArmId =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api-app";
        const string mixedCaseArmId =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Web/sites/api-app";

        List<GraphNode> graphNodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new Dictionary<string, string> { ["resourceId"] = canonicalArmId }
            }
        ];

        ManifestService service = new() { ServiceName = "app", ServiceId = mixedCaseArmId };

        TopologyProposalRelationshipEndpointIndex.TryResolveGraphTopologyNodeIdForService(service, graphNodes, out string nodeId)
            .Should()
            .BeTrue();

        nodeId.Should().Be("svc-1");
    }

    [Fact]
    public void AddGraphNodeResolutionKeys_maps_node_id_and_label_to_node_id()
    {
        Dictionary<string, string> endpointKeyToNodeId = new(StringComparer.OrdinalIgnoreCase);

        GraphNode node = new()
        {
            NodeId = "svc-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "api",
            Category = GraphTopologyCategories.Compute,
            Properties = new()
        };

        TopologyProposalRelationshipEndpointIndex.AddGraphNodeResolutionKeys(endpointKeyToNodeId, node);

        endpointKeyToNodeId["svc-1"].Should().Be("svc-1");
        endpointKeyToNodeId["api"].Should().Be("svc-1");
    }

    [Fact]
    public void FilterKnownRelationships_matches_relationship_endpoints_case_insensitively()
    {
        List<ManifestService> services =
        [
            new ManifestService { ServiceName = "api", ServiceId = "svc-api" },
        ];

        List<ManifestDatastore> datastores =
        [
            new ManifestDatastore { DatastoreName = "sql", DatastoreId = "ds-sql" },
        ];

        List<ManifestRelationship> relationships =
        [
            new ManifestRelationship
            {
                SourceId = "SVC-API",
                TargetId = "DS-SQL",
                RelationshipType = RelationshipType.ReadsFrom,
            },
        ];

        List<ManifestRelationship> filtered = TopologyProposalRelationshipEndpointIndex.FilterKnownRelationships(
            services,
            datastores,
            relationships);

        filtered.Should().ContainSingle();
    }

    [Fact]
    public void TryResolveGraphTopologyNodeIdForDatastore_returns_true_when_datastore_id_matches_graph_node_source_id()
    {
        List<GraphNode> graphNodes =
        [
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                SourceId = "azurerm_mssql_database.orders",
                Properties = new()
            }
        ];

        ManifestDatastore datastore = new()
        {
            DatastoreName = "orders",
            DatastoreId = "azurerm_mssql_database.orders"
        };

        TopologyProposalRelationshipEndpointIndex.TryResolveGraphTopologyNodeIdForDatastore(datastore, graphNodes, out string nodeId)
            .Should()
            .BeTrue();

        nodeId.Should().Be("ds-1");
    }

    [Fact]
    public void TryResolveGraphTopologyNodeIdForDatastore_returns_true_when_datastore_id_matches_arm_resource_id_on_node()
    {
        const string canonicalArmId =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.sql/servers/sql-srv";
        const string mixedCaseArmId =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Sql/servers/sql-srv";

        List<GraphNode> graphNodes =
        [
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new Dictionary<string, string> { ["resourceId"] = canonicalArmId }
            }
        ];

        ManifestDatastore datastore = new() { DatastoreName = "sql", DatastoreId = mixedCaseArmId };

        TopologyProposalRelationshipEndpointIndex.TryResolveGraphTopologyNodeIdForDatastore(datastore, graphNodes, out string nodeId)
            .Should()
            .BeTrue();

        nodeId.Should().Be("ds-1");
    }

    [Fact]
    public void TryClaimService_registers_arm_resource_id_variants_in_claimed_endpoint_keys()
    {
        const string canonicalArmId =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api-app";
        const string mixedCaseArmId =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Web/sites/api-app";

        HashSet<string> claimed = new(StringComparer.OrdinalIgnoreCase);

        ManifestService first = new() { ServiceName = "api", ServiceId = mixedCaseArmId };

        TopologyProposalRelationshipEndpointIndex.TryClaimService(first, claimed).Should().BeTrue();
        claimed.Should().Contain(canonicalArmId);

        ManifestService duplicate = new() { ServiceName = "other", ServiceId = canonicalArmId };

        TopologyProposalRelationshipEndpointIndex.TryClaimService(duplicate, claimed).Should().BeFalse();
    }

    [Fact]
    public void TryClaimDatastore_registers_arm_resource_id_variants_in_claimed_endpoint_keys()
    {
        const string canonicalArmId =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.sql/servers/sql-srv";
        const string mixedCaseArmId =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Sql/servers/sql-srv";

        HashSet<string> claimed = new(StringComparer.OrdinalIgnoreCase);

        ManifestDatastore first = new() { DatastoreName = "sql", DatastoreId = mixedCaseArmId };

        TopologyProposalRelationshipEndpointIndex.TryClaimDatastore(first, claimed).Should().BeTrue();
        claimed.Should().Contain(canonicalArmId);

        ManifestDatastore duplicate = new() { DatastoreName = "other", DatastoreId = canonicalArmId };

        TopologyProposalRelationshipEndpointIndex.TryClaimDatastore(duplicate, claimed).Should().BeFalse();
    }

    [Fact]
    public void AddGraphNodeEndpointKeys_indexes_non_sentinel_source_id_as_known_endpoint()
    {
        HashSet<string> knownEndpointKeys = new(StringComparer.OrdinalIgnoreCase);

        GraphNode node = new()
        {
            NodeId = "svc-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "api",
            Category = GraphTopologyCategories.Compute,
            SourceId = "azurerm_linux_web_app.app",
            Properties = new()
        };

        TopologyProposalRelationshipEndpointIndex.AddGraphNodeEndpointKeys(knownEndpointKeys, node);

        TopologyProposalRelationshipEndpointIndex.EndpointKeyIsKnown("azurerm_linux_web_app.app", knownEndpointKeys)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void AddGraphNodeResolutionKeys_maps_source_id_to_node_id_when_not_proposed_changes_sentinel()
    {
        Dictionary<string, string> endpointKeyToNodeId = new(StringComparer.OrdinalIgnoreCase);

        GraphNode node = new()
        {
            NodeId = "svc-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "api",
            Category = GraphTopologyCategories.Compute,
            SourceId = "azurerm_linux_web_app.app",
            Properties = new()
        };

        TopologyProposalRelationshipEndpointIndex.AddGraphNodeResolutionKeys(endpointKeyToNodeId, node);

        endpointKeyToNodeId["azurerm_linux_web_app.app"].Should().Be("svc-1");
    }

    [Fact]
    public void TryResolveGraphTopologyNodeIdForDatastore_returns_true_when_datastore_name_matches_synthetic_node_id()
    {
        List<GraphNode> graphNodes =
        [
            new()
            {
                NodeId = "ds-sql",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        ManifestDatastore datastore = new() { DatastoreName = "sql", DatastoreId = "ds-proposed" };

        TopologyProposalRelationshipEndpointIndex.TryResolveGraphTopologyNodeIdForDatastore(datastore, graphNodes, out string nodeId)
            .Should()
            .BeTrue();

        nodeId.Should().Be("ds-sql");
    }

    [Fact]
    public void TryResolveGraphTopologyNodeIdForService_returns_true_when_service_name_matches_synthetic_node_id()
    {
        List<GraphNode> graphNodes =
        [
            new()
            {
                NodeId = "svc-api",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "billing-api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            }
        ];

        ManifestService service = new() { ServiceName = "api", ServiceId = "svc-proposed" };

        TopologyProposalRelationshipEndpointIndex.TryResolveGraphTopologyNodeIdForService(service, graphNodes, out string nodeId)
            .Should()
            .BeTrue();

        nodeId.Should().Be("svc-api");
    }

    [Fact]
    public void TryResolveGraphTopologyNodeIdForService_returns_true_when_service_id_matches_node_id()
    {
        List<GraphNode> graphNodes =
        [
            new()
            {
                NodeId = "svc-inventoried",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            }
        ];

        ManifestService service = new() { ServiceName = "other", ServiceId = "svc-inventoried" };

        TopologyProposalRelationshipEndpointIndex.TryResolveGraphTopologyNodeIdForService(service, graphNodes, out string nodeId)
            .Should()
            .BeTrue();

        nodeId.Should().Be("svc-inventoried");
    }

    [Fact]
    public void TryResolveGraphTopologyNodeIdForDatastore_returns_true_when_datastore_id_matches_node_id()
    {
        List<GraphNode> graphNodes =
        [
            new()
            {
                NodeId = "ds-inventoried",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        ManifestDatastore datastore = new() { DatastoreName = "other", DatastoreId = "ds-inventoried" };

        TopologyProposalRelationshipEndpointIndex.TryResolveGraphTopologyNodeIdForDatastore(datastore, graphNodes, out string nodeId)
            .Should()
            .BeTrue();

        nodeId.Should().Be("ds-inventoried");
    }

    [Fact]
    public void AddDeclaredManifestDatastoreEndpointAliases_registers_arm_id_resolution_aliases()
    {
        const string canonicalArmId =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.sql/servers/sql-srv";
        const string mixedCaseArmId =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Sql/servers/sql-srv";

        Dictionary<string, string> aliases = new(StringComparer.OrdinalIgnoreCase);

        ManifestDatastore datastore = new() { DatastoreName = "sql", DatastoreId = mixedCaseArmId };

        TopologyProposalRelationshipEndpointIndex.AddDeclaredManifestDatastoreEndpointAliases(aliases, datastore);

        aliases[mixedCaseArmId].Should().Be(mixedCaseArmId);
        aliases[canonicalArmId].Should().Be(mixedCaseArmId);
    }

    [Fact]
    public void AddDeclaredManifestServiceEndpointAliases_registers_arm_id_resolution_aliases()
    {
        const string canonicalArmId =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api-app";
        const string mixedCaseArmId =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Web/sites/api-app";

        Dictionary<string, string> aliases = new(StringComparer.OrdinalIgnoreCase);

        ManifestService service = new() { ServiceName = "api", ServiceId = mixedCaseArmId };

        TopologyProposalRelationshipEndpointIndex.AddDeclaredManifestServiceEndpointAliases(aliases, service);

        aliases[mixedCaseArmId].Should().Be(mixedCaseArmId);
        aliases[canonicalArmId].Should().Be(mixedCaseArmId);
    }

    [Fact]
    public void TryResolveGraphTopologyNodeIdForService_returns_true_when_service_name_matches_graph_node_label()
    {
        List<GraphNode> graphNodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new()
            }
        ];

        ManifestService service = new() { ServiceName = "api", ServiceId = "svc-proposed" };

        TopologyProposalRelationshipEndpointIndex.TryResolveGraphTopologyNodeIdForService(service, graphNodes, out string nodeId)
            .Should()
            .BeTrue();

        nodeId.Should().Be("svc-1");
    }

    [Fact]
    public void TryResolveGraphTopologyNodeIdForDatastore_returns_true_when_datastore_name_matches_graph_node_label()
    {
        List<GraphNode> graphNodes =
        [
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new()
            }
        ];

        ManifestDatastore datastore = new() { DatastoreName = "sql", DatastoreId = "ds-proposed" };

        TopologyProposalRelationshipEndpointIndex.TryResolveGraphTopologyNodeIdForDatastore(datastore, graphNodes, out string nodeId)
            .Should()
            .BeTrue();

        nodeId.Should().Be("ds-1");
    }

    [Fact]
    public void FilterKnownRelationships_keeps_multiple_known_relationships()
    {
        List<ManifestService> services =
        [
            new ManifestService { ServiceName = "api", ServiceId = "svc-api" },
            new ManifestService { ServiceName = "worker", ServiceId = "svc-worker" },
        ];

        List<ManifestDatastore> datastores =
        [
            new ManifestDatastore { DatastoreName = "sql", DatastoreId = "ds-sql" },
        ];

        List<ManifestRelationship> relationships =
        [
            new ManifestRelationship
            {
                SourceId = "svc-api",
                TargetId = "ds-sql",
                RelationshipType = RelationshipType.ReadsFrom,
            },
            new ManifestRelationship
            {
                SourceId = "svc-worker",
                TargetId = "ds-sql",
                RelationshipType = RelationshipType.WritesTo,
            },
        ];

        List<ManifestRelationship> filtered = TopologyProposalRelationshipEndpointIndex.FilterKnownRelationships(
            services,
            datastores,
            relationships);

        filtered.Should().HaveCount(2);
    }

    [Fact]
    public void AddGraphNodeEndpointKeys_indexes_both_synthetic_prefixes_when_category_is_unset()
    {
        HashSet<string> knownEndpointKeys = new(StringComparer.OrdinalIgnoreCase);

        GraphNode node = new()
        {
            NodeId = "node-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "shared",
            Category = null,
            Properties = new()
        };

        TopologyProposalRelationshipEndpointIndex.AddGraphNodeEndpointKeys(knownEndpointKeys, node);

        TopologyProposalRelationshipEndpointIndex.EndpointKeyIsKnown("svc-shared", knownEndpointKeys).Should().BeTrue();
        TopologyProposalRelationshipEndpointIndex.EndpointKeyIsKnown("ds-shared", knownEndpointKeys).Should().BeTrue();
    }

    [Fact]
    public void AddGraphNodeResolutionKeys_keeps_first_node_id_when_label_alias_already_registered()
    {
        Dictionary<string, string> endpointKeyToNodeId = new(StringComparer.OrdinalIgnoreCase);

        GraphNode first = new()
        {
            NodeId = "svc-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "api",
            Category = GraphTopologyCategories.Compute,
            Properties = new()
        };

        GraphNode second = new()
        {
            NodeId = "svc-2",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "api",
            Category = GraphTopologyCategories.Compute,
            Properties = new()
        };

        TopologyProposalRelationshipEndpointIndex.AddGraphNodeResolutionKeys(endpointKeyToNodeId, first);
        TopologyProposalRelationshipEndpointIndex.AddGraphNodeResolutionKeys(endpointKeyToNodeId, second);

        endpointKeyToNodeId["api"].Should().Be("svc-1");
    }

    [Fact]
    public void TryResolveGraphTopologyNodeIdForService_returns_true_when_service_name_matches_arm_resource_id_on_node()
    {
        const string canonicalArmId =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.web/sites/api-app";
        const string mixedCaseArmId =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Web/sites/api-app";

        List<GraphNode> graphNodes =
        [
            new()
            {
                NodeId = "svc-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "api",
                Category = GraphTopologyCategories.Compute,
                Properties = new Dictionary<string, string> { ["resourceId"] = canonicalArmId }
            }
        ];

        ManifestService service = new() { ServiceName = mixedCaseArmId, ServiceId = "svc-proposed" };

        TopologyProposalRelationshipEndpointIndex.TryResolveGraphTopologyNodeIdForService(service, graphNodes, out string nodeId)
            .Should()
            .BeTrue();

        nodeId.Should().Be("svc-1");
    }

    [Fact]
    public void FilterKnownRelationships_keeps_only_known_rows_when_list_mixes_valid_and_invalid_relationships()
    {
        List<ManifestService> services =
        [
            new ManifestService { ServiceName = "api", ServiceId = "svc-api" },
        ];

        List<ManifestDatastore> datastores =
        [
            new ManifestDatastore { DatastoreName = "sql", DatastoreId = "ds-sql" },
        ];

        List<ManifestRelationship> relationships =
        [
            new ManifestRelationship
            {
                SourceId = "svc-api",
                TargetId = "ds-sql",
                RelationshipType = RelationshipType.ReadsFrom,
            },
            new ManifestRelationship
            {
                SourceId = "svc-api",
                TargetId = "ds-missing",
                RelationshipType = RelationshipType.ReadsFrom,
            },
        ];

        List<ManifestRelationship> filtered = TopologyProposalRelationshipEndpointIndex.FilterKnownRelationships(
            services,
            datastores,
            relationships);

        filtered.Should().ContainSingle(r => r.TargetId == "ds-sql");
    }

    [Fact]
    public void AddGraphNodeEndpointKeys_indexes_ds_synthetic_when_compute_node_has_terraform_datastore_source_id()
    {
        HashSet<string> knownEndpointKeys = new(StringComparer.OrdinalIgnoreCase);

        GraphNode node = new()
        {
            NodeId = "svc-orders",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "orders",
            Category = GraphTopologyCategories.Compute,
            SourceId = "azurerm_mssql_database.orders",
            Properties = new()
        };

        TopologyProposalRelationshipEndpointIndex.AddGraphNodeEndpointKeys(knownEndpointKeys, node);

        TopologyProposalRelationshipEndpointIndex.EndpointKeyIsKnown("ds-orders", knownEndpointKeys).Should().BeTrue();
    }

    [Fact]
    public void AddGraphNodeEndpointKeys_indexes_svc_synthetic_when_data_node_has_terraform_service_source_id()
    {
        HashSet<string> knownEndpointKeys = new(StringComparer.OrdinalIgnoreCase);

        GraphNode node = new()
        {
            NodeId = "ds-app",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "app",
            Category = GraphTopologyCategories.Data,
            SourceId = "azurerm_linux_web_app.app",
            Properties = new()
        };

        TopologyProposalRelationshipEndpointIndex.AddGraphNodeEndpointKeys(knownEndpointKeys, node);

        TopologyProposalRelationshipEndpointIndex.EndpointKeyIsKnown("svc-app", knownEndpointKeys).Should().BeTrue();
    }

    [Fact]
    public void TryResolveGraphTopologyNodeIdForDatastore_returns_true_when_datastore_name_matches_arm_resource_id_on_node()
    {
        const string canonicalArmId =
            "/subscriptions/sub/resourcegroups/rg/providers/microsoft.sql/servers/sql-srv";
        const string mixedCaseArmId =
            "/subscriptions/SUB/resourceGroups/RG/providers/Microsoft.Sql/servers/sql-srv";

        List<GraphNode> graphNodes =
        [
            new()
            {
                NodeId = "ds-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "sql",
                Category = GraphTopologyCategories.Data,
                Properties = new Dictionary<string, string> { ["resourceId"] = canonicalArmId }
            }
        ];

        ManifestDatastore datastore = new() { DatastoreName = mixedCaseArmId, DatastoreId = "ds-proposed" };

        TopologyProposalRelationshipEndpointIndex.TryResolveGraphTopologyNodeIdForDatastore(datastore, graphNodes, out string nodeId)
            .Should()
            .BeTrue();

        nodeId.Should().Be("ds-1");
    }

    [Fact]
    public void EndpointKeyIsKnown_returns_false_for_unrelated_literal_endpoint_key()
    {
        HashSet<string> knownEndpointKeys = new(StringComparer.OrdinalIgnoreCase) { "svc-api", "ds-sql" };

        TopologyProposalRelationshipEndpointIndex.EndpointKeyIsKnown("not-indexed", knownEndpointKeys).Should().BeFalse();
    }
}
