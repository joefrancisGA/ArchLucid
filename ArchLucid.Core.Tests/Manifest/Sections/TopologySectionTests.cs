using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

using ArchLucid.Core.Manifest.Sections;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Manifest.Sections;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TopologySectionTests
{
    [Fact]
    public void Defaults_empty_lists_for_patterns_resources_and_gaps()
    {
        TopologySection section = new();

        section.SelectedPatterns.Should().BeEmpty();
        section.Resources.Should().BeEmpty();
        section.Gaps.Should().BeEmpty();
        section.Services.Should().BeEmpty();
        section.Datastores.Should().BeEmpty();
        section.Relationships.Should().BeEmpty();
    }

    [Fact]
    public void Assigns_string_collections_and_typed_graph_nodes()
    {
        ManifestService svc = new()
        {
            ServiceId = "svc-a",
            ServiceName = "API",
            ServiceType = ServiceType.Api,
            RuntimePlatform = RuntimePlatform.AppService,
        };

        ManifestDatastore ds = new()
        {
            DatastoreId = "ds-a",
            DatastoreName = "SQL",
            DatastoreType = DatastoreType.Sql,
            RuntimePlatform = RuntimePlatform.SqlServer,
        };

        ManifestRelationship edge = new()
        {
            RelationshipId = "rel-1",
            SourceId = "svc-a",
            TargetId = "ds-a",
            RelationshipType = RelationshipType.ReadsFrom,
        };

        TopologySection section = new()
        {
            SelectedPatterns = ["hub-spoke"],
            Resources = ["r1"],
            Gaps = ["g1"],
            Services = [svc],
            Datastores = [ds],
            Relationships = [edge],
        };

        section.SelectedPatterns.Should().Equal("hub-spoke");
        section.Resources.Should().Equal("r1");
        section.Gaps.Should().Equal("g1");
        section.Services.Should().ContainSingle().Which.ServiceId.Should().Be("svc-a");
        section.Datastores.Should().ContainSingle().Which.DatastoreId.Should().Be("ds-a");
        section.Relationships.Should().ContainSingle().Which.RelationshipType.Should().Be(RelationshipType.ReadsFrom);
    }
}
