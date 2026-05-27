using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ExecutiveRoiSavingsPricingBasisDescriptionBuilderTests
{
    [Fact]
    public void Build_includes_stale_warning_for_stale_uploaded_evidence()
    {
        RoiCostEvidenceFreshnessSnapshot freshness = new()
        {
            Status = RoiCostEvidenceFreshness.Stale,
            LatestCollectionTimestampUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            StaleAfterDays = 90,
        };

        string description = ExecutiveRoiSavingsPricingBasisDescriptionBuilder.Build(
            ExecutiveRoiSavingsPricingBasis.UploadedActualAmortized,
            0.85m,
            freshness);

        description.Should().Contain("uploaded Azure extractor");
        description.Should().Contain("stale");
    }

    [Fact]
    public void Build_notes_missing_extractor_for_retail_basis()
    {
        RoiCostEvidenceFreshnessSnapshot freshness = new()
        {
            Status = RoiCostEvidenceFreshness.Missing,
            LatestCollectionTimestampUtc = null,
            StaleAfterDays = 90,
        };

        string description = ExecutiveRoiSavingsPricingBasisDescriptionBuilder.Build(
            ExecutiveRoiSavingsPricingBasis.Retail,
            1.0m,
            freshness);

        description.Should().Contain("Retail list prices");
        description.Should().Contain("No uploaded extractor cost evidence");
    }
}
