using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Manifest;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ClosedLoopManifestTopologyMergerTests
{
    [Fact]
    public void MergePublishableTopology_adds_services_datastores_and_relationships()
    {
        ManifestDocument manifest = new();
        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-1",
            TenantId = "tenant-1",
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "svc-api",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Order API",
                    Description = "Public HTTPS API",
                    LifecycleScope = ArchitectureLifecycleScope.TargetState,
                },
                new ArchitectureModelElement
                {
                    ElementId = "ds-sql",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Orders SQL Database",
                    Description = "Primary relational datastore",
                    LifecycleScope = ArchitectureLifecycleScope.TargetState,
                },
                new ArchitectureModelElement
                {
                    ElementId = "flow-write",
                    Kind = ArchitectureElementKind.DataFlow,
                    Name = "API writes orders",
                    Description = "Persist order payloads",
                    RelatedElementIds = ["svc-api", "ds-sql"],
                },
            ],
        };

        ClosedLoopManifestTopologyMergeResult result =
            ClosedLoopManifestTopologyMerger.MergePublishableTopology(manifest, model);

        result.MergedServiceCount.Should().Be(1);
        result.MergedDatastoreCount.Should().Be(1);
        result.MergedRelationshipCount.Should().Be(1);
        manifest.Topology.Services.Should().ContainSingle(service => service.ServiceName == "Order API");
        manifest.Topology.Datastores.Should().ContainSingle(datastore => datastore.DatastoreName == "Orders SQL Database");
        manifest.Topology.Relationships.Should().ContainSingle(relationship =>
            relationship.RelationshipType == RelationshipType.WritesTo);
        manifest.Topology.Resources.Should().Contain("ClosedLoopStrengthened");
    }

    [Fact]
    public void MergePublishableTopology_keeps_node_ids_distinct_when_element_ids_only_differ_by_hyphens()
    {
        ManifestDocument manifest = new();
        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-1",
            TenantId = "tenant-1",
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "svc-api",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Public API",
                    LifecycleScope = ArchitectureLifecycleScope.TargetState,
                },
                new ArchitectureModelElement
                {
                    ElementId = "svcapi",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Internal API",
                    LifecycleScope = ArchitectureLifecycleScope.TargetState,
                },
                new ArchitectureModelElement
                {
                    ElementId = "flow-read",
                    Kind = ArchitectureElementKind.DataFlow,
                    Name = "Public API reads from internal API",
                    RelatedElementIds = ["svc-api", "svcapi"],
                },
            ],
        };

        ClosedLoopManifestTopologyMergeResult result =
            ClosedLoopManifestTopologyMerger.MergePublishableTopology(manifest, model);

        result.MergedServiceCount.Should().Be(2);
        result.MergedRelationshipCount.Should().Be(1);
        manifest.Topology.Services.Select(static service => service.ServiceId).Should().OnlyHaveUniqueItems();

        ManifestRelationship relationship = manifest.Topology.Relationships.Should().ContainSingle().Subject;
        relationship.SourceId.Should().NotBe(relationship.TargetId);
    }

    [Fact]
    public void MergePublishableTopology_skips_dataflow_when_relationship_type_cannot_be_stored()
    {
        ManifestDocument manifest = new();
        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-1",
            TenantId = "tenant-1",
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "svc-api",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Order API",
                    LifecycleScope = ArchitectureLifecycleScope.TargetState,
                },
                new ArchitectureModelElement
                {
                    ElementId = "ds-sql",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Orders SQL Database",
                    LifecycleScope = ArchitectureLifecycleScope.TargetState,
                },
                new ArchitectureModelElement
                {
                    ElementId = "flow-link",
                    Kind = ArchitectureElementKind.DataFlow,
                    Name = "Link",
                    Description = "No verb hint for relationship type",
                    RelatedElementIds = ["svc-api", "ds-sql"],
                },
            ],
        };

        ClosedLoopManifestTopologyMergeResult result =
            ClosedLoopManifestTopologyMerger.MergePublishableTopology(manifest, model);

        result.MergedRelationshipCount.Should().Be(0);
        manifest.Topology.Relationships.Should().BeEmpty();
    }

    [Fact]
    public void MergePublishableTopology_skips_current_state_components()
    {
        ManifestDocument manifest = new();
        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "model-1",
            TenantId = "tenant-1",
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "legacy",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Legacy Monolith",
                    LifecycleScope = ArchitectureLifecycleScope.CurrentState,
                },
            ],
        };

        ClosedLoopManifestTopologyMergeResult result =
            ClosedLoopManifestTopologyMerger.MergePublishableTopology(manifest, model);

        result.MergedServiceCount.Should().Be(0);
        manifest.Topology.Services.Should().BeEmpty();
    }
}
