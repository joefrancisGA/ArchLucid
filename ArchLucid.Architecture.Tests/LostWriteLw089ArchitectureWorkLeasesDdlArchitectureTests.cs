using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>LW-089: dbo.ArchitectureWorkLeases DDL (ADR 0090) — unified schema + migration 388, no SQL RLS.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class LostWriteLw089ArchitectureWorkLeasesDdlArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Migration_388_adds_architecture_work_leases_table()
    {
        string migrationText = ReadPersistenceSql("Migrations", "388_ArchitectureWorkLeases.sql");

        migrationText.Should().Contain("CREATE TABLE dbo.ArchitectureWorkLeases");
        migrationText.Should().Contain("DraftId");
        migrationText.Should().Contain("TenantId");
        migrationText.Should().Contain("ArchitectureId");
        migrationText.Should().Contain("HolderUserId");
        migrationText.Should().Contain("AcquiredUtc");
        migrationText.Should().Contain("LastHeartbeatUtc");
        migrationText.Should().Contain("ExpiresUtc");
        migrationText.Should().Contain("RowVersion");
        migrationText.Should().Contain("FK_ArchitectureWorkLeases_DraftRequests");
        migrationText.Should().Contain("FK_ArchitectureWorkLeases_Tenants");
        migrationText.Should().Contain("FK_ArchitectureWorkLeases_Architectures");
        migrationText.Should().Contain("FK_ArchitectureWorkLeases_PlatformUsers");
        migrationText.Should().Contain("IX_ArchitectureWorkLeases_ExpiresUtc");
        migrationText.Should().NotContain("ROW LEVEL SECURITY", "ADR 0037 tenant catalog — no SQL RLS (LW-089)");
        migrationText.Should().NotContain("CREATE SECURITY POLICY", "ADR 0037 tenant catalog — no SQL RLS (LW-089)");
    }

    [Fact]
    public void Rollback_388_drops_architecture_work_leases()
    {
        string rollbackText = ReadPersistenceSql("Migrations", "Rollback", "R388_ArchitectureWorkLeases.sql");

        rollbackText.Should().Contain("DROP TABLE dbo.ArchitectureWorkLeases");
    }

    [Fact]
    public void ArchLucid_sql_includes_architecture_work_leases_ddl()
    {
        string ddl = ReadPersistenceSql("Scripts", "ArchLucid.sql");

        ddl.Should().Contain("CREATE TABLE dbo.ArchitectureWorkLeases");
        ddl.Should().Contain("IX_ArchitectureWorkLeases_ExpiresUtc");
    }

    [Fact]
    public void ArchLucid_unified_schema_includes_architecture_work_leases_ddl()
    {
        string ddl = ReadPersistenceSql("Scripts", "ArchLucid_Unified_Schema.sql");

        ddl.Should().Contain("CREATE TABLE dbo.ArchitectureWorkLeases");
        ddl.Should().Contain("FK_ArchitectureWorkLeases_DraftRequests");
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
            {
                return dir.FullName;
            }

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
