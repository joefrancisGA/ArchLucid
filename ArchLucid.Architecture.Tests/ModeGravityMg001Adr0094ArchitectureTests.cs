using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// MG-001 ratchet: ADR 0094 Working one execute gravity and mode-gravity guard inventory.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ModeGravityMg001Adr0094ArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Mg001_adr_0094_forbids_operator_experience_as_gravity_and_keeps_guided()
    {
        string adr = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "architecture", "adrs", "0094-working-one-execute-gravity.md"));

        adr.Should().Contain("## Trade-offs");
        adr.Should().Contain("## Constraints");
        adr.Should().Contain("## Expected impact");
        adr.Should().Contain("Is operator-experience a Career door?");
        adr.Should().Contain("**No.**");
        adr.Should().Contain("delete Guided");
        adr.Should().Contain("G-REAL-06");
        adr.Should().Contain("Security:");
    }

    [Fact]
    public void Mg001_guard_inventory_and_vitest_exist()
    {
        string inventory = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "mode-gravity-adr-inventory.ts"));
        string guardTest = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "mode-gravity-adr-guard.test.ts"));

        inventory.Should().Contain("MODE_GRAVITY_ADR_0094_RELATIVE_PATH");
        guardTest.Should().Contain("MG-001 / ADR 0094");
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
