using ArchLucid.Application.Exports;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Exports;
using ArchLucid.Contracts.User;
using ArchLucid.Decisioning.CareerArtifacts;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
public sealed class DecisionReceiptCareerPostureStamperTests
{
    [Fact]
    public void ApplyCommittedRunPosture_stamps_mode_door_and_rehearsal_incomplete()
    {
        DecisionReceiptDocument receipt = new()
        {
            Source = DecisionReceiptSource.CommittedRun,
            RunId = Guid.NewGuid(),
        };

        CareerExportCoverageHonestyInput honesty = new(
            CoverageContext: new SponsorReviewCoverageHonestyContext(
                RunId: "run-1",
                Verdict: new(),
                AnalysisStagesComplete: true,
                ActorNodeCount: 1),
            EnginesSucceeded: 40,
            WorkingDesk: true,
            ClassificationCounts: null,
            StructuralExecutionMode: StructuralExecutionMode.Simulator,
            WorkingCareerRehearsalDoor: WorkingCareerRehearsalDoorValues.Rehearsal);

        DecisionReceiptCareerPostureStamper.ApplyCommittedRunPosture(receipt, honesty);

        receipt.StructuralExecutionMode.Should().Be(StructuralExecutionMode.Simulator);
        receipt.WorkingCareerRehearsalDoor.Should().Be(WorkingCareerRehearsalDoorValues.Rehearsal);
        receipt.RehearsalIncomplete.Should().BeTrue();
    }

    [Fact]
    public void ApplyCommittedRunPosture_real_mode_is_not_rehearsal_incomplete()
    {
        DecisionReceiptDocument receipt = new()
        {
            Source = DecisionReceiptSource.CommittedRun,
            RunId = Guid.NewGuid(),
        };

        CareerExportCoverageHonestyInput honesty = new(
            CoverageContext: new SponsorReviewCoverageHonestyContext(
                RunId: "run-1",
                Verdict: new(),
                AnalysisStagesComplete: true,
                ActorNodeCount: 1),
            EnginesSucceeded: 40,
            WorkingDesk: true,
            ClassificationCounts: null,
            StructuralExecutionMode: StructuralExecutionMode.Real,
            WorkingCareerRehearsalDoor: WorkingCareerRehearsalDoorValues.Career);

        DecisionReceiptCareerPostureStamper.ApplyCommittedRunPosture(receipt, honesty);

        receipt.StructuralExecutionMode.Should().Be(StructuralExecutionMode.Real);
        receipt.WorkingCareerRehearsalDoor.Should().Be(WorkingCareerRehearsalDoorValues.Career);
        receipt.RehearsalIncomplete.Should().BeFalse();
    }

    [Theory]
    [InlineData(StructuralExecutionMode.Simulator, WorkingCareerRehearsalDoorValues.Rehearsal, true)]
    [InlineData(StructuralExecutionMode.Fallback, WorkingCareerRehearsalDoorValues.Rehearsal, true)]
    [InlineData(StructuralExecutionMode.Simulator, WorkingCareerRehearsalDoorValues.Career, false)]
    [InlineData(StructuralExecutionMode.Real, WorkingCareerRehearsalDoorValues.Rehearsal, false)]
    public void ResolveRehearsalIncomplete_matches_door_and_mode(
        StructuralExecutionMode mode,
        string door,
        bool expected)
    {
        DecisionReceiptCareerPostureStamper.ResolveRehearsalIncomplete(mode, door).Should().Be(expected);
    }
}
