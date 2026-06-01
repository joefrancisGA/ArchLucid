using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class ArchitectureRiskRegisterHumanReviewLabelTests
{
    [Theory]
    [InlineData(FindingHumanReviewStatus.Pending, "Human review pending")]
    [InlineData(FindingHumanReviewStatus.Approved, "Human review approved")]
    public void Format_maps_known_statuses(FindingHumanReviewStatus status, string expected)
    {
        ArchitectureRiskRegisterHumanReviewLabel.Format(status).Should().Be(expected);
    }

    [Fact]
    public void ParseOrDefault_returns_NotRequired_for_blank()
    {
        ArchitectureRiskRegisterHumanReviewLabel.ParseOrDefault(null)
            .Should()
            .Be(FindingHumanReviewStatus.NotRequired);
    }

    [Fact]
    public void ParseOrDefault_parses_case_insensitive_enum_name()
    {
        ArchitectureRiskRegisterHumanReviewLabel.ParseOrDefault("rejected")
            .Should()
            .Be(FindingHumanReviewStatus.Rejected);
    }
}
