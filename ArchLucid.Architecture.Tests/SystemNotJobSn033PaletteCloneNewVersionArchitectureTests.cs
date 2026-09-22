using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-033 ratchet: command palette exposes spawn-locked clone when CTA is visible (SN-008 / SN-009).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn033PaletteCloneNewVersionArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn033_palette_module_names_visibility_resolver_and_handler_metadata()
    {
        string module = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-palette-clone-new-version.ts"));

        module.Should().Contain("resolveSystemNotJobPaletteCloneNewVersionVisible");
        module.Should().Contain("SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_HANDLER");
        module.Should().Contain("SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_SPAWN_LOCK_DOM_TEST_ID");
        module.Should().Contain("SN-033");
    }

    [Fact]
    public void Sn033_handler_actions_wire_palette_clone_visibility_resolver()
    {
        string handlers = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "command-palette-handler-actions.ts"));
        string bridge = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "shell",
                "CommandPaletteWorkActionBridge.tsx"));

        handlers.Should().Contain("resolveSystemNotJobPaletteCloneNewVersionVisible");
        handlers.Should().Contain("SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_HANDLER");
        bridge.Should().Contain("COMMAND_PALETTE_CLONE_FROM_SNAPSHOT_EVENT");
    }

    [Fact]
    public void Sn033_vitest_ratchet_names_hidden_when_not_spawn_locked()
    {
        string test = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-palette-clone-new-version.test.ts"));

        test.Should().Contain("SN-033");
        test.Should().Contain("hides palette clone when spawn-lock CTA is not on the page");
        test.Should().Contain("ArchitectureWhatIfCostCapChrome");
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
