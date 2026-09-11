using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.User;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Core.Alerts;

/// <summary>CG-036 — rehearsal honesty on alert title/body when the sourcing run is not Career + Real.</summary>
public static class AlertCareerHonestyPresenter
{
    public const string RehearsalTitlePrefix = "Rehearsal — ";

    public const string RehearsalBodyDisclaimer =
        "This alert fired from a rehearsal run — not production customer evidence.";

    public static bool IsRehearsalStructuralExecutionMode(StructuralExecutionMode structuralExecutionMode) =>
        structuralExecutionMode is StructuralExecutionMode.Simulator or StructuralExecutionMode.Fallback;

    public static bool ShouldApplyRehearsalHonesty(
        bool isSampleRun,
        StructuralExecutionMode structuralExecutionMode,
        string? workingCareerRehearsalDoor)
    {
        if (isSampleRun)
        {
            return false;
        }

        string effectiveDoor = WorkingCareerRehearsalDoorValues.ParseOrDefault(workingCareerRehearsalDoor);

        if (effectiveDoor == WorkingCareerRehearsalDoorValues.Career
            && structuralExecutionMode == StructuralExecutionMode.Real)
        {
            return false;
        }

        return true;
    }

    public static bool ShouldApplyRehearsalHonesty(RunSummaryDto runSummary) =>
        ShouldApplyRehearsalHonesty(
            runSummary.IsSample,
            runSummary.StructuralExecutionMode,
            runSummary.WorkingCareerRehearsalDoor);

    public static void ApplyToAlert(AlertRecord alert, RunSummaryDto runSummary)
    {
        ArgumentNullException.ThrowIfNull(alert);
        ArgumentNullException.ThrowIfNull(runSummary);

        if (!ShouldApplyRehearsalHonesty(runSummary))
        {
            return;
        }

        if (!alert.Title.StartsWith(RehearsalTitlePrefix, StringComparison.Ordinal))
        {
            alert.Title = RehearsalTitlePrefix + alert.Title;
        }

        if (!alert.Description.Contains(RehearsalBodyDisclaimer, StringComparison.Ordinal))
        {
            alert.Description = RehearsalBodyDisclaimer + "\n\n" + alert.Description;
        }
    }
}
