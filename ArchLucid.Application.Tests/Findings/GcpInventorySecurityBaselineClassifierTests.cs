using ArchLucid.ArtifactSynthesis.Classifiers;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class GcpInventorySecurityBaselineClassifierTests
{
    [Fact]
    public void ClassifyFromResourcesJson_flags_bucket_without_public_access_prevention()
    {
        const string resourcesJson =
            """
            [
              {
                "name": "projects/demo/buckets/public-demo",
                "resourceType": "storage.googleapis.com/Bucket",
                "properties": {
                  "iamConfiguration": {
                    "publicAccessPrevention": "inherited"
                  }
                }
              }
            ]
            """;

        IReadOnlyList<InventorySecurityBaselineFinding> findings =
            GcpInventorySecurityBaselineClassifier.ClassifyFromResourcesJson(resourcesJson);

        findings.Should().ContainSingle();
        findings[0].ControlFamily.Should().Be("data-protection");
    }

    [Fact]
    public void ClassifyFromResourcesJson_flags_open_admin_firewall_rule()
    {
        const string resourcesJson =
            """
            [
              {
                "name": "projects/demo/global/firewalls/allow-ssh",
                "resourceType": "compute.googleapis.com/Firewall",
                "properties": {
                  "sourceRanges": ["0.0.0.0/0"],
                  "allowed": [
                    {
                      "IPProtocol": "tcp",
                      "ports": "22"
                    }
                  ]
                }
              }
            ]
            """;

        IReadOnlyList<InventorySecurityBaselineFinding> findings =
            GcpInventorySecurityBaselineClassifier.ClassifyFromResourcesJson(resourcesJson);

        findings.Should().ContainSingle();
        findings[0].ControlFamily.Should().Be("network-isolation");
    }

    [Fact]
    public void ClassifyFromResourcesJson_returns_empty_for_enforced_bucket()
    {
        const string resourcesJson =
            """
            [
              {
                "name": "projects/demo/buckets/private-demo",
                "resourceType": "storage.googleapis.com/Bucket",
                "properties": {
                  "iamConfiguration": {
                    "publicAccessPrevention": "enforced"
                  }
                }
              }
            ]
            """;

        GcpInventorySecurityBaselineClassifier.ClassifyFromResourcesJson(resourcesJson).Should().BeEmpty();
    }
}
