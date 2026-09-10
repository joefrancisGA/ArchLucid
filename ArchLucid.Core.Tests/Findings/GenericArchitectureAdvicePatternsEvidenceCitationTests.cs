using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class GenericArchitectureAdvicePatternsEvidenceCitationTests
{
    private const string StorageArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stpayprod";

    private const string AwsArn = "arn:aws:s3:::pay-logs-cfn-demo";

    private const string GcpResourceName = "projects/demo-project/zones/us-central1-a/instances/web-1";

    [Theory]
    [InlineData("graph-node:storage-1", false)]
    [InlineData("graph-node:actor-checkout", false)]
    [InlineData("graph-node:sql-pay-prod", false)]
    [InlineData("request", false)]
    [InlineData("critic-checklist", false)]
    public void HasConcreteEvidenceCitation_rejects_label_shaped_and_generic_refs(string evidenceRef, bool expected)
    {
        GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation([evidenceRef]).Should().Be(expected);
    }

    [Theory]
    [InlineData("doc:manifest.json#L10", true)]
    [InlineData("doc:architecture.md#L12", true)]
    [InlineData("doc:architecture.md#L12-18", true)]
    [InlineData("doc:architecture.md#l12", true)]
    [InlineData("policy-rule:cis-az-006", true)]
    [InlineData("doc:architecture.md", false)]
    [InlineData("doc:architecture.md#services", false)]
    [InlineData("doc:architecture.md#overview", false)]
    [InlineData("doc:manifest.json#services", false)]
    [InlineData("finding:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", false)]
    public void HasConcreteEvidenceCitation_accepts_doc_and_policy_rule_refs(string evidenceRef, bool expected)
    {
        GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation([evidenceRef]).Should().Be(expected);
    }

    [Fact]
    public void HasLineAnchoredDocRef_requires_hash_L_and_a_digit()
    {
        FindingEvidenceRefs.HasLineAnchoredDocRef("doc:architecture.md#L12").Should().BeTrue();
        FindingEvidenceRefs.HasLineAnchoredDocRef("doc:architecture.md#L12-18").Should().BeTrue();
        FindingEvidenceRefs.HasLineAnchoredDocRef("doc:architecture.md").Should().BeFalse();
        FindingEvidenceRefs.HasLineAnchoredDocRef("doc:architecture.md#services").Should().BeFalse();
        FindingEvidenceRefs.HasLineAnchoredDocRef("policy-rule:cis-az-006").Should().BeFalse();
        FindingEvidenceRefs.HasLineAnchoredDocRef(null).Should().BeFalse();
    }

    [Fact]
    public void HasConcreteEvidenceCitation_accepts_product_shaped_graph_node_refs()
    {
        GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation([$"graph-node:{StorageArmId}"]).Should().BeTrue();
        GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation([$"graph-node:{AwsArn}"]).Should().BeTrue();
        GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation([$"graph-node:{GcpResourceName}"]).Should().BeTrue();
    }

    [Fact]
    public void HasConcreteEvidenceCitation_accepts_arm_aws_and_gcp_refs_without_graph_node_prefix()
    {
        GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation([StorageArmId]).Should().BeTrue();
        GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation([$"aws:arn:{AwsArn}"]).Should().BeTrue();
        GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation([GcpResourceName]).Should().BeTrue();
    }

    [Fact]
    public void HasConcreteEvidenceCitation_returns_false_for_empty_list()
    {
        GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation([]).Should().BeFalse();
    }
}
