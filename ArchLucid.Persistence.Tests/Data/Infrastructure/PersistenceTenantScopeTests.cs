using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Persistence.Tests.Data.Infrastructure;

[Trait("Category", "Unit")]
public sealed class PersistenceTenantScopeTests
{
    [SkippableFact]
    public void Inline_predicate_delegates_without_changing_trusted_job_behavior()
    {
        ScopeContext scope = new() { TenantId = Guid.Empty };

        string clause = PersistenceTenantScope.AndTripleWhere(scope);

        clause.Should().BeEmpty();
    }

    [SkippableFact]
    public void Run_child_scope_delegates_without_changing_join_shape()
    {
        string join = PersistenceTenantScope.InnerJoinRuns("child");

        join.Should().Contain("INNER JOIN dbo.Runs run_scope");
        join.Should().Contain("child.RunId");
    }
}
