using ArchLucid.Core.Integration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Integration;
[Trait("Category", "Unit")]

public sealed class IntegrationEventTypesTests
{
    private const string LegacyVendorPrefix = "com." + "arch" + "iforge" + ".";

    public static TheoryData<string> AllCanonicalIntegrationEventTypes
    {
        get;
    } =
    [
        IntegrationEventTypes.AuthorityRunCompletedV1,
        IntegrationEventTypes.AuthorityRunFailedV1,
        IntegrationEventTypes.AuthorityRunQualityGateRejectedV1,
        IntegrationEventTypes.FindingsHighSeverityCapturedV1,
        IntegrationEventTypes.DataConsistencyCheckCompletedV1,
        IntegrationEventTypes.ManifestFinalizedV1,
        IntegrationEventTypes.GovernanceApprovalSubmittedV1,
        IntegrationEventTypes.GovernanceApprovalApprovedV1,
        IntegrationEventTypes.GovernancePromotionActivatedV1,
        IntegrationEventTypes.GovernancePolicyPackPublishedV1,
        IntegrationEventTypes.GovernanceApprovalRejectedV1,
        IntegrationEventTypes.AlertFiredV1,
        IntegrationEventTypes.AlertAcknowledgedV1,
        IntegrationEventTypes.AlertResolvedV1,
        IntegrationEventTypes.AdvisoryScanCompletedV1,
        IntegrationEventTypes.ComplianceDriftEscalatedV1,
        IntegrationEventTypes.SeatReservationReleasedV1,
        IntegrationEventTypes.TrialLifecycleEmailV1,
        IntegrationEventTypes.BillingMarketplaceWebhookReceivedV1
    ];

    [Theory]
    [MemberData(nameof(AllCanonicalIntegrationEventTypes))]
    public void MapToCanonical_maps_legacy_vendor_alias(string canonical)
    {
        string legacy = ToLegacyVendorTypeForTest(canonical);

        IntegrationEventTypes.MapToCanonical(legacy).Should().Be(canonical);
    }

    [Theory]
    [MemberData(nameof(AllCanonicalIntegrationEventTypes))]
    public void MapToCanonical_trims_whitespace_around_legacy_alias(string canonical)
    {
        string legacy = ToLegacyVendorTypeForTest(canonical);

        IntegrationEventTypes.MapToCanonical($"  {legacy}  ").Should().Be(canonical);
    }

    [Fact]
    public void MapToCanonical_trims_whitespace_on_canonical_input()
    {
        IntegrationEventTypes.MapToCanonical($"  {IntegrationEventTypes.AuthorityRunCompletedV1}  ")
            .Should()
            .Be(IntegrationEventTypes.AuthorityRunCompletedV1);
    }

    [Fact]
    public void MapToCanonical_returns_trimmed_unknown_type()
    {
        IntegrationEventTypes.MapToCanonical("  com.archlucid.unknown.never.published  ")
            .Should()
            .Be("com.archlucid.unknown.never.published");
    }

    [Fact]
    public void AreEquivalent_matches_legacy_to_canonical()
    {
        string legacy = ToLegacyVendorTypeForTest(IntegrationEventTypes.AlertFiredV1);

        IntegrationEventTypes.AreEquivalent($" {legacy}", $"{IntegrationEventTypes.AlertFiredV1} ").Should().BeTrue();
    }

    [Fact]
    public void AreEquivalent_matches_trimmed_identical_types()
    {
        IntegrationEventTypes.AreEquivalent(
                $" {IntegrationEventTypes.AlertFiredV1}",
                $"{IntegrationEventTypes.AlertFiredV1} ")
            .Should()
            .BeTrue();
    }

    [Fact]
    public void AreEquivalent_matches_uppercase_canonical_to_canonical()
    {
        IntegrationEventTypes.AreEquivalent(
                IntegrationEventTypes.AlertFiredV1.ToUpperInvariant(),
                IntegrationEventTypes.AlertFiredV1)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void MapToCanonical_normalizes_uppercase_canonical_input()
    {
        IntegrationEventTypes.MapToCanonical(IntegrationEventTypes.AlertFiredV1.ToUpperInvariant())
            .Should()
            .Be(IntegrationEventTypes.AlertFiredV1);
    }

    [Fact]
    public void AreEquivalent_false_for_unrelated_types()
    {
        IntegrationEventTypes.AreEquivalent(
                IntegrationEventTypes.AlertFiredV1,
                IntegrationEventTypes.AlertResolvedV1)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void AreEquivalent_false_when_either_side_empty()
    {
        IntegrationEventTypes.AreEquivalent("", IntegrationEventTypes.AlertFiredV1).Should().BeFalse();
        IntegrationEventTypes.AreEquivalent(IntegrationEventTypes.AlertFiredV1, "   ").Should().BeFalse();
    }

    private static string ToLegacyVendorTypeForTest(string canonical)
    {
        const string lucid = "com.archlucid.";
        canonical.StartsWith(lucid, StringComparison.Ordinal).Should().BeTrue();

        return LegacyVendorPrefix + canonical["com.archlucid.".Length..];
    }
}
