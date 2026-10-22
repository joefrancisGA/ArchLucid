using ArchLucid.Application.ExecDigest;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.User;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ExecDigest;

/// <summary>CG-037 — digest subject/body and row rehearsal labels.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ExecDigestCareerHonestyPresenterTests
{
    [Fact]
    public void Career_real_run_has_no_row_label()
    {
        RunSummaryDto run = SampleRun(StructuralExecutionMode.Real, WorkingCareerRehearsalDoorValues.Career);

        ExecDigestCareerHonestyPresenter.ResolveRowLabel(run).Should().BeNull();
    }

    [Fact]
    public void Career_simulator_run_uses_career_blocked_row_label()
    {
        RunSummaryDto run = SampleRun(StructuralExecutionMode.Simulator, WorkingCareerRehearsalDoorValues.Career);

        ExecDigestCareerHonestyPresenter.ResolveRowLabel(run)
            .Should()
            .Be(ExecDigestCareerHonestyPresenter.CareerBlockedRowLabel);
    }

    [Fact]
    public void Rehearsal_simulator_run_uses_rehearsal_incomplete_row_label()
    {
        RunSummaryDto run = SampleRun(StructuralExecutionMode.Simulator, WorkingCareerRehearsalDoorValues.Rehearsal);

        ExecDigestCareerHonestyPresenter.ResolveRowLabel(run)
            .Should()
            .Be(ExecDigestCareerHonestyPresenter.RehearsalIncompleteRowLabel);
    }

    [Fact]
    public void Rehearsal_real_practice_run_uses_practice_row_label()
    {
        RunSummaryDto run = SampleRun(StructuralExecutionMode.Real, WorkingCareerRehearsalDoorValues.Rehearsal);

        ExecDigestCareerHonestyPresenter.ResolveRowLabel(run)
            .Should()
            .Be(ExecDigestCareerHonestyPresenter.PracticeRowLabel);
    }

    [Fact]
    public void All_rehearsal_commits_prefix_subject_and_add_body_disclaimer()
    {
        ExecDigestCareerHonestySummary summary = ExecDigestCareerHonestyPresenter.ResolveSummary(
        [
            SampleRun(StructuralExecutionMode.Simulator, WorkingCareerRehearsalDoorValues.Rehearsal),
            SampleRun(StructuralExecutionMode.Fallback, WorkingCareerRehearsalDoorValues.Career),
        ]);

        summary.RehearsalSubjectPrefix.Should().Be(ExecDigestCareerHonestyPresenter.RehearsalSubjectPrefix);
        summary.RehearsalBodyDisclaimer.Should().Be(ExecDigestCareerHonestyPresenter.BodyDisclaimer);
    }

    [Fact]
    public void Mixed_career_and_rehearsal_commits_keep_body_disclaimer_without_subject_prefix()
    {
        ExecDigestCareerHonestySummary summary = ExecDigestCareerHonestyPresenter.ResolveSummary(
        [
            SampleRun(StructuralExecutionMode.Real, WorkingCareerRehearsalDoorValues.Career),
            SampleRun(StructuralExecutionMode.Simulator, WorkingCareerRehearsalDoorValues.Rehearsal),
        ]);

        summary.RehearsalSubjectPrefix.Should().BeNull();
        summary.RehearsalBodyDisclaimer.Should().Be(ExecDigestCareerHonestyPresenter.BodyDisclaimer);
    }

    [Fact]
    public void Sample_runs_are_excluded_from_digest_honesty_summary()
    {
        ExecDigestCareerHonestySummary summary = ExecDigestCareerHonestyPresenter.ResolveSummary(
        [
            SampleRun(StructuralExecutionMode.Simulator, WorkingCareerRehearsalDoorValues.Career, isSample: true),
        ]);

        summary.Should().Be(ExecDigestCareerHonestySummary.None);
    }

    private static RunSummaryDto SampleRun(
        StructuralExecutionMode mode,
        string door,
        bool isSample = false) =>
        new()
        {
            RunId = Guid.NewGuid(),
            ProjectId = "default",
            StructuralExecutionMode = mode,
            WorkingCareerRehearsalDoor = door,
            IsSample = isSample,
        };
}
