using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Requests;

[Trait("Category", "Unit")]
public sealed class PolicyPackCloudTargetMismatchEvaluatorTests
{
    [Fact]
    public void Evaluate_returns_null_when_policy_references_empty()
    {
        PolicyPackCloudTargetMismatchEvaluator
            .Evaluate(CloudProvider.Aws, [])
            .Should()
            .BeNull();
    }

    [Fact]
    public void Evaluate_blocks_azure_pack_on_aws_target()
    {
        PolicyPackCloudTargetMismatchEvaluator
            .Evaluate(CloudProvider.Aws, ["cis-azure-baseline"])
            .Should()
            .Contain("AWS");
    }

    [Fact]
    public void Evaluate_allows_matching_cloud_pack()
    {
        PolicyPackCloudTargetMismatchEvaluator
            .Evaluate(CloudProvider.Aws, ["aws-foundational-security"])
            .Should()
            .BeNull();
    }

    [Fact]
    public void Evaluate_blocks_cloud_specific_pack_on_none_target()
    {
        PolicyPackCloudTargetMismatchEvaluator
            .Evaluate(CloudProvider.None, ["azure-security-baseline"])
            .Should()
            .Contain("cloud-neutral");
    }
}
