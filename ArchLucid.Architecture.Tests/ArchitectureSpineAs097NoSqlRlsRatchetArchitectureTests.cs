using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     AS-097: ArchitectureShares DDL and repositories must not introduce SQL RLS (ADR 0037 / ADR 0087).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs097NoSqlRlsRatchetArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private static readonly string[] ForbiddenRlsPatterns =
    [
        "ROW LEVEL SECURITY",
        "ENABLE ROW LEVEL SECURITY",
        "CREATE SECURITY POLICY",
        "CREATE SCHEMA rls",
        "CREATE FUNCTION rls.",
        "SECURITY PREDICATE",
    ];

    private static readonly string[] ArchitectureShareDdlRelativePaths =
    [
        Path.Combine("Migrations", "380_ArchitectureShares.sql"),
        Path.Combine("Migrations", "Rollback", "R380_ArchitectureShares.sql"),
        Path.Combine("Scripts", "ArchLucid.sql"),
        Path.Combine("Scripts", "ArchLucid_Unified_Schema.sql"),
    ];

    [Fact]
    public void As097_architecture_share_migrations_and_schema_ddl_contain_no_rls()
    {
        foreach (string relativePath in ArchitectureShareDdlRelativePaths)
        {
            string sql = ReadPersistenceSql(relativePath);
            string ddlUnderTest = ExtractArchitectureShareDdlSegment(sql);

            ddlUnderTest.Should().NotBeNullOrWhiteSpace(
                because: $"expected ArchitectureShares DDL segment in {relativePath}");

            ddlUnderTest.Should().NotContainAny(
                ForbiddenRlsPatterns,
                because: $"ADR 0037 / AS-097 forbid SQL RLS on ArchitectureShares ({relativePath})");
        }
    }

    [Fact]
    public void As097_architecture_share_repository_queries_scope_by_tenant_columns()
    {
        string repositoryPath = Path.Combine(
            RepoRoot,
            "ArchLucid.Persistence",
            "Architecture",
            "SqlArchitectureShareRepository.cs");

        File.Exists(repositoryPath).Should().BeTrue();

        string source = File.ReadAllText(repositoryPath);

        source.Should().Contain("dbo.ArchitectureShares");
        source.Should().Contain("TenantId = @TenantId");
        source.Should().Contain("WorkspaceId = @WorkspaceId");
        source.Should().Contain("ScopeProjectId = @ScopeProjectId");
        source.Should().NotContainAny(
            ForbiddenRlsPatterns,
            because: "share repository must rely on application scope, not SQL RLS");
    }

    [Fact]
    public void As097_share_acl_contract_documents_no_rls_ratchet()
    {
        string contractPath = Path.Combine(RepoRoot, "docs", "library", "ARCHITECTURE_SHARE_ACL_CONTRACT.md");

        File.Exists(contractPath).Should().BeTrue();

        string contract = File.ReadAllText(contractPath);

        contract.Should().Contain("AS-097");
        contract.Should().Contain("SQL RLS");
        contract.Should().Contain("ArchitectureSpineAs097NoSqlRlsRatchetArchitectureTests");
    }

    [Fact]
    public void As097_adr_0087_forbids_rls_on_architecture_shares()
    {
        string adrPath = Path.Combine(
            RepoRoot,
            "docs",
            "architecture",
            "adrs",
            "0087-architecture-scoped-sharing-restrict-to-shares.md");

        File.Exists(adrPath).Should().BeTrue();

        string adr = File.ReadAllText(adrPath);

        adr.Should().Contain("AS-097");
        adr.Should().Contain("No SQL RLS");
        adr.Should().Contain("ArchitectureShares");
    }

    private static string ExtractArchitectureShareDdlSegment(string sql)
    {
        const string marker = "dbo.ArchitectureShares";

        int markerIndex = sql.IndexOf(marker, StringComparison.OrdinalIgnoreCase);

        if (markerIndex < 0)
            return string.Empty;

        int windowStart = Math.Max(0, markerIndex - 512);
        int windowLength = Math.Min(sql.Length - windowStart, 4096);

        return sql.Substring(windowStart, windowLength);
    }

    private static string ReadPersistenceSql(string relativePath)
    {
        string path = Path.Combine(RepoRoot, "ArchLucid.Persistence", relativePath);
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
