using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.User;
using ArchLucid.Core.Alerts;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.ExecDigest;

/// <summary>CG-037 — digest subject/body and per-row labels when committed runs are not Career + Real.</summary>
public static class ExecDigestCareerHonestyPresenter
{
    public const string RehearsalSubjectPrefix = "[Rehearsal] ";

    public const string BodyDisclaimer =
        "This digest includes rehearsal or Simulator runs — not production customer evidence. Treat highlighted rows by their rehearsal labels.";

    public const string CareerBlockedRowLabel = "Career blocked";

    public const string RehearsalIncompleteRowLabel = "Rehearsal incomplete";

    public const string PracticeRowLabel = "Practice";

    public static string? ResolveRowLabel(RunSummaryDto runSummary)
    {
        ArgumentNullException.ThrowIfNull(runSummary);

        if (!AlertCareerHonestyPresenter.ShouldApplyRehearsalHonesty(runSummary))
        {
            return null;
        }

        string effectiveDoor = WorkingCareerRehearsalDoorValues.ParseOrDefault(runSummary.WorkingCareerRehearsalDoor);

        if (effectiveDoor == WorkingCareerRehearsalDoorValues.Career)
        {
            return CareerBlockedRowLabel;
        }

        if (AlertCareerHonestyPresenter.IsRehearsalStructuralExecutionMode(runSummary.StructuralExecutionMode))
        {
            return RehearsalIncompleteRowLabel;
        }

        return PracticeRowLabel;
    }

    public static ExecDigestCareerHonestySummary ResolveSummary(IReadOnlyList<RunSummaryDto> committedRunsInWeek)
    {
        ArgumentNullException.ThrowIfNull(committedRunsInWeek);

        if (committedRunsInWeek.Count == 0)
        {
            return ExecDigestCareerHonestySummary.None;
        }

        List<RunSummaryDto> eligibleRuns = committedRunsInWeek
            .Where(static run => !run.IsSample)
            .ToList();

        if (eligibleRuns.Count == 0)
        {
            return ExecDigestCareerHonestySummary.None;
        }

        bool anyRehearsalHonesty = eligibleRuns
            .Any(AlertCareerHonestyPresenter.ShouldApplyRehearsalHonesty);

        if (!anyRehearsalHonesty)
        {
            return ExecDigestCareerHonestySummary.None;
        }

        bool allRehearsalHonesty = eligibleRuns
            .All(AlertCareerHonestyPresenter.ShouldApplyRehearsalHonesty);

        return new ExecDigestCareerHonestySummary(
            RehearsalSubjectPrefix: allRehearsalHonesty ? RehearsalSubjectPrefix : null,
            RehearsalBodyDisclaimer: BodyDisclaimer);
    }
}

/// <summary>Digest-level honesty derived from committed runs in the ISO week window.</summary>
public sealed record ExecDigestCareerHonestySummary(
    string? RehearsalSubjectPrefix,
    string? RehearsalBodyDisclaimer)
{
    public static ExecDigestCareerHonestySummary None { get; } = new(null, null);
}
