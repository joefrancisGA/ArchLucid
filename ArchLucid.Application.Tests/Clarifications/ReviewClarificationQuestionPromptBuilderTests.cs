using ArchLucid.Application.Clarifications;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Clarifications;

[Trait("Category", "Unit")]
public sealed class ReviewClarificationQuestionPromptBuilderTests
{
    [Fact]
    public void Build_policy_coverage_does_not_use_should_imperative()
    {
        string prompt = ReviewClarificationQuestionPromptBuilder.Build(
            FindingTypes.PolicyCoverageFinding,
            "storage-account-1");

        prompt.Should().Contain("covers uncovered resource");
        prompt.Should().NotContain("should cover");
    }

    [Fact]
    public void Build_security_coverage_does_not_imply_protection()
    {
        string prompt = ReviewClarificationQuestionPromptBuilder.Build(
            FindingTypes.SecurityCoverageFinding,
            "subnet-a");

        prompt.Should().Contain("applies to");
        prompt.Should().NotContain("protects");
    }

    [Fact]
    public void Build_policy_applicability_does_not_use_should()
    {
        string prompt = ReviewClarificationQuestionPromptBuilder.Build(
            FindingTypes.PolicyApplicabilityFinding,
            "cis-az-001");

        prompt.Should().Contain("does policy");
        prompt.Should().NotContain("should policy");
    }

    [Fact]
    public void Build_topology_coverage_does_not_use_assert_imperative()
    {
        string prompt = ReviewClarificationQuestionPromptBuilder.Build(
            FindingTypes.TopologyCoverageFinding,
            "integrations");

        prompt.Should().NotContain("assert");
        prompt.Should().NotContain("should cover");
    }

    [Fact]
    public void Build_arm_id_missing_item_uses_resource_name_honesty()
    {
        string prompt = ReviewClarificationQuestionPromptBuilder.Build(
            FindingTypes.SecurityCoverageFinding,
            "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1");

        prompt.Should().Contain("Resource name was not stored");
        prompt.Should().NotContain("assert");
    }

    [Fact]
    public void Build_whitespace_missing_item_uses_stored_empty_copy()
    {
        string prompt = ReviewClarificationQuestionPromptBuilder.Build(
            FindingTypes.SecurityCoverageFinding,
            "   ");

        prompt.Should().Contain(ReviewClarificationQuestionPromptBuilder.MissingItemStoredEmptyCopy);
    }
}
