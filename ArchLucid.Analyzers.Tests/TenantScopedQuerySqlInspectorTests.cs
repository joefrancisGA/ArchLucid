namespace ArchLucid.Analyzers.Tests;
[Trait("Category", "Unit")]

public sealed class TenantScopedQuerySqlInspectorTests
{
    [Fact]
    public void Triple_scope_predicate_is_recognized()
    {
        const string sql = """
                           SELECT RunId FROM dbo.Runs
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ScopeProjectId;
                           """;

        bool bound = TenantScopedQuerySqlInspector.IsScopeBoundForTable(
            sql,
            "dbo.Runs",
            requiresTripleScope: true,
            hasScopeHelperInvocation: false);

        Assert.True(bound);
    }

    [Fact]
    public void Unscoped_run_select_is_not_bound()
    {
        const string sql = "SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL;";

        bool bound = TenantScopedQuerySqlInspector.IsScopeBoundForTable(
            sql,
            "dbo.Runs",
            requiresTripleScope: true,
            hasScopeHelperInvocation: false);

        Assert.False(bound);
    }

    [Fact]
    public void Tenant_id_predicate_in_sql_comment_does_not_bind_runs()
    {
        const string sql = """
                           /* TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND ScopeProjectId = @ScopeProjectId */
                           SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL;
                           """;

        bool bound = TenantScopedQuerySqlInspector.IsScopeBoundForTable(
            sql,
            "dbo.Runs",
            requiresTripleScope: true,
            hasScopeHelperInvocation: false);

        Assert.False(bound);
    }

    [Fact]
    public void Merge_on_tenant_id_is_bound_for_tenant_settings()
    {
        const string sql = """
                           MERGE dbo.TenantSettings AS target
                           USING (SELECT @TenantId AS TenantId, @SettingKey AS SettingKey) AS source
                           ON target.TenantId = source.TenantId AND target.SettingKey = source.SettingKey
                           WHEN MATCHED THEN UPDATE SET SettingValue = @SettingValue;
                           """;

        bool bound = TenantScopedQuerySqlInspector.IsScopeBoundForTable(
            sql,
            "dbo.TenantSettings",
            requiresTripleScope: false,
            hasScopeHelperInvocation: false);

        Assert.True(bound);
    }

    [Fact]
    public void Surrogate_key_read_with_soft_delete_filter_is_bound()
    {
        const string sql = """
                           SELECT PolicyPackId FROM dbo.PolicyPacks
                           WHERE PolicyPackId = @PolicyPackId
                             AND IsDeleted = 0;
                           """;

        bool bound = TenantScopedQuerySqlInspector.IsScopeBoundForTable(
            sql,
            "dbo.PolicyPacks",
            requiresTripleScope: true,
            hasScopeHelperInvocation: false);

        Assert.True(bound);
    }

    [Fact]
    public void Merge_on_short_alias_tenant_id_is_bound()
    {
        const string sql = """
                           MERGE dbo.CorePilotTeamChecklist AS t
                           USING (SELECT @TenantId AS TenantId) AS s
                           ON t.TenantId = s.TenantId
                           WHEN MATCHED THEN UPDATE SET IsCompleted = @IsCompleted;
                           """;

        bool bound = TenantScopedQuerySqlInspector.IsScopeBoundForTable(
            sql,
            "dbo.CorePilotTeamChecklist",
            requiresTripleScope: true,
            hasScopeHelperInvocation: false);

        Assert.True(bound);
    }
}
