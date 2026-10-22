using ArchLucid.Analyzers;

using FluentAssertions;

namespace ArchLucid.Analyzers.Tests;

/// <summary>
///     RC28e package-coverage batch: insert tenant-id column detection and surrogate-key scope helpers.
/// </summary>
[Trait("Category", "Unit")]
public sealed class AnalyzersPackageCoverageBatchRc28eTests
{
    [Fact]
    public void InsertIncludesTenantIdColumn_true_for_bracketed_dbo_insert_column_list()
    {
        const string sql = """
            INSERT INTO [dbo].[TenantSettings] (SettingKey, TenantId, SettingValue)
            VALUES (@SettingKey, @TenantId, @SettingValue);
            """;

        bool includesTenantId = TenantScopedQuerySqlInspector.InsertIncludesTenantIdColumn(sql, "dbo.TenantSettings");

        includesTenantId.Should().BeTrue();
    }

    [Fact]
    public void InsertIncludesTenantIdColumn_false_when_insert_targets_different_table()
    {
        const string sql = """
            INSERT INTO dbo.Runs (RunId, TenantId)
            VALUES (@RunId, @TenantId);
            """;

        bool includesTenantId = TenantScopedQuerySqlInspector.InsertIncludesTenantIdColumn(sql, "dbo.TenantSettings");

        includesTenantId.Should().BeFalse();
    }

    [Fact]
    public void IsPrimaryKeyScopedMutation_true_for_delete_with_single_surrogate_predicate()
    {
        const string sql = "DELETE FROM dbo.Findings WHERE FindingId = @FindingId";

        bool scoped = TenantScopedQuerySqlInspector.IsPrimaryKeyScopedMutation(sql);

        scoped.Should().BeTrue();
    }

    [Fact]
    public void IsPrimaryKeyScopedMutation_false_when_where_clause_missing()
    {
        const string sql = "UPDATE dbo.Runs SET Status = @Status";

        bool scoped = TenantScopedQuerySqlInspector.IsPrimaryKeyScopedMutation(sql);

        scoped.Should().BeFalse();
    }

    [Fact]
    public void IsSingleSurrogateKeyRead_true_for_key_with_is_not_null_filter()
    {
        const string sql = """
            SELECT ArtifactId FROM dbo.Artifacts
            WHERE ArtifactId = @ArtifactId
              AND DeletedUtc IS NOT NULL;
            """;

        bool scoped = TenantScopedQuerySqlInspector.IsSingleSurrogateKeyRead(sql);

        scoped.Should().BeTrue();
    }

    [Fact]
    public void IsScopeBoundForTable_true_when_insert_includes_tenant_id_column()
    {
        const string sql = """
            INSERT INTO dbo.TenantSettings (TenantId, SettingKey, SettingValue)
            VALUES (@TenantId, @SettingKey, @SettingValue);
            """;

        bool bound = TenantScopedQuerySqlInspector.IsScopeBoundForTable(
            sql,
            "dbo.TenantSettings",
            requiresTripleScope: true,
            hasScopeHelperInvocation: false);

        bound.Should().BeTrue();
    }
}
