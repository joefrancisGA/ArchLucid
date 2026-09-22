using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-017 ratchet: Security product line skips Career/Rehearsal chrome entirely.
/// Does not re-implement AS-077. Host execute default stays Simulator.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg017SecurityChooserHonestyArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg017_as077_source_ratchet_still_exists_and_is_not_rewritten_here()
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
    public void Cg017_security_top_bar_excludes_career_rehearsal_chrome()
    {
        string topBar = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "shell", "OperatorShellTopBar.tsx"));
        string inventory = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "docs",
                "architecture",
                "CAREER_GRAVITY_BADGE_PIPELINE_COPY_INVENTORY.md"));
        string help = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "working-career-rehearsal-help-guide-content.ts"));

        topBar.Should().Contain("isSecureNowTrainingChromeExcluded");
        topBar.Should().NotContain("SecurityWorkingCareerHonestyStrip");
        topBar.Should().NotContain("G-REAL-06");
        inventory.Should().NotContain("SecurityWorkingCareerHonestyStrip");
        help.Should().Contain("WORKING_CAREER_REHEARSAL_HELP_SECURITY_COPY");
        help.Should().Contain("SecureNow");
    }

    [Fact]
    public void Cg017_does_not_flip_host_execute_mode_default()
    {
        string appsettings = File.ReadAllText(Path.Combine(RepoRoot, "ArchLucid.Api", "appsettings.json"));
        string topBar = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "shell", "OperatorShellTopBar.tsx"));

        appsettings.Should().Contain("\"Mode\": \"Simulator\"");
        topBar.Should().NotContain("G-REAL-06");
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
