using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-004 ratchet: Architecture tab vs draft one writer after spawn; zero parallel-live-edit rows.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn004ArchitectureTabOneWriterArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn004_one_writer_module_suppresses_created_origin_edit_source()
    {
        string oneWriter = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "architecture", "architecture-draft-spawn-one-writer.ts"));

        oneWriter.Should().Contain("ARCHITECTURE_TAB_SPAWN_ONE_WRITER_SNAPSHOT_HELPER");
        oneWriter.Should().Contain("resolveArchitectureTabEditSourceHref");
        oneWriter.Should().Contain("packageOrigin === \"created\"");
    }

    [Fact]
    public void Sn004_inventory_and_vitest_close_parallel_live_edit_baseline()
    {
        string inventory = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-dual-editor-inventory.ts"));
        string vitest = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-spawn-one-writer.test.ts"));
        string evidence = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "[reviewId]",
                "_sections",
                "run-detail-page-presentation-evidence.ts"));

        inventory.Should().Contain("SYSTEM_NOT_JOB_DUAL_EDITOR_PARALLEL_LIVE_EDIT_COUNT_BASELINE = 0");
        inventory.Should().Contain("ownerPrompt: \"SN-004\"");
        vitest.Should().Contain("SN-004");
        evidence.Should().Contain("resolveArchitectureTabEditSourceHrefFromRunSummary");
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
