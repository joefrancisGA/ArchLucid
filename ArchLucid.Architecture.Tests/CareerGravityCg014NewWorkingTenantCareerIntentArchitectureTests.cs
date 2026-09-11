using ArchLucid.Contracts.User;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-014 ratchet: new Working tenants default to Career intent. Does not re-implement AS-080.
/// Host AgentExecution:Mode stays Simulator (no G-REAL-06). Grandfather Rehearsal banner is CG-015.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg014NewWorkingTenantCareerIntentArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg014_get_default_for_unset_door_is_career_not_rehearsal()
    {
        WorkingCareerRehearsalDoorValues.Default.Should().Be(WorkingCareerRehearsalDoorValues.Career);
        WorkingCareerRehearsalDoorValues.Default.Should().NotBe(WorkingCareerRehearsalDoorValues.Rehearsal);
        WorkingCareerRehearsalDoorValues.ParseOrDefault(null).Should().Be(WorkingCareerRehearsalDoorValues.Career);
    }

    [Fact]
    public void Cg014_preferences_get_maps_unset_door_through_parse_or_default()
    {
        string appearanceController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "User", "UserPreferencesController.Appearance.cs"));
        string getPreferencesTest = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api.Tests", "UserPreferencesControllerTests.cs"));

        appearanceController.Should().Contain("WorkingCareerRehearsalDoorValues.ParseOrDefault(workingCareerRehearsalDoorStored)");
        getPreferencesTest.Should().Contain("body.WorkingCareerRehearsalDoor.Should().Be(WorkingCareerRehearsalDoorValues.Default)");
        getPreferencesTest.Should().Contain("body.WorkingCareerRehearsalDoorIsExplicit.Should().BeFalse()");
    }

    [Fact]
    public void Cg014_as080_source_ratchet_still_exists_and_is_not_rewritten_here()
    {
        string as080Path = Path.Combine(
            RepoRoot,
            "ArchLucid.Architecture.Tests",
            "ArchitectureSpineAs080NewWorkingTenantsCareerIntentArchitectureTests.cs");

        File.Exists(as080Path).Should().BeTrue();

        string as080 = File.ReadAllText(as080Path);

        as080.Should().Contain("NEW_WORKING_TENANT_CAREER_REHEARSAL_DOOR_DEFAULT");
        as080.Should().Contain("LEGACY_WORKING_SIMULATOR_REHEARSAL_DOOR_DEFAULT");
        as080.Should().NotContain("G-REAL-06");
    }

    [Fact]
    public void Cg014_does_not_flip_host_agent_execution_mode_default()
    {
        string appsettings = File.ReadAllText(Path.Combine(RepoRoot, "ArchLucid.Api", "appsettings.json"));
        string catalog = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Core", "Configuration", "ConfigurationKeyCatalog.AgentExecution.cs"));
        string doorValues = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "User", "WorkingCareerRehearsalDoorValues.cs"));

        appsettings.Should().Contain("\"Mode\": \"Simulator\"");
        catalog.Should().Contain("E(\"AgentExecution\", \"AgentExecution:Mode\"");
        catalog.Should().Contain("\"Simulator\"");
        doorValues.Should().NotContain("AgentExecution:Mode");
        doorValues.Should().NotContain("G-REAL-06");
    }

    [Fact]
    public void Cg014_legacy_simulator_grandfather_stays_rehearsal_for_cg015()
    {
        string doorModule = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "governance", "working-career-rehearsal-door.ts"));

        doorModule.Should().Contain("LEGACY_WORKING_SIMULATOR_REHEARSAL_DOOR_DEFAULT");
        doorModule.Should().Contain("WORKING_CAREER_REHEARSAL_TENANT_GRANDFATHER_STORAGE_KEY");
        doorModule.Should().Contain("\"rehearsal\"");
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
