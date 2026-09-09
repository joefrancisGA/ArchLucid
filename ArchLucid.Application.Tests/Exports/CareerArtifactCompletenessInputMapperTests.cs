using ArchLucid.Application.Exports;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.CareerArtifacts;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
public sealed class CareerArtifactCompletenessInputMapperTests
{
    [Fact]
    public void MapForExport_sets_legacy_sealed_flag_when_trail_is_null()
    {
        CareerExportCoverageHonestyInput input = new(
            CoverageContext: new SponsorReviewCoverageHonestyContext(
                RunId: "run-1",
                Verdict: null,
                AnalysisStagesComplete: true,
                ActorNodeCount: 0),
            EnginesSucceeded: 35,
            WorkingDesk: true,
            ClassificationCounts: null);

        CareerArtifactCompletenessInput mapped = CareerArtifactCompletenessInputMapper.MapForExport(
            input,
            transparencyTrail: null);

        mapped.LegacySealedReExport.Should().BeTrue();
    }
}
