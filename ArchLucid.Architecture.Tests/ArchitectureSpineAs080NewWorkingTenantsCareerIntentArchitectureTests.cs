using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-080 ratchet: new Working tenants default to Career; legacy Simulator clones grandfather Rehearsal.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs080NewWorkingTenantsCareerIntentArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private const string DoorModuleRelativePath =
        "archlucid-ui/src/lib/governance/working-career-rehearsal-door.ts";

    [Fact]
    public void As080_door_module_defaults_new_tenants_to_career()
    {
        string doorModule = File.ReadAllText(Path.Combine(RepoRoot, DoorModuleRelativePath));

        doorModule.Should().Contain("NEW_WORKING_TENANT_CAREER_REHEARSAL_DOOR_DEFAULT");
        doorModule.Should().Contain("\"career\"");
        doorModule.Should().Contain("AS-080");
    }

    [Fact]
    public void As080_door_module_documents_grandfather_rehearsal_for_legacy_simulator_clones()
    {
        string doorModule = File.ReadAllText(Path.Combine(RepoRoot, DoorModuleRelativePath));

        doorModule.Should().Contain("LEGACY_WORKING_SIMULATOR_REHEARSAL_DOOR_DEFAULT");
        doorModule.Should().Contain("WORKING_CAREER_REHEARSAL_TENANT_GRANDFATHER_STORAGE_KEY");
        doorModule.Should().Contain("resolveDefaultWorkingCareerRehearsalDoor");
        doorModule.Should().Contain("grandfather");
    }

    [Fact]
    public void As080_door_module_does_not_flip_host_agent_execution_mode()
    {
        string doorModule = File.ReadAllText(Path.Combine(RepoRoot, DoorModuleRelativePath));

        doorModule.Should().NotContain("AgentExecution:Mode");
        doorModule.Should().NotContain("appsettings");
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
