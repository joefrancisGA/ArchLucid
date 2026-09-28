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
}
