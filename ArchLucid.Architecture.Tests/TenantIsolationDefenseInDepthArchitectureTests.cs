using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Ensures ADR 0037 defense-in-depth artifacts remain wired (catalog boundary, no RLS reinstatement drift).
/// </summary>
[Trait("Category", "Unit")]
public sealed class TenantIsolationDefenseInDepthArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Adr0037_exists_and_is_accepted()
    {
        string path = Path.Combine(RepoRoot, "docs", "architecture", "adrs", "0037-tenant-isolation-without-rls-defense-in-depth.md");
        File.Exists(path).Should().BeTrue("ADR 0037 must exist");

        string text = File.ReadAllText(path);
        text.Should().Contain("**Status:** Accepted");
        text.Should().Contain("does not use SQL Row-Level Security");
    }

    [Fact]
    public void Defense_in_depth_doc_exists()
    {
        string path = Path.Combine(RepoRoot, "docs", "security", "TENANT_ISOLATION_DEFENSE_IN_DEPTH.md");
        File.Exists(path).Should().BeTrue();
    }

    [Fact]
    public void ArchLucid_sql_contains_no_rls_objects()
    {
        string path = Path.Combine(RepoRoot, "ArchLucid.Persistence", "Scripts", "ArchLucid.sql");
        string sql = File.ReadAllText(path);

        // ADR 0037: RLS was removed; the consolidated schema must never re-introduce it.
        sql.Should().NotContainAny(
            "CREATE SCHEMA rls",
            "CREATE SECURITY POLICY",
            "CREATE FUNCTION rls.");
    }

    [Fact]
    public void Single_catalog_prod_guard_exists_in_production_safety_rules()
    {
        string path = Path.Combine(
            RepoRoot,
            "ArchLucid.Host.Core",
            "Startup",
            "Validation",
            "Rules",
            "ProductionSafetyRules.cs");

        string text = File.ReadAllText(path);
        text.Should().Contain("CollectSingleCatalogDisallowedInProductionLike");
        text.Should().Contain("SystemWithPerTenantCatalogs");
    }

    [Fact]
    public void Tenant_identity_boundary_analyzer_exists()
    {
        string path = Path.Combine(RepoRoot, "ArchLucid.Analyzers", "TenantIdentityBoundaryAnalyzer.cs");
        File.Exists(path).Should().BeTrue();
    }

    [Fact]
    public void Route_tenant_scope_guard_script_exists()
    {
        string path = Path.Combine(RepoRoot, "scripts", "ci", "assert_route_tenant_scope_guard.py");
        File.Exists(path).Should().BeTrue();
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
