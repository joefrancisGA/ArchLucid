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
    public void IsAllowedPackDisplayName_matches_case_insensitive_baseline_display_names()
    {
        FocusedPilotModePolicyPacks
            .IsAllowedPackDisplayName("security architecture baseline")
            .Should()
            .BeTrue();

        FocusedPilotModePolicyPacks
            .IsAllowedPackDisplayName("operational excellence")
            .Should()
            .BeTrue();
    }

    [Fact]
    public void IsAllowedPackDisplayName_allows_six_architecture_quality_baseline_packs()
    {
        FocusedPilotModePolicyPacks.IsAllowedPackDisplayName(FocusedPilotModePolicyPacks.SecurityBaselineDisplayName)
            .Should()
            .BeTrue();
        FocusedPilotModePolicyPacks.IsAllowedPackDisplayName(FocusedPilotModePolicyPacks.ReliabilityAndResilienceDisplayName)
            .Should()
            .BeTrue();
        FocusedPilotModePolicyPacks.IsAllowedPackDisplayName(FocusedPilotModePolicyPacks.FinOpsCostOptimizationDisplayName)
            .Should()
            .BeTrue();
        FocusedPilotModePolicyPacks.IsAllowedPackDisplayName(FocusedPilotModePolicyPacks.PerformanceAndScalabilityDisplayName)
            .Should()
            .BeTrue();
        FocusedPilotModePolicyPacks.IsAllowedPackDisplayName(FocusedPilotModePolicyPacks.OperationalExcellenceDisplayName)
            .Should()
            .BeTrue();
        FocusedPilotModePolicyPacks
            .IsAllowedPackDisplayName(FocusedPilotModePolicyPacks.SustainabilityAndResourceEfficiencyDisplayName)
            .Should()
            .BeTrue();
        FocusedPilotModePolicyPacks.IsAllowedPackDisplayName("Azure Well-Architected Framework").Should().BeFalse();
        FocusedPilotModePolicyPacks.AllowedPackDisplayNames.Should().HaveCount(6);
    }

    [Fact]
    public void IsPackAllowedInFocusedReview_allows_pinned_and_overlay_packs()
    {
        FocusedPilotModePolicyPacks
            .IsPackAllowedInFocusedReview("Azure Well-Architected Framework", isOrganizationRequired: false, isPlatformOverlayForRunCloud: true)
            .Should()
            .BeTrue();

        FocusedPilotModePolicyPacks
            .IsPackAllowedInFocusedReview("Custom Org Pack", isOrganizationRequired: true, isPlatformOverlayForRunCloud: false)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void IsPackAllowedInFocusedReview_allows_lowercase_baseline_pack_display_name()
    {
        FocusedPilotModePolicyPacks
            .IsPackAllowedInFocusedReview(
                "security architecture baseline",
                isOrganizationRequired: false,
                isPlatformOverlayForRunCloud: false)
            .Should()
            .BeTrue();
    }
}
