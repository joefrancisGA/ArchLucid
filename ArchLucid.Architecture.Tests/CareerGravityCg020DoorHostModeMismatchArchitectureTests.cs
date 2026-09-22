using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-020 ratchet: door × host Mode matrix names four cells; Career + Simulator is blocked honesty.
/// Does not flip host AgentExecution default (no G-REAL-06).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg020DoorHostModeMismatchArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg020_matrix_module_names_four_cells_and_blocked_career_on_simulator()
    {
        string matrix = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "working-career-door-host-mode-matrix.ts"));
        string chooser = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "workspace-mode",
                "WorkingCareerRehearsalChooser.tsx"));

        matrix.Should().Contain("career-real");
        matrix.Should().Contain("career-simulator-blocked");
        matrix.Should().Contain("rehearsal-simulator");
        matrix.Should().Contain("rehearsal-real-practice");
        matrix.Should().Contain("resolveWorkingCareerDoorHostModeMatrixCell");
        matrix.Should().Contain("resolveEffectiveWorkingCareerRehearsalDoor");
        chooser.Should().Contain("resolveWorkingCareerDoorHostModeMatrixCell");
        chooser.Should().Contain("data-door-host-mode-cell");
        chooser.Should().NotContain("G-REAL-06");
    }

    [Fact]
    public void Cg020_does_not_flip_host_execute_mode_default()
    {
        string appsettings = File.ReadAllText(Path.Combine(RepoRoot, "ArchLucid.Api", "appsettings.json"));

        appsettings.Should().Contain("\"Mode\": \"Simulator\"");
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
