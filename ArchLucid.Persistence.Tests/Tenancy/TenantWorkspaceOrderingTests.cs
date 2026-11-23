using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantWorkspaceOrderingTests
{
    [Fact]
    public void Equal_created_times_use_sql_uniqueidentifier_id_order()
    {
        DateTimeOffset stamp = new(2026, 11, 23, 12, 0, 0, TimeSpan.Zero);
        // SQL compares the last GUID bytes before the first group, unlike Guid.CompareTo.
        Guid lowerSqlId = Guid.Parse("ffffffff-0000-0000-0000-000000000001");
        Guid higherSqlId = Guid.Parse("00000000-0000-0000-0000-000000000002");
        TenantWorkspaceListItem low = new() { WorkspaceId = lowerSqlId, CreatedUtc = stamp };
        TenantWorkspaceListItem high = new() { WorkspaceId = higherSqlId, CreatedUtc = stamp };

        Guid[] firstOrder = TenantWorkspaceOrdering.OrderByCreatedUtcThenSqlId(
                [high, low], static row => row.CreatedUtc, static row => row.WorkspaceId)
            .Select(static row => row.WorkspaceId).ToArray();
        Guid[] reverseOrder = TenantWorkspaceOrdering.OrderByCreatedUtcThenSqlId(
                [low, high], static row => row.CreatedUtc, static row => row.WorkspaceId)
            .Select(static row => row.WorkspaceId).ToArray();

        firstOrder.Should().Equal(lowerSqlId, higherSqlId);
        reverseOrder.Should().Equal(lowerSqlId, higherSqlId);
    }

    [Fact]
    public void Creation_timestamp_precedes_workspace_id_tiebreaker()
    {
        DateTimeOffset stamp = new(2026, 11, 23, 12, 0, 0, TimeSpan.Zero);
        TenantWorkspaceListItem older = new()
        {
            WorkspaceId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
            CreatedUtc = stamp.AddSeconds(-1),
        };
        TenantWorkspaceListItem newer = new()
        {
            WorkspaceId = Guid.Parse("ffffffff-0000-0000-0000-000000000001"),
            CreatedUtc = stamp,
        };

        TenantWorkspaceListItem[] ordered = TenantWorkspaceOrdering.OrderByCreatedUtcThenSqlId(
                [newer, older], static row => row.CreatedUtc, static row => row.WorkspaceId)
            .ToArray();

        ordered.Should().Equal(older, newer);
    }

    [Fact]
    public void SQL_first_and_list_query_both_use_exact_composite_order()
    {
        DapperTenantRepository.GetFirstWorkspaceSql.Should()
            .Contain("ORDER BY CreatedUtc ASC, Id ASC;");
        DapperTenantRepository.ListWorkspacesSql.Should()
            .Contain("ORDER BY CreatedUtc ASC, Id ASC;");
        DapperTenantRepository.GetFirstWorkspaceSql.Should()
            .Contain("WHERE TenantId = @TenantId");
        DapperTenantRepository.ListWorkspacesSql.Should()
            .Contain("WHERE TenantId = @TenantId");
    }
}
