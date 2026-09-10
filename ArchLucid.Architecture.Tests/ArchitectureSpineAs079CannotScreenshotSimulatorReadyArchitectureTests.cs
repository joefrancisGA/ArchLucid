using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-079 ratchet: Working Rehearsal door cannot show Ready-to-finalize chrome.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs079CannotScreenshotSimulatorReadyArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private const string DoorModuleRelativePath =
        "archlucid-ui/src/lib/governance/working-career-rehearsal-door.ts";

    private const string FinalizeBlockedHonestyRelativePath =
        "archlucid-ui/src/lib/runs/run-pipeline-finalize-blocked-honesty.ts";

    private const string ProgressTrackerRelativePath =
        "archlucid-ui/src/components/runs/use-run-progress-tracker.ts";

    [Fact]
    public void As079_door_module_suppresses_ready_on_rehearsal_working_door()
    {
        string doorModule = File.ReadAllText(Path.Combine(RepoRoot, DoorModuleRelativePath));

        doorModule.Should().Contain("shouldSuppressReadyToFinalizeForWorkingRehearsalDoor");
        doorModule.Should().Contain("AS-079");
    }

    [Fact]
    public void As079_finalize_blocked_honesty_wires_rehearsal_door_helper()
    {
        string honesty = File.ReadAllText(Path.Combine(RepoRoot, FinalizeBlockedHonestyRelativePath));

        honesty.Should().Contain("shouldSuppressReadyToFinalizeForWorkingRehearsalDoor");
        honesty.Should().Contain("effectiveWorkingCareerRehearsalDoor");
    }

    [Fact]
    public void As079_progress_tracker_uses_career_honesty_helper_not_pre_commit_only()
    {
        string tracker = File.ReadAllText(Path.Combine(RepoRoot, ProgressTrackerRelativePath));

        tracker.Should().Contain("shouldSuppressReadyToFinalizeForCareerHonesty");
        tracker.Should().Contain("useEffectiveWorkingCareerRehearsalDoor");
        tracker.Should().NotContain("shouldSuppressReadyToFinalizeForPreCommitGateHonesty");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
