using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-017 ratchet: Security product line skips the Career/Rehearsal chooser and mounts
/// a static honesty strip. Does not re-implement AS-077. Host execute default stays Simulator.
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
    public void Cg017_security_top_bar_keeps_chooser_skip_and_mounts_honesty_strip()
    {
        string topBar = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "shell", "OperatorShellTopBar.tsx"));
        string strip = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "workspace-mode",
                "SecurityWorkingCareerHonestyStrip.tsx"));
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

        string copy = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "working-career-rehearsal-door-copy.ts"));

        topBar.Should().Contain("showWorkingCareerRehearsalChooser = productLine !== \"security\"");
        topBar.Should().Contain("SecurityWorkingCareerHonestyStrip");
        topBar.Should().NotContain("G-REAL-06");
        strip.Should().Contain("SECURITY_WORKING_CAREER_HONESTY_STRIP_TITLE");
        strip.Should().Contain("shouldShowSecurityWorkingCareerHonestyStrip");
        strip.Should().NotContain("G-REAL-06");
        strip.Should().NotContain("setDoor");
        copy.Should().Contain("Simulator is not Career");
        inventory.Should().Contain("SecurityWorkingCareerHonestyStrip");
        help.Should().Contain("WORKING_CAREER_REHEARSAL_HELP_SECURITY_COPY");
        help.Should().Contain("honesty strip");
    }

    [Fact]
    public void Cg017_does_not_flip_host_execute_mode_default()
    {
        string appsettings = File.ReadAllText(Path.Combine(RepoRoot, "ArchLucid.Api", "appsettings.json"));
        string strip = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "workspace-mode",
                "SecurityWorkingCareerHonestyStrip.tsx"));

        appsettings.Should().Contain("\"Mode\": \"Simulator\"");
        strip.Should().NotContain("G-REAL-06");
        strip.Should().Contain("isBuyerPolishedOperatorShellEnv");
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
