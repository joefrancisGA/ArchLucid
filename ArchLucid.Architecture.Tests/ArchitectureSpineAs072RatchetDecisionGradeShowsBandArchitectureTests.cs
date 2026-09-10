using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-072 ratchet: Working decision-grade surfaces must show semantic support band chip.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs072RatchetDecisionGradeShowsBandArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As072_ui_desk_guard_module_exists_and_lists_guarded_paths()
    {
        string inventory = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "findings", "semantic-support-band-desk-inventory.ts"));

        inventory.Should().Contain("SEMANTIC_SUPPORT_BAND_DESK_GUARDED_PATHS");
        inventory.Should().Contain("FindingSemanticSupportBandChip");
        inventory.Should().Contain("RunDetailFindingsDenseTableRow.tsx");
    }

    [Fact]
    public void As072_ui_desk_guard_test_scans_guarded_surfaces()
    {
        string guardTest = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "findings", "semantic-support-band-desk-guard.test.ts"));

        guardTest.Should().Contain("AS-072");
        guardTest.Should().Contain("findSemanticSupportBandDeskGuardViolations");
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
