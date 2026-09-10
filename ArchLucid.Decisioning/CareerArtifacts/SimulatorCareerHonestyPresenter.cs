using ArchLucid.Contracts.Common;

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
        bool simulatorRehearsalBannerOnArtifact)
    {
        if (!workingDesk || isSampleRun)
        {
            return false;
        }

        if (!IsRehearsalStructuralExecutionMode(structuralExecutionMode))
        {
            return false;
        }

        return !simulatorRehearsalBannerOnArtifact;
    }

    public static string? FormatCareerBlockedReason(
        bool workingDesk,
        bool isSampleRun,
        StructuralExecutionMode structuralExecutionMode,
        bool simulatorRehearsalBannerOnArtifact)
    {
        if (!ShouldBlockWorkingCareer(workingDesk, isSampleRun, structuralExecutionMode, simulatorRehearsalBannerOnArtifact))
        {
            return null;
        }

        return SimulatorRehearsalBlockedMessage;
    }
}
