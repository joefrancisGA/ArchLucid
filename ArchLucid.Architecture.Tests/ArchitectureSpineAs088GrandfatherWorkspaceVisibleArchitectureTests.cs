using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-088: grandfather backfill keeps existing architectures workspace-visible until opt-in.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs088GrandfatherWorkspaceVisibleArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Migration_381_backfills_restrict_to_shares_zero()
    {
        string migrationText = ReadPersistenceSql("Migrations", "381_GrandfatherArchitecturesRestrictToShares.sql");

        migrationText.Should().Contain("AS-088");
        migrationText.Should().Contain("UPDATE dbo.Architectures");
        migrationText.Should().Contain("RestrictToShares = 0");
        migrationText.Should().NotContain("ROW LEVEL SECURITY", "ADR 0037 tenant catalog — no SQL RLS (AS-088)");
    }

    [Fact]
    public void Migration_380_default_remains_workspace_visible_grandfather()
    {
        string migrationText = ReadPersistenceSql("Migrations", "380_ArchitectureShares.sql");

        migrationText.Should().Contain("DF_Architectures_RestrictToShares DEFAULT (0)");
    }

    private static string ReadPersistenceSql(params string[] relativeSegments)
    {
        string[] parts = new string[relativeSegments.Length + 2];
        parts[0] = RepoRoot;
        parts[1] = "ArchLucid.Persistence";
        Array.Copy(relativeSegments, 0, parts, 2, relativeSegments.Length);
        string path = Path.Combine(parts);
        File.Exists(path).Should().BeTrue($"expected SQL at {path}");

        return File.ReadAllText(path);
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
