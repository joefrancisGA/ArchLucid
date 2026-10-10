using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Api.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class SnapshotListSqlSeparatorTests
{
    [Fact]
    public void BeforeOrderBy_keeps_scope_parameter_separate_from_order_by()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        string sql = "WHERE 1 = 1"
            + SnapshotListSqlSeparator.BeforeOrderBy(PersistenceTenantScope.AndTripleWhere(scope, "s"))
            + "ORDER BY COALESCE(s.CapturedUtc, s.CreatedUtc) DESC";

        sql.Should().Contain("@ScopeProjectId\nORDER BY");
        sql.Should().NotContain("@ScopeProjectIdORDER");
    }

    [Fact]
    public void BeforeOrderBy_trusted_job_still_separates_order_by()
    {
        string sql = "WHERE 1 = 1"
            + SnapshotListSqlSeparator.BeforeOrderBy(string.Empty)
            + "ORDER BY s.CapturedUtc DESC";

        sql.Should().Contain("WHERE 1 = 1\nORDER BY");
        sql.Should().NotContain("1 = 1ORDER");
    }
}
