using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Tests.Support;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
public sealed class RunChildRunScopeSqlTests
{
    [Fact]
    public void ScopeWhereClause_contains_TenantId()
    {
        string clause = RunChildRunScopeSql.ScopeWhereClause;

        clause.Should().Contain("TenantId");
        clause.Should().Contain($"{RunChildRunScopeSql.RunsAlias}.TenantId = @TenantId");
    }

    [Fact]
    public void ScopeParameters_maps_scope_context()
    {
        ScopeContext scope = ArchitectureCommitTestSeed.AsScopeContext();
        object parameters = RunChildRunScopeSql.ScopeParameters(scope);

        parameters.Should().BeEquivalentTo(new
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
        });
    }
}
