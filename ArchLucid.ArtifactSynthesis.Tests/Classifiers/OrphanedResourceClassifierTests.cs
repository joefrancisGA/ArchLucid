using ArchLucid.ArtifactSynthesis.Classifiers;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests.Classifiers;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class OrphanedResourceClassifierTests
{
    [Fact]
    public void ClassifyFromResourcesJson_flags_unattached_disk()
    {
        const string json = """
            [
              {
                "resourceType": "Microsoft.Compute/disks",
                "resourceId": "/subscriptions/x/resourceGroups/rg/providers/Microsoft.Compute/disks/d1",
                "properties": {}
              }
            ]
            """;

        IReadOnlyList<OrphanedResourceFinding> findings = OrphanedResourceClassifier.ClassifyFromResourcesJson(json);

        findings.Should().ContainSingle();
        findings[0].ResourceType.Should().Be("Microsoft.Compute/disks");
    }
}
