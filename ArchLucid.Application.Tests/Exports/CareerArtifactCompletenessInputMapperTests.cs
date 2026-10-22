using ArchLucid.Application.Exports;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.User;
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

    [Fact]
    public void MapForExport_blocks_working_career_simulator_without_rehearsal_door_stamp()
    {
        CareerExportCoverageHonestyInput input = new(
            CoverageContext: new SponsorReviewCoverageHonestyContext(
                RunId: "run-1",
                Verdict: new(),
                AnalysisStagesComplete: true,
                ActorNodeCount: 1),
            EnginesSucceeded: 35,
            WorkingDesk: true,
            ClassificationCounts: null,
            StructuralExecutionMode: StructuralExecutionMode.Simulator,
            WorkingCareerRehearsalDoor: WorkingCareerRehearsalDoorValues.Career);

        CareerArtifactCompletenessInput mapped = CareerArtifactCompletenessInputMapper.MapForExport(
            input,
            transparencyTrail: new TransparencyTrail(),
            blockExternalSponsorDistribution: true);

        mapped.SimulatorRehearsalBannerOnArtifact.Should().BeFalse();
        mapped.WorkingCareerRehearsalDoor.Should().Be(WorkingCareerRehearsalDoorValues.Career);

        CareerArtifactCompletenessResult result = new CareerArtifactCompletenessValidator().Evaluate(mapped);

        result.CanRender.Should().BeFalse();
        result.BlockReasons.Should().Contain(reason =>
            reason.Code == CareerArtifactCompletenessValidator.SimulatorRehearsalCode);
    }

    [Fact]
    public void MapForExport_allows_working_rehearsal_simulator_with_door_stamp()
    {
        CareerExportCoverageHonestyInput input = new(
            CoverageContext: new SponsorReviewCoverageHonestyContext(
                RunId: "run-1",
                Verdict: new(),
                AnalysisStagesComplete: true,
                ActorNodeCount: 1),
            EnginesSucceeded: 35,
            WorkingDesk: true,
            ClassificationCounts: null,
            StructuralExecutionMode: StructuralExecutionMode.Simulator,
            WorkingCareerRehearsalDoor: WorkingCareerRehearsalDoorValues.Rehearsal);

        CareerArtifactCompletenessInput mapped = CareerArtifactCompletenessInputMapper.MapForExport(
            input,
            transparencyTrail: new TransparencyTrail(),
            blockExternalSponsorDistribution: true);

        mapped.SimulatorRehearsalBannerOnArtifact.Should().BeTrue();
        mapped.WorkingCareerRehearsalDoor.Should().Be(WorkingCareerRehearsalDoorValues.Rehearsal);

        CareerArtifactCompletenessResult result = new CareerArtifactCompletenessValidator().Evaluate(mapped);

        result.BlockReasons.Should().NotContain(reason =>
            reason.Code == CareerArtifactCompletenessValidator.SimulatorRehearsalCode);
    }
}
