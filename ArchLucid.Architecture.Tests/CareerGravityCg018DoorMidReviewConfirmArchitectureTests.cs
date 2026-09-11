using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-018 ratchet: in-flight review door change requires confirm. Does not implement CG-019 stamp.
/// Does not cancel in-flight operations. Host execute default stays Simulator.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg018DoorMidReviewConfirmArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg018_chooser_confirms_in_flight_door_change_and_does_not_cancel()
    {
        string chooser = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "workspace-mode",
                "WorkingCareerRehearsalChooser.tsx"));
        string confirmHelper = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "working-career-rehearsal-door-mid-review-confirm.ts"));
        string copy = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "working-career-rehearsal-door-copy.ts"));

        chooser.Should().Contain("shouldConfirmWorkingCareerRehearsalDoorChange");
        chooser.Should().Contain("WorkingCareerRehearsalDoorChangeConfirmDialog");
        chooser.Should().NotContain("cancelOperation");
        chooser.Should().NotContain("G-REAL-06");
        confirmHelper.Should().Contain("hasInFlightReviewPipeline");
        confirmHelper.Should().Contain("does not stop the in-flight operation");
        confirmHelper.Should().Contain("artifacts");
        copy.Should().Contain("Change execution door during in-flight analysis?");
    }

    [Fact]
    public void Cg018_does_not_implement_run_stamp_schema_owned_by_cg019()
    {
        string runRecord = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Core",
                "Persistence",
                "ApplicationPorts",
                "Models",
                "RunRecord.cs"));
        string helper = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "working-career-rehearsal-door-mid-review-confirm.ts"));

        runRecord.Should().NotContain("WorkingCareerRehearsalDoor");
        helper.Should().Contain("Stamp immutability on the run is CG-019");
    }

    [Fact]
    public void Cg018_does_not_flip_host_execute_mode_default()
    {
        string appsettings = File.ReadAllText(Path.Combine(RepoRoot, "ArchLucid.Api", "appsettings.json"));
        string chooser = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "workspace-mode",
                "WorkingCareerRehearsalChooser.tsx"));

        appsettings.Should().Contain("\"Mode\": \"Simulator\"");
        chooser.Should().NotContain("G-REAL-06");
        chooser.Should().Contain("isWorkingWorkspaceMode");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
            {
                return dir.FullName;
            }

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
