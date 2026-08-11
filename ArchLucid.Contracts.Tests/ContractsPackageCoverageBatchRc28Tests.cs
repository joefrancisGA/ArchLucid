using ArchLucid.Contracts.Operator;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.Telemetry;
using ArchLucid.Contracts.User;
using ArchLucid.Contracts.ValueReports;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

/// <summary>
///     RC28 package-coverage batch: appearance/saved-view normalizers, sponsor ROI claim copy, first-tenant funnel
///     catalog validation, and a slim graph edge DTO round-trip.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ContractsPackageCoverageBatchRc28Tests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("sepia")]
    public void AppearancePreferenceValues_NormalizeOrNull_rejects_blank_and_unknown(string? value)
    {
        AppearancePreferenceValues.NormalizeOrNull(value).Should().BeNull();
    }

    [Theory]
    [InlineData("system", AppearancePreferenceValues.System)]
    [InlineData(" SYSTEM ", AppearancePreferenceValues.System)]
    [InlineData("light", AppearancePreferenceValues.Light)]
    [InlineData("Light", AppearancePreferenceValues.Light)]
    [InlineData("dark", AppearancePreferenceValues.Dark)]
    [InlineData("DARK", AppearancePreferenceValues.Dark)]
    public void AppearancePreferenceValues_NormalizeOrNull_maps_known_values(string value, string expected)
    {
        AppearancePreferenceValues.NormalizeOrNull(value).Should().Be(expected);
        AppearancePreferenceValues.Default.Should().Be(AppearancePreferenceValues.System);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("findings")]
    public void OperatorSavedViewSurfaces_rejects_unsupported(string? surface)
    {
        OperatorSavedViewSurfaces.IsSupported(surface).Should().BeFalse();
        OperatorSavedViewSurfaces.NormalizeOrNull(surface).Should().BeNull();
    }

    [Theory]
    [InlineData("audit", OperatorSavedViewSurfaces.Audit)]
    [InlineData("AUDIT", OperatorSavedViewSurfaces.Audit)]
    [InlineData("graph", OperatorSavedViewSurfaces.Graph)]
    [InlineData("Graph", OperatorSavedViewSurfaces.Graph)]
    public void OperatorSavedViewSurfaces_normalizes_supported_surfaces(string surface, string expected)
    {
        OperatorSavedViewSurfaces.IsSupported(surface).Should().BeTrue();
        OperatorSavedViewSurfaces.NormalizeOrNull(surface).Should().Be(expected);
    }

    [Theory]
    [InlineData(ReviewCycleBaselineProvenance.TenantSuppliedAtSignup, SponsorRoiClaimDisposition.Warn)]
    [InlineData(ReviewCycleBaselineProvenance.TenantSuppliedViaSettings, SponsorRoiClaimDisposition.Warn)]
    [InlineData(ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions, SponsorRoiClaimDisposition.Warn)]
    [InlineData(ReviewCycleBaselineProvenance.NoMeasurementYet, SponsorRoiClaimDisposition.Hold)]
    public void SponsorRoiClaimDispositionRules_FromReviewCycleProvenance_maps_all_values(
        ReviewCycleBaselineProvenance provenance,
        SponsorRoiClaimDisposition expected)
    {
        SponsorRoiClaimDispositionRules.FromReviewCycleProvenance(provenance).Should().Be(expected);
    }

    [Theory]
    [InlineData(SponsorRoiClaimDisposition.Pass, "PASS")]
    [InlineData(SponsorRoiClaimDisposition.Warn, "WARN")]
    [InlineData(SponsorRoiClaimDisposition.Hold, "HOLD")]
    public void SponsorRoiClaimDispositionRules_DescribeLeadLine_includes_disposition_label(
        SponsorRoiClaimDisposition disposition,
        string expectedToken)
    {
        string lead = SponsorRoiClaimDispositionRules.DescribeLeadLine(disposition);

        lead.Should().Contain(expectedToken);
        lead.Should().NotBeNullOrWhiteSpace();
    }

    [Theory]
    [InlineData(SponsorRoiClaimDisposition.Pass, "human redaction")]
    [InlineData(SponsorRoiClaimDisposition.Warn, "estimate-basis")]
    [InlineData(SponsorRoiClaimDisposition.Hold, "internal planning")]
    public void SponsorRoiClaimDispositionRules_DescribeAnnualizedSectionQualifier_is_disposition_specific(
        SponsorRoiClaimDisposition disposition,
        string expectedFragment)
    {
        string qualifier = SponsorRoiClaimDispositionRules.DescribeAnnualizedSectionQualifier(disposition);

        qualifier.Should().ContainEquivalentOf(expectedFragment);
    }

    [Fact]
    public void SponsorRoiClaimDispositionRules_unknown_disposition_throws()
    {
        const SponsorRoiClaimDisposition unknown = (SponsorRoiClaimDisposition)99;

        FluentActions
            .Invoking(() => SponsorRoiClaimDispositionRules.DescribeLeadLine(unknown))
            .Should()
            .Throw<ArgumentOutOfRangeException>()
            .WithParameterName("disposition");

        FluentActions
            .Invoking(() => SponsorRoiClaimDispositionRules.DescribeAnnualizedSectionQualifier(unknown))
            .Should()
            .Throw<ArgumentOutOfRangeException>()
            .WithParameterName("disposition");
    }

    [Fact]
    public void FirstTenantFunnelEventNames_All_contains_canonical_catalog()
    {
        FirstTenantFunnelEventNames.All.Should().Equal(
            FirstTenantFunnelEventNames.Signup,
            FirstTenantFunnelEventNames.TourOptIn,
            FirstTenantFunnelEventNames.FirstRunStarted,
            FirstTenantFunnelEventNames.FirstRunCommitted,
            FirstTenantFunnelEventNames.FirstFindingViewed,
            FirstTenantFunnelEventNames.FirstFinalizationAttempted,
            FirstTenantFunnelEventNames.FirstExportOpened,
            FirstTenantFunnelEventNames.ThirtyMinuteMilestone);
    }

    [Theory]
    [InlineData(FirstTenantFunnelEventNames.Signup)]
    [InlineData(FirstTenantFunnelEventNames.TourOptIn)]
    [InlineData(FirstTenantFunnelEventNames.FirstRunStarted)]
    [InlineData(FirstTenantFunnelEventNames.ThirtyMinuteMilestone)]
    public void FirstTenantFunnelEventNames_IsValid_accepts_catalog_names(string eventName)
    {
        FirstTenantFunnelEventNames.IsValid(eventName).Should().BeTrue();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("Signup")]
    [InlineData("unknown_event")]
    public void FirstTenantFunnelEventNames_IsValid_rejects_blank_case_mismatch_and_unknown(string? eventName)
    {
        FirstTenantFunnelEventNames.IsValid(eventName).Should().BeFalse();
    }

    [Fact]
    public void GraphSnapshotIndexedEdge_round_trips_properties()
    {
        GraphSnapshotIndexedEdge edge = new(
            EdgeId: "e1",
            FromNodeId: "n1",
            ToNodeId: "n2",
            EdgeType: "Contains",
            Weight: 0.75);

        edge.EdgeId.Should().Be("e1");
        edge.FromNodeId.Should().Be("n1");
        edge.ToNodeId.Should().Be("n2");
        edge.EdgeType.Should().Be("Contains");
        edge.Weight.Should().Be(0.75);
    }

}
