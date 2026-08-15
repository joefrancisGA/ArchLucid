using ArchLucid.ArtifactSynthesis.Classifiers;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class AwsInventorySecurityBaselineClassifierTests
{
    [Fact]
    public void ClassifyFromResourcesJson_flags_permissive_s3_public_access_block()
    {
        const string resourcesJson =
            """
            [
              {
                "name": "arn:aws:s3:::open-bucket",
                "resourceType": "AWS::S3::Bucket",
                "properties": {
                  "publicAccessBlockConfiguration": {
                    "blockPublicAcls": false,
                    "ignorePublicAcls": true,
                    "blockPublicPolicy": true,
                    "restrictPublicBuckets": true
                  }
                }
              }
            ]
            """;

        IReadOnlyList<InventorySecurityBaselineFinding> findings =
            AwsInventorySecurityBaselineClassifier.ClassifyFromResourcesJson(resourcesJson);

        findings.Should().ContainSingle();
        findings[0].ControlFamily.Should().Be("data-protection");
        findings[0].Message.Should().Contain("public access block");
    }

    [Fact]
    public void ClassifyFromResourcesJson_flags_open_admin_security_group_ingress()
    {
        const string resourcesJson =
            """
            [
              {
                "name": "sg-admin-open",
                "resourceType": "AWS::EC2::SecurityGroup",
                "properties": {
                  "securityGroupIngress": [
                    {
                      "cidrIp": "0.0.0.0/0",
                      "fromPort": 22,
                      "toPort": 22
                    }
                  ]
                }
              }
            ]
            """;

        IReadOnlyList<InventorySecurityBaselineFinding> findings =
            AwsInventorySecurityBaselineClassifier.ClassifyFromResourcesJson(resourcesJson);

        findings.Should().ContainSingle();
        findings[0].ControlFamily.Should().Be("network-isolation");
    }

    [Fact]
    public void ClassifyFromResourcesJson_returns_empty_for_compliant_rows()
    {
        const string resourcesJson =
            """
            [
              {
                "name": "arn:aws:s3:::private-bucket",
                "resourceType": "AWS::S3::Bucket",
                "properties": {
                  "publicAccessBlockConfiguration": {
                    "blockPublicAcls": true,
                    "ignorePublicAcls": true,
                    "blockPublicPolicy": true,
                    "restrictPublicBuckets": true
                  }
                }
              }
            ]
            """;

        AwsInventorySecurityBaselineClassifier.ClassifyFromResourcesJson(resourcesJson).Should().BeEmpty();
    }
}
