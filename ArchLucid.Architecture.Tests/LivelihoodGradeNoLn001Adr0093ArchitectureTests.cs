using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class LivelihoodGradeNoLn001Adr0093ArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Ln001_adr_0093_forbids_uncited_hard_on_working_career()
    {
        string adr = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "architecture", "adrs", "0093-false-hard-citation-working-career.md"));

        adr.Should().Contain("## Trade-offs");
        adr.Should().Contain("Does not replace 0082");
        adr.Should().Contain("40th engine");
        adr.Should().Contain("G-REAL-06");
    }

    [Fact]
    public void Ln001_guard_inventory_and_vitest_exist()
    {
        string inventory = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "livelihood-grade-no-adr-inventory.ts"));
        string guardTest = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "livelihood-grade-no-adr-guard.test.ts"));

        inventory.Should().Contain("LIVELIHOOD_GRADE_NO_ADR_0093_RELATIVE_PATH");
        guardTest.Should().Contain("LN-001 / ADR 0093");
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
