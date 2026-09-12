using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-032 ratchet: Working help teaches architecture desk — system is the object; review is a nested job (WS-20).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn032HelpSystemNotJobArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn032_guide_content_names_identity_nested_jobs_and_clone()
    {
        string module = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-help-system-not-job-guide-content.ts"));

        module.Should().Contain("SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_CONCEPT_TILES");
        module.Should().Contain("Architecture identity is the object");
        module.Should().Contain("Reviews are nested jobs");
        module.Should().Contain("clone-after-spawn");
        module.Should().Contain("SN-032");
    }

    [Fact]
    public void Sn032_help_view_wires_architecture_desk_guide()
    {
        string view = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "help",
                "_sections",
                "HelpArchitectureDeskGuideView.tsx"));

        view.Should().Contain("HelpArchitectureDeskGuideView");
        view.Should().Contain("help-architecture-desk-guide");
        view.Should().Contain("SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_OVERVIEW");
    }

    [Fact]
    public void Sn032_vitest_ratchet_names_architecture_desk_route_and_working_sources()
    {
        string test = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-help-system-not-job.test.ts"));

        test.Should().Contain("SN-032");
        test.Should().Contain("architecture-desk");
        test.Should().Contain("GETTING_STARTED_HELP_WORKING_SOURCES");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? current = new(Directory.GetCurrentDirectory());

        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "ArchLucid.sln")))
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not find repository root containing ArchLucid.sln");
    }
}
