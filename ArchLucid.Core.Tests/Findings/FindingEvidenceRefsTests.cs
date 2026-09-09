using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingEvidenceRefsTests
{
    private const string StorageArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stpayprod";

    private const string AwsArn = "arn:aws:rds:us-east-1:123456789012:db:pay-db";

    [Fact]
    public void TryAppendInventoryResourceId_adds_arm_path_unchanged()
    {
        List<string> evidenceRefs = [];

        FindingEvidenceRefs.TryAppendInventoryResourceId(evidenceRefs, StorageArmId);

        evidenceRefs.Should().ContainSingle().Which.Should().Be(StorageArmId);
    }

    [Fact]
    public void TryAppendInventoryResourceId_prefixes_aws_arn()
    {
        List<string> evidenceRefs = [];

        FindingEvidenceRefs.TryAppendInventoryResourceId(evidenceRefs, AwsArn);

        evidenceRefs.Should().ContainSingle().Which.Should().Be($"aws:arn:{AwsArn}");
    }

    [Fact]
    public void TryAppendPolicyRuleId_adds_policy_rule_prefix()
    {
        List<string> evidenceRefs = [];

        FindingEvidenceRefs.TryAppendPolicyRuleId(evidenceRefs, "cis-az-006");

        evidenceRefs.Should().ContainSingle().Which.Should().Be("policy-rule:cis-az-006");
    }

    [Fact]
    public void TryAppendDistinct_skips_generic_tokens()
    {
        List<string> evidenceRefs = [];

        FindingEvidenceRefs.TryAppendDistinct(evidenceRefs, "request");
        FindingEvidenceRefs.TryAppendDistinct(evidenceRefs, "critic-checklist");

        evidenceRefs.Should().BeEmpty();
    }
}
