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
}
