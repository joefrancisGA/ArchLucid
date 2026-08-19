using FluentAssertions;

namespace ArchLucid.Analyzers.Tests;

[Trait("Category", "Unit")]
public sealed class AnalyzersPackageCoverageBatch5Tests
{
    [Fact]
    public void TenantScopedQuerySqlInspector_detects_targets_and_scope_helpers()
    {
        string selectSql = """
            SELECT * FROM dbo.Runs r
            INNER JOIN dbo.Findings f ON f.RunId = r.RunId
            WHERE r.TenantId = @TenantId
            """;

        IReadOnlyList<string> targets = TenantScopedQuerySqlInspector.GetTopLevelScopedTargets(selectSql);
        targets.Should().NotBeEmpty();

        TenantScopedQuerySqlInspector.HasTenantIdScopePredicate(selectSql).Should().BeTrue();
        TenantScopedQuerySqlInspector.HasTripleScopePredicate(
            """
            SELECT 1 FROM dbo.Runs
            WHERE TenantId = @ScopeTenantId
              AND WorkspaceId = @ScopeWorkspaceId
              AND ScopeProjectId = @ScopeProjectId
            """).Should().BeTrue();

        TenantScopedQuerySqlInspector.HasRecognizedScopeHelperMarkers(
            "INNER JOIN dbo.Runs run_scope ON 1=1").Should().BeTrue();

        TenantScopedQuerySqlInspector.GetTopLevelScopedTargets("   ").Should().BeEmpty();
        TenantScopedQuerySqlInspector.InsertIncludesTenantIdColumn(
            "INSERT INTO dbo.Runs (RunId, TenantId) VALUES (@RunId, @TenantId)",
            "dbo.Runs").Should().BeTrue();
        TenantScopedQuerySqlInspector.InsertIncludesTenantIdColumn(
            "INSERT INTO dbo.Runs (RunId) VALUES (@RunId)",
            "dbo.Runs").Should().BeFalse();
    }

    [Fact]
    public void ForeachToLinqCodeFixProvider_exposes_fixable_diagnostic_id()
    {
        ForeachToLinqCodeFixProvider provider = new();

        provider.FixableDiagnosticIds.Should().Contain(Al0002ForeachToLinqDescriptor.Rule.Id);
        provider.GetFixAllProvider().Should().NotBeNull();
    }
}
