using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Governance;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Governance;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureRiskRegisterHumanReviewLabelCoercionTests
{
    [Fact]
    public void ParseOrDefault_string_encoded_whole_number_maps_pending()
    {
        ArchitectureRiskRegisterHumanReviewLabel.ParseOrDefault("1.0")
            .Should()
            .Be(FindingHumanReviewStatus.Pending);
    }

    [Fact]
    public void ParseOrDefault_string_encoded_boolean_maps_not_required()
    {
        ArchitectureRiskRegisterHumanReviewLabel.ParseOrDefault("True")
            .Should()
            .Be(FindingHumanReviewStatus.NotRequired);
    }

    [Fact]
    public void ParseOrDefault_on_synonym_maps_not_required()
    {
        ArchitectureRiskRegisterHumanReviewLabel.ParseOrDefault("on")
            .Should()
            .Be(FindingHumanReviewStatus.NotRequired);
    }
}
