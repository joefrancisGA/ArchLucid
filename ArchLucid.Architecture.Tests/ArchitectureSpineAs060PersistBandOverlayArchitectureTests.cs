using ArchLucid.Core.Persistence;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-060 ratchet: semantic support band overlay persistence stays off sealed finding prose tables.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs060PersistBandOverlayArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As060_overlay_table_is_not_commit_sealed()
    {
        SealedEvidenceTableRegistry.SealedTableNames
            .Should()
            .NotContain(SealedEvidenceTableRegistry.FindingSemanticSupportBandOverlaysTableName);
    }

    [Fact]
    public void As060_findings_stage_persists_and_freezes_overlay()
    {
        string stage = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "Pipeline",
                "Stages",
                "AuthorityPipelineFindingsStage.cs"));

        stage.Should().Contain("PersistSnapshotOverlaysAsync");
        stage.Should().Contain("FreezeSnapshotOverlaysAsync");
    }

    [Fact]
    public void As060_migration_and_unified_schema_define_overlay_table()
    {
        string migration = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Persistence",
                "Migrations",
                "379_FindingSemanticSupportBandOverlays.sql"));

        string unified = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Persistence", "Scripts", "ArchLucid_Unified_Schema.sql"));

        migration.Should().Contain("FindingSemanticSupportBandOverlays");
        unified.Should().Contain("FindingSemanticSupportBandOverlays");
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
