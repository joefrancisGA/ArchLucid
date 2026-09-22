using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// RP-001 ratchet: ADR 0097 Record / Practice user-facing labels.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RecordPracticeRp001Adr0097ArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Rp001_adr_0097_is_accepted_and_central_copy_is_record_practice()
    {
        string adr = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "architecture", "adrs", "0097-record-and-practice-user-facing-labels.md"));
        string doorCopy = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "working-career-rehearsal-door-copy.ts"));

        adr.Should().Contain("**Status:** Accepted");
        adr.Should().Contain("Record");
        adr.Should().Contain("Practice");
        doorCopy.Should().Contain("Record");
        doorCopy.Should().Contain("Practice");
        doorCopy.Should().NotContain("Career");
    }

    [Fact]
    public void Rp001_guard_inventory_and_vitest_exist()
    {
        string inventory = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "record-practice-adr-inventory.ts"));
        string guardTest = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "record-practice-adr-guard.test.ts"));

        inventory.Should().Contain("RECORD_PRACTICE_ADR_0097_RELATIVE_PATH");
        guardTest.Should().Contain("RP-001 / ADR 0097");
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
