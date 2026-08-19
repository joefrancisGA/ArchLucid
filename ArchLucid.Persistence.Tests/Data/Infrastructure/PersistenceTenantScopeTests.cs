using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Tests.Data.Infrastructure;

[Trait("Category", "Unit")]
public sealed class PersistenceTenantScopeTests
{
    private static ScopeContext ScopedContext() =>
        new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

    private static ScopeContext TrustedJobContext() => new() { TenantId = Guid.Empty };

    [Fact]
    public void AndTripleWhere_is_empty_for_trusted_jobs()
    {
        string clause = PersistenceTenantScope.AndTripleWhere(TrustedJobContext());

        clause.Should().BeEmpty();
    }

    [Fact]
    public void AndTripleWhere_emits_scope_triple_for_scoped_tenant()
    {
        ScopeContext scope = ScopedContext();

        string clause = PersistenceTenantScope.AndTripleWhere(scope);

        clause.Should().Be(RepositoryScopePredicate.AndTripleWhere(scope));
        clause.Should().Contain("TenantId = @ScopeTenantId");
        clause.Should().Contain("ProjectId = @ScopeProjectId");
    }

    [Fact]
    public void AndProjectIdTripleWhere_targets_ProjectId_column()
    {
        string clause = PersistenceTenantScope.AndProjectIdTripleWhere(ScopedContext());

        clause.Should().Contain(" ProjectId = @ScopeProjectId");
    }

    [Fact]
    public void AndScopeProjectIdTripleWhere_targets_ScopeProjectId_column()
    {
        string clause = PersistenceTenantScope.AndScopeProjectIdTripleWhere(ScopedContext());

        clause.Should().Contain("ScopeProjectId = @ScopeProjectId");
    }

    [Fact]
    public void AddScopeTripleIfNeeded_adds_three_parameters_for_scoped_tenant()
    {
        DynamicParameters parameters = new();

        PersistenceTenantScope.AddScopeTripleIfNeeded(parameters, ScopedContext());

        parameters.ParameterNames.Should().BeEquivalentTo(
            new[] { "ScopeTenantId", "ScopeWorkspaceId", "ScopeProjectId" });
    }

    [Fact]
    public void AddScopeTripleIfNeeded_adds_nothing_for_trusted_jobs()
    {
        DynamicParameters parameters = new();

        PersistenceTenantScope.AddScopeTripleIfNeeded(parameters, TrustedJobContext());

        parameters.ParameterNames.Should().BeEmpty();
    }

    [Fact]
    public void InnerJoinRuns_defaults_to_RunId_column()
    {
        string join = PersistenceTenantScope.InnerJoinRuns("child");

        join.Should().Contain("INNER JOIN dbo.Runs run_scope");
        join.Should().Contain("child.RunId");
        join.Should().Contain("ArchivedUtc IS NULL");
    }

    [Fact]
    public void InnerJoinRuns_honors_custom_child_run_id_column()
    {
        string join = PersistenceTenantScope.InnerJoinRuns("child", "SourceRunId");

        join.Should().Contain("child.SourceRunId");
    }

    [Fact]
    public void RunChildScopeWhereClause_matches_underlying_run_child_predicate()
    {
        PersistenceTenantScope.RunChildScopeWhereClause
            .Should().Be(RunChildRunScopeSql.ScopeWhereClause);
    }

    [Fact]
    public void RunChildScopeParameters_maps_scope_context()
    {
        ScopeContext scope = ScopedContext();

        object parameters = PersistenceTenantScope.RunChildScopeParameters(scope);

        parameters.Should().BeEquivalentTo(new
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
        });
    }

    [Fact]
    public void RequireRunChildScope_rejects_empty_tenant()
    {
        Action act = () => PersistenceTenantScope.RequireRunChildScope(TrustedJobContext());

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*run-child*");
    }

    [Fact]
    public void RequireRunChildScope_accepts_scoped_tenant()
    {
        Action act = () => PersistenceTenantScope.RequireRunChildScope(ScopedContext());

        act.Should().NotThrow();
    }

    [Fact]
    public void RequireScopedTenant_rejects_empty_tenant()
    {
        Action act = () => PersistenceTenantScope.RequireScopedTenant(TrustedJobContext());

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void RequireScopedTenant_accepts_scoped_tenant()
    {
        Action act = () => PersistenceTenantScope.RequireScopedTenant(ScopedContext());

        act.Should().NotThrow();
    }

    [Fact]
    public void RequireEntityTenant_rejects_empty_tenant()
    {
        Action act = () => PersistenceTenantScope.RequireEntityTenant(Guid.Empty);

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void RequireEntityTenant_accepts_populated_tenant()
    {
        Action act = () => PersistenceTenantScope.RequireEntityTenant(Guid.NewGuid());

        act.Should().NotThrow();
    }

    [Fact]
    public void TrustedJobScope_carries_no_tenant_so_predicates_are_skipped()
    {
        ScopeContext trusted = PersistenceTenantScope.TrustedJobScope;

        trusted.TenantId.Should().Be(Guid.Empty);
        PersistenceTenantScope.AndTripleWhere(trusted).Should().BeEmpty();
    }
}
