using ArchLucid.Core.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Governance.PolicyPacks;

[Trait("Suite", "Core")]
public sealed class FocusedPilotModePolicyPacksTests
{
    [Fact]
    public void ReferencesIncludeFocusedPilotToken_matches_case_insensitive()
    {
        FocusedPilotModePolicyPacks
            .ReferencesIncludeFocusedPilotToken(["PILOT-MODE:security-baseline-cost-only"])
            .Should()
            .BeTrue();
    }

    [Fact]
    public void IsAllowedPackDisplayName_allows_security_and_cost_only()
    {
        FocusedPilotModePolicyPacks.IsAllowedPackDisplayName(FocusedPilotModePolicyPacks.SecurityBaselineDisplayName)
            .Should()
            .BeTrue();
        FocusedPilotModePolicyPacks.IsAllowedPackDisplayName(FocusedPilotModePolicyPacks.FinOpsCostOptimizationDisplayName)
            .Should()
            .BeTrue();
        FocusedPilotModePolicyPacks.IsAllowedPackDisplayName("Azure Well-Architected Framework").Should().BeFalse();
    }
}
