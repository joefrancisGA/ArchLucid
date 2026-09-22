using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-015 ratchet: Simulator-pinned Working clones show Rehearsal chrome with a banner.
/// Does not re-implement AS-078 / AS-085. Host AgentExecution:Mode stays Simulator.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg015SimulatorCloneRehearsalBannerArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg015_as078_and_as085_source_ratchets_still_exist_and_are_not_rewritten_here()
    {
        string as078Path = Path.Combine(
            RepoRoot,
            "ArchLucid.Architecture.Tests",
            "ArchitectureSpineAs078CareerDoorRequiresRealOrBlockedArchitectureTests.cs");
        string as085Path = Path.Combine(
            RepoRoot,
            "ArchLucid.Architecture.Tests",
            "ArchitectureSpineAs085NoHostModeFlipRatchetArchitectureTests.cs");

        File.Exists(as078Path).Should().BeTrue();
        File.Exists(as085Path).Should().BeTrue();

        string as078 = File.ReadAllText(as078Path);
        string as085 = File.ReadAllText(as085Path);

        as078.Should().Contain("host-simulator-pinned");
        as078.Should().Contain("resolveEffectiveWorkingCareerRehearsalDoor");
        as085.Should().Contain("AS-085");
        as085.Should().Contain("AgentExecution:Mode");
        as078.Should().NotContain("G-REAL-06");
        as085.Should().NotContain("G-REAL-06");
    }

    [Fact]
    public void Cg015_does_not_flip_host_agent_execution_mode_default()
    {
        string appsettings = File.ReadAllText(Path.Combine(RepoRoot, "ArchLucid.Api", "appsettings.json"));
        string catalog = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Core", "Configuration", "ConfigurationKeyCatalog.AgentExecution.cs"));
        string bannerResolver = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "working-simulator-clone-rehearsal-banner.ts"));

        appsettings.Should().Contain("\"Mode\": \"Simulator\"");
        catalog.Should().Contain("E(\"AgentExecution\", \"AgentExecution:Mode\"");
        catalog.Should().Contain("\"Simulator\"");
        bannerResolver.Should().NotContain("AgentExecution:Mode");
        bannerResolver.Should().NotContain("G-REAL-06");
    }

    [Fact]
    public void Cg015_working_simulator_clone_banner_is_rehearsal_not_sample_or_guided()
    {
        string copy = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "working-career-rehearsal-door-copy.ts"));
        string banner = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "workspace-mode",
                "WorkingSimulatorCloneRehearsalBanner.tsx"));
        string shell = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "shell",
                "AppShellStatusBanners.tsx"));

        copy.Should().Contain("WORKING_SIMULATOR_CLONE_REHEARSAL_BANNER_TITLE");
        copy.Should().Contain("Practice on this Simulator clone");
        copy.Should().Contain("not a sample workspace and not Guided teaching");
        banner.Should().Contain("WorkingSimulatorCloneRehearsalBanner");
        banner.Should().Contain("working-simulator-clone-rehearsal-banner");
        banner.Should().NotContain("setAndPersist");
        banner.Should().NotContain("persistWorkspaceMode");
        shell.Should().Contain("WorkingSimulatorCloneRehearsalBanner");
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
