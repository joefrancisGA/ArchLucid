using ArchLucid.ArtifactSynthesis.Classifiers;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class OrphanedGcpResourceClassifierTests
{
    [Fact]
    public void ClassifyFromResourcesJson_flags_unattached_disk()
    {
        const string resourcesJson =
            """
            [
              {
                "name": "projects/demo/zones/us-central1-a/disks/disk-1",
                "resourceType": "compute.googleapis.com/Disk",
                "location": "us-central1-a",
                "properties": { "users": [] }
              }
            ]
            """;

        IReadOnlyList<OrphanedResourceFinding> findings =
            OrphanedGcpResourceClassifier.ClassifyFromResourcesJson(resourcesJson);

        findings.Should().ContainSingle();
        findings[0].ResourceType.Should().Be("compute.googleapis.com/Disk");
    }
}
