using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-016 ratchet: one Working Career/Rehearsal chooser. Findings re-exports; no third chooser.
/// Does not re-implement AS-077. Host AgentExecution:Mode stays Simulator.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg016ChooserKeyboardCarbonArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg016_as077_source_ratchet_still_exists_and_is_not_rewritten_here()
    {
        string as077Path = Path.Combine(
            RepoRoot,
            "ArchLucid.Architecture.Tests",
            "ArchitectureSpineAs077WorkingChromeModeChooserArchitectureTests.cs");

        File.Exists(as077Path).Should().BeTrue();

        string as077 = File.ReadAllText(as077Path);

        as077.Should().Contain("WorkingCareerRehearsalChooser");
        as077.Should().Contain("OperatorSegmentedModeToolbar");
        as077.Should().NotContain("G-REAL-06");
    }

    [Fact]
    public void Cg016_findings_reexports_canonical_chooser_and_does_not_add_a_third_file()
    {
        string governance = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "governance",
                "WorkingCareerRehearsalChooser.tsx"));
        string findings = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "[reviewId]",
                "_sections",
                "RunDetailFindingsWorkspace.tsx"));
        string topBar = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "shell", "OperatorShellTopBar.tsx"));

        IEnumerable<string> chooserFiles = Directory.EnumerateFiles(
            Path.Combine(RepoRoot, "archlucid-ui", "src"),
            "WorkingCareerRehearsalChooser.tsx",
            SearchOption.AllDirectories);

        chooserFiles.Should().HaveCount(2);
        governance.Should().Contain("from \"@/components/workspace-mode/WorkingCareerRehearsalChooser\"");
        governance.Should().NotContain("export function WorkingCareerRehearsalChooser");
        findings.Should().Contain("source=\"findings\"");
        findings.Should().Contain("WorkingCareerRehearsalChooser");
        topBar.Should().Contain("WorkingCareerRehearsalChooser");
    }

    [Fact]
    public void Cg016_does_not_flip_host_agent_execution_mode_default()
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
        chooser.Should().NotContain("AgentExecution:Mode");
        chooser.Should().NotContain("G-REAL-06");
        chooser.Should().Contain("isWorkingWorkspaceMode");
        chooser.Should().Contain("enableArrowKeyboard");
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
