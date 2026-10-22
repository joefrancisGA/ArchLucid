using ArchLucid.Contracts.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance.PolicyPacks;

[Trait("Category", "Unit")]
public sealed class PolicyPackCatalogPromotionValidationTests
{
    [Fact]
    public void ValidateSnapshotOrThrow_accepts_name_and_description_at_catalog_limits()
    {
        string displayName = new('n', PolicyPackCatalogEntryLimits.DisplayNameMaxLength);
        string description = new('d', PolicyPackCatalogEntryLimits.DescriptionMaxLength);

        Action act = () => PolicyPackCatalogPromotionValidation.ValidateSnapshotOrThrow(displayName, description);

        act.Should().NotThrow();
    }

    [Fact]
    public void ValidateSnapshotOrThrow_rejects_display_name_longer_than_catalog_column()
    {
        string displayName = new('n', PolicyPackCatalogEntryLimits.DisplayNameMaxLength + 1);

        Action act = () => PolicyPackCatalogPromotionValidation.ValidateSnapshotOrThrow(displayName, "ok");

        act.Should()
            .Throw<ArgumentException>()
            .WithParameterName("displayName")
            .WithMessage($"*at most {PolicyPackCatalogEntryLimits.DisplayNameMaxLength} characters*");
    }

    [Fact]
    public void ValidateSnapshotOrThrow_rejects_description_longer_than_catalog_column()
    {
        string description = new('d', PolicyPackCatalogEntryLimits.DescriptionMaxLength + 1);

        Action act = () => PolicyPackCatalogPromotionValidation.ValidateSnapshotOrThrow("ok", description);

        act.Should()
            .Throw<ArgumentException>()
            .WithParameterName("description")
            .WithMessage($"*at most {PolicyPackCatalogEntryLimits.DescriptionMaxLength} characters*");
    }
}
