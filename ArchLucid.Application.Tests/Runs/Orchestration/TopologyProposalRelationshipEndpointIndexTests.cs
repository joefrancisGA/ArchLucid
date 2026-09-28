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
}
