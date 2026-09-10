using ArchLucid.Application.Exports;
using ArchLucid.Application.Pilots;
using ArchLucid.Decisioning.CareerArtifacts;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class CareerArtifactExportCompletenessGateTests
{
    [Fact]
    public void ResolveBlock_returns_code_and_message_for_missing_trail()
    {
        CareerExportCoverageHonestyInput input = new(
            new SponsorReviewCoverageHonestyContext(
                RunId: "run-1",
                Verdict: null,
                AnalysisStagesComplete: true,
                ActorNodeCount: 1),
            EnginesSucceeded: 35,
            WorkingDesk: true,
            ClassificationCounts: null,
            PreCommitGateEnabled: true);
        CareerArtifactCompletenessInput validatorInput = new(
            ArtifactKind: CareerArtifactKind.Export,
            TransparencyTrail: null,
            EnginesSucceeded: 35,
            WorkingDesk: true,
            PreCommitGateEnabled: true);

        CareerArtifactExportBlock? block = CareerArtifactExportCompletenessGate.ResolveBlock(input, validatorInput);

        block.Should().NotBeNull();
        block!.Code.Should().Be(CareerArtifactCompletenessValidator.TrailMissingCode);
        block.Message.Should().Contain("transparency trail");
    }
}
