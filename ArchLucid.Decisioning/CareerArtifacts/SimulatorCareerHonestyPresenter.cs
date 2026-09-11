using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.User;

namespace ArchLucid.Decisioning.CareerArtifacts;

/// <summary>LP-06 — Simulator rehearsal cannot be career-complete without waiver copy on the artifact.</summary>
public static class SimulatorCareerHonestyPresenter
{
    public const string SimulatorRehearsalCode = "simulator_rehearsal_not_career_complete";

    public const string SimulatorRehearsalBlockedMessage =
        "Simulator rehearsal cannot be career-complete without explicit rehearsal labeling on the artifact.";

    public const string GuidedRehearsalWarning =
        "Simulator rehearsal — not production customer evidence.";

    public static bool IsRehearsalStructuralExecutionMode(StructuralExecutionMode structuralExecutionMode) =>
        structuralExecutionMode is StructuralExecutionMode.Simulator or StructuralExecutionMode.Fallback;

    public static bool ShouldBlockWorkingCareer(
        bool workingDesk,
        bool isSampleRun,
        StructuralExecutionMode structuralExecutionMode,
        bool simulatorRehearsalBannerOnArtifact,
        string? workingCareerRehearsalDoor = null)
    {
        if (!workingDesk || isSampleRun)
        {
            return false;
        }

        if (!IsRehearsalStructuralExecutionMode(structuralExecutionMode))
        {
            return false;
        }

        if (simulatorRehearsalBannerOnArtifact)
        {
            return false;
        }

        // CG-021 / LP-06: Rehearsal door may finalize as rehearsal-incomplete on Simulator/Fallback.
        if (WorkingCareerRehearsalDoorValues.ParseOrDefault(workingCareerRehearsalDoor)
            == WorkingCareerRehearsalDoorValues.Rehearsal)
        {
            return false;
        }

        return true;
    }

    public static string? FormatCareerBlockedReason(
        bool workingDesk,
        bool isSampleRun,
        StructuralExecutionMode structuralExecutionMode,
        bool simulatorRehearsalBannerOnArtifact,
        string? workingCareerRehearsalDoor = null)
    {
        if (!ShouldBlockWorkingCareer(
                workingDesk,
                isSampleRun,
                structuralExecutionMode,
                simulatorRehearsalBannerOnArtifact,
                workingCareerRehearsalDoor))
        {
            return null;
        }

        return SimulatorRehearsalBlockedMessage;
    }
}
