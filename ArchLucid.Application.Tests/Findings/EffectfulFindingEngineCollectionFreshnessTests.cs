using ArchLucid.Application.Findings;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class EffectfulFindingEngineCollectionFreshnessTests
{
    [Fact]
    public void ShouldSuppressInventoryFindingsForAzure_returns_true_when_pin_has_no_collection_utc()
    {
        DateTime now = new(2026, 9, 22, 0, 0, 0, DateTimeKind.Utc);
        var analysisContext = new FindingAnalysisContext
        {
            EvidencePins =
            [
                new EvidencePackagePin
                {
                    Provider = RunEvidencePackagePinService.AzureProvider,
                    PackageId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    CollectionUtc = null,
                },
            ],
        };

        EffectfulFindingEngineCollectionFreshness
            .ShouldSuppressInventoryFindingsForAzure(analysisContext, now, staleAfterDays: 90)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void ShouldSuppressInventoryFindingsForCloud_returns_true_when_pin_is_missing()
    {
        DateTime now = new(2026, 9, 22, 0, 0, 0, DateTimeKind.Utc);

        EffectfulFindingEngineCollectionFreshness
            .ShouldSuppressInventoryFindingsForCloud(null, CloudProvider.Aws, now, staleAfterDays: 90)
            .Should()
            .BeTrue();
    }
}
