using ArchLucid.ArtifactSynthesis.Classifiers;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class OrphanedAwsResourceClassifierTests
{
    [Fact]
    public void ClassifyFromResourcesJson_flags_unattached_volume()
    {
        const string resourcesJson =
            """
            [
              {
                "name": "arn:aws:ec2:us-east-1:123:volume/vol-1",
                "resourceType": "AWS::EC2::Volume",
                "location": "us-east-1",
                "properties": { "state": "available", "attachments": [] }
              }
            ]
            """;

        IReadOnlyList<OrphanedResourceFinding> findings =
            OrphanedAwsResourceClassifier.ClassifyFromResourcesJson(resourcesJson);

        findings.Should().ContainSingle();
        findings[0].ResourceType.Should().Be("AWS::EC2::Volume");
    }

    [Fact]
    public void ClassifyFromResourcesJson_skips_rows_without_properties()
    {
        const string resourcesJson =
            """
            [
              {
                "name": "arn:aws:ec2:us-east-1:123:volume/vol-1",
                "resourceType": "AWS::EC2::Volume",
                "location": "us-east-1"
              }
            ]
            """;

        OrphanedAwsResourceClassifier.ClassifyFromResourcesJson(resourcesJson).Should().BeEmpty();
    }
}
