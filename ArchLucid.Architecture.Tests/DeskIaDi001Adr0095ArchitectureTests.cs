using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// DI-001 ratchet: ADR 0095 sealed record Governance inventory home.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DeskIaDi001Adr0095ArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Di001_adr_0095_names_governance_inventory_and_forbids_tab_collapse()
    {
        string adr = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "architecture", "adrs", "0095-sealed-record-governance-home.md"));

        adr.Should().Contain("## Trade-offs");
        adr.Should().Contain("## Constraints");
        adr.Should().Contain("## Expected impact");
        adr.Should().Contain("Governance");
        adr.Should().Contain("sealed review records");
        adr.Should().Contain("Security:");
    }

    [Fact]
    public void Di001_guard_inventory_and_vitest_exist()
    {
        string inventory = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "desk-ia-adr-inventory.ts"));
        string guardTest = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "desk-ia-adr-guard.test.ts"));

        inventory.Should().Contain("DESK_IA_ADR_0095_RELATIVE_PATH");
        guardTest.Should().Contain("DI-001 / ADR 0095");
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
