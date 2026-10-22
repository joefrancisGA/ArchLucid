using ArchLucid.Contracts.ValueReports;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ValueReports;
[Trait("Category", "Unit")]

public sealed class BaselineReviewCycleSourceMarkersTests
{
    [Fact]
    public void IndicatesTenantCapturedViaOperatorSettings_matches_exact_token_case_insensitive()
    {
        BaselineReviewCycleSourceMarkers.IndicatesTenantCapturedViaOperatorSettings("BASELINE_SETTINGS").Should().BeTrue();
        BaselineReviewCycleSourceMarkers.IndicatesTenantCapturedViaOperatorSettings("baseline_settings").Should().BeTrue();
    }

    [Fact]
    public void IndicatesTenantCapturedViaOperatorSettings_matches_prefixed_notes()
    {
        BaselineReviewCycleSourceMarkers.IndicatesTenantCapturedViaOperatorSettings("baseline_settings: ops workshop").Should().BeTrue();
    }

    [Fact]
    public void IndicatesTenantCapturedViaOperatorSettings_rejects_signup_prose()
    {
        BaselineReviewCycleSourceMarkers.IndicatesTenantCapturedViaOperatorSettings("team estimate").Should().BeFalse();
    }

    [Fact]
    public void FormatReviewCycleSourceNoteForDisplay_strips_operator_marker_prefix()
    {
        BaselineReviewCycleSourceMarkers.FormatReviewCycleSourceNoteForDisplay("baseline_settings: workshop").Should().Be("workshop");
        BaselineReviewCycleSourceMarkers.FormatReviewCycleSourceNoteForDisplay("baseline_settings").Should().BeNull();
    }

    [Fact]
    public void FormatOperatorSettingsPersistence_formats_marker_and_optional_tail()
    {
        BaselineReviewCycleSourceMarkers.FormatOperatorSettingsPersistence(null).Should().Be(BaselineReviewCycleSourceMarkers.OperatorSettingsToken);
        BaselineReviewCycleSourceMarkers.FormatOperatorSettingsPersistence("  workshop ").Should().Be("baseline_settings:workshop");
    }
}
