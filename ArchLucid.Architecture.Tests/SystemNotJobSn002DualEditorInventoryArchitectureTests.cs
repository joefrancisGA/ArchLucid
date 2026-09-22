using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-002 ratchet: dual live editor inventory after spawn-lock; IA-007 leftover named.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn002DualEditorInventoryArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn002_inventory_doc_names_ia_007_leftover_and_field_table()
    {
        string markdown = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "architecture", "SYSTEM_NOT_JOB_DUAL_EDITOR_INVENTORY.md"));

        markdown.Should().Contain("IA-007 leftover");
        markdown.Should().Contain("Spawn-locked?");
        markdown.Should().Contain("architecture-draft-handoff-gate");
        markdown.Should().Contain("editSourceGuidedIntakeRerun");
        markdown.Should().Contain("SN-004");
    }

    [Fact]
    public void Sn002_inventory_module_lists_rows_and_alternate_writer()
    {
        string inventory = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-dual-editor-inventory.ts"));
        string test = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-dual-editor-inventory.test.ts"));

        inventory.Should().Contain("SYSTEM_NOT_JOB_DUAL_EDITOR_ROWS");
        inventory.Should().Contain("editSourceGuidedIntakeRerun");
        inventory.Should().Contain("alternate-writer");
        test.Should().Contain("SN-002");
        test.Should().Contain("handoffEditorLocked");
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
