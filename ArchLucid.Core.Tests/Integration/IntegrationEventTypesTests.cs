using ArchLucid.Core.Integration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Integration;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class IntegrationEventTypesTests
{
    [Fact]
    public void MapToCanonical_maps_legacy_archiforge_strings()
    {
        IntegrationEventTypes.MapToCanonical(IntegrationEventTypes.AuthorityRunCompletedLegacyV1)
            .Should().Be(IntegrationEventTypes.AuthorityRunCompletedV1);

        IntegrationEventTypes.MapToCanonical(IntegrationEventTypes.AlertFiredLegacyV1)
            .Should().Be(IntegrationEventTypes.AlertFiredV1);
    }

    [Fact]
    public void AreEquivalent_treats_legacy_and_canonical_as_same()
    {
        IntegrationEventTypes.AreEquivalent(
                IntegrationEventTypes.GovernancePromotionActivatedV1,
                IntegrationEventTypes.GovernancePromotionActivatedLegacyV1)
            .Should().BeTrue();

        IntegrationEventTypes.AreEquivalent(
                IntegrationEventTypes.AdvisoryScanCompletedLegacyV1,
                IntegrationEventTypes.AdvisoryScanCompletedV1)
            .Should().BeTrue();
    }

    [Fact]
    public void AreEquivalent_false_for_unrelated_types()
    {
        IntegrationEventTypes.AreEquivalent(
                IntegrationEventTypes.AlertFiredV1,
                IntegrationEventTypes.AlertResolvedV1)
            .Should().BeFalse();
    }
}
