using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Sql;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Sql;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class ContextSnapshotReadSqlTests
{
    private static ScopeContext ScopedContext() =>
        new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };

    [Fact]
    public void Raw_string_order_by_concat_glues_the_scope_parameter_name()
    {
        string clause = PersistenceTenantScope.AndScopeProjectIdTripleWhere(ScopedContext());
        string glued = "WHERE ProjectId = @ProjectId" + clause + """
                           ORDER BY CreatedUtc DESC;
                           """;

        glued.Should().Contain("@ScopeProjectIdORDER");
    }

    [Fact]
    public void BuildGetLatest_separates_scope_parameter_from_order_by()
    {
        ScopeContext scope = ScopedContext();

        string sql = ContextSnapshotReadSql.BuildGetLatest(scope);

        sql.Should().Contain(PersistenceTenantScope.AndScopeProjectIdTripleWhere(scope));
        sql.Should().Contain("@ScopeProjectId");
        sql.Should().Contain("ORDER BY CreatedUtc DESC");
        sql.Should().NotContain("@ScopeProjectIdORDER");
        sql.Should().MatchRegex(@"@ScopeProjectId\s+ORDER BY CreatedUtc DESC");
    }

    [Fact]
    public void BuildGetLatest_keeps_order_by_when_trusted_job_omits_scope()
    {
        string sql = ContextSnapshotReadSql.BuildGetLatest(new ScopeContext());

        sql.Should().Contain("WHERE ProjectId = @ProjectId");
        sql.Should().Contain("ORDER BY CreatedUtc DESC");
        sql.Should().NotContain("@ProjectIdORDER");
        sql.Should().MatchRegex(@"@ProjectId\s+ORDER BY CreatedUtc DESC");
    }

    [Fact]
    public void BuildGetById_appends_scope_predicate_before_terminator()
    {
        ScopeContext scope = ScopedContext();

        string sql = ContextSnapshotReadSql.BuildGetById(scope);

        sql.Should().Contain("WHERE SnapshotId = @SnapshotId");
        sql.Should().Contain(PersistenceTenantScope.AndScopeProjectIdTripleWhere(scope));
        sql.Should().EndWith(";");
        sql.Should().NotContain("@SnapshotIdAND");
    }

    [Fact]
    public void BuildGetLatest_throws_when_scope_is_null()
    {
        Action act = () => ContextSnapshotReadSql.BuildGetLatest(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void BuildGetById_throws_when_scope_is_null()
    {
        Action act = () => ContextSnapshotReadSql.BuildGetById(null!);

        act.Should().Throw<ArgumentNullException>();
    }
}
