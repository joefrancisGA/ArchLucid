using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// AS-076 ratchet: ADR 0086 Accepted (owner 2026-09-12).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs076Adr0086AcceptedArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As076_adr_0086_working_doors_is_accepted()
    {
        string adr = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "docs",
                "architecture",
                "adrs",
                "0086-working-career-vs-rehearsal-doors.md"));

        adr.Should().Contain("**Status:** Accepted");
        adr.Should().Contain("G-REAL-06");
    }

    [Fact]
    public void As076_vitest_guard_inventory_exists()
    {
        string inventory = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "architecture-spine-adr-inventory.ts"));

        inventory.Should().Contain("ARCHITECTURE_SPINE_ADR_0086_RELATIVE_PATH");
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

        throw new InvalidOperationException("Could not locate repository root.");
    }
}
