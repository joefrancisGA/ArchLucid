using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-085 ratchet: host AgentExecution:Mode default stays Simulator (ADR 0086).</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs085NoHostModeFlipRatchetArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private const string AssertScriptRelativePath =
        "scripts/ci/assert_agent_execution_mode_default_simulator.py";

    private const string AppsettingsRelativePath = "ArchLucid.Api/appsettings.json";

    private const string DemoComposeRelativePath = "docker-compose.demo.yml";

    private const string Adr0086RelativePath = "docs/architecture/adrs/0086-working-career-vs-rehearsal-doors.md";

    [Fact]
    public void As085_assert_script_documents_adr_0086_and_allowlist()
    {
        string script = File.ReadAllText(Path.Combine(RepoRoot, AssertScriptRelativePath));

        script.Should().Contain("AS-085");
        script.Should().Contain("ADR 0086");
        script.Should().Contain("ALLOWLIST_RELATIVE_PATHS");
        script.Should().Contain("appsettings.Pilot.json");
        script.Should().Contain("docker-compose.real-aoai.yml");
    }

    [Fact]
    public void As085_default_appsettings_keeps_simulator_mode()
    {
        string appsettings = File.ReadAllText(Path.Combine(RepoRoot, AppsettingsRelativePath));

        appsettings.Should().Contain("\"Mode\": \"Simulator\"");
        appsettings.Should().Contain("ADR 0086");
        appsettings.Should().NotContain("\"Mode\": \"Real\"");
    }

    [Fact]
    public void As085_demo_compose_overlay_documents_simulator_default()
    {
        string compose = File.ReadAllText(Path.Combine(RepoRoot, DemoComposeRelativePath));
        string adr = File.ReadAllText(Path.Combine(RepoRoot, Adr0086RelativePath));

        compose.Should().Contain("AgentExecution:Mode=Simulator");
        compose.Should().Contain("ADR 0086");
        adr.Should().Contain("AS-085");
        adr.Should().Contain("ArchitectureSpineAs085NoHostModeFlipRatchetArchitectureTests");
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
