using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-077 ratchet: Working chrome exposes Career / Rehearsal door chooser in the operator top bar.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs077WorkingChromeModeChooserArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private const string DoorModuleRelativePath =
        "archlucid-ui/src/lib/governance/working-career-rehearsal-door.ts";

    private const string ChooserRelativePath =
        "archlucid-ui/src/components/workspace-mode/WorkingCareerRehearsalChooser.tsx";

    private const string TopBarRelativePath =
        "archlucid-ui/src/components/shell/OperatorShellTopBar.tsx";

    [Fact]
    public void As077_door_module_documents_architecture_first_persistence()
    {
        string doorModule = File.ReadAllText(Path.Combine(RepoRoot, DoorModuleRelativePath));

        doorModule.Should().Contain("Architecture-level");
        doorModule.Should().Contain("Tenant-level");
        doorModule.Should().Contain("DEFAULT_WORKING_CAREER_REHEARSAL_DOOR");
        doorModule.Should().Contain("\"rehearsal\"");
    }

    [Fact]
    public void As077_chooser_uses_segmented_buttons_and_working_only_gate()
    {
        string chooser = File.ReadAllText(Path.Combine(RepoRoot, ChooserRelativePath));

        chooser.Should().Contain("OperatorSegmentedModeToolbar");
        chooser.Should().Contain("isWorkingWorkspaceMode");
        chooser.Should().Contain("Career");
        chooser.Should().Contain("Rehearsal");
        chooser.Should().Contain("working-career-rehearsal-chooser");
    }

    [Fact]
    public void As077_top_bar_mounts_working_door_chooser()
    {
        string topBar = File.ReadAllText(Path.Combine(RepoRoot, TopBarRelativePath));

        topBar.Should().Contain("WorkingCareerRehearsalChooser");
        topBar.Should().NotContain("isOperatorExperienceFullShellEnv() && <WorkingCareerRehearsalChooser");
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
