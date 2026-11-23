using ArchLucid.Core.Metering;
using ArchLucid.Persistence.Tenancy;
using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class UsageEventOrderingTests
{
    private static readonly Guid Tenant = Guid.Parse("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    private static readonly DateTimeOffset At = new(2026, 11, 23, 0, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Tied_timestamps_use_sql_uniqueidentifier_order_before_limiting()
    {
        // .NET Guid.CompareTo and SQL Server uniqueidentifier use different ordering.
        Guid lowSqlId = Guid.Parse("ffffffff-0000-0000-0000-000000000001");
        Guid highSqlId = Guid.Parse("00000000-0000-0000-0000-000000000002");
        UsageEvent low = Event(lowSqlId, At);
        UsageEvent high = Event(highSqlId, At);

        Guid First(IEnumerable<UsageEvent> rows) =>
            UsageEventRepositoryCore.ListInPeriod(
                rows, Tenant, At.AddMinutes(-1), At.AddMinutes(1),
                kindFilter: null, take: 1)[0].Id;

        First([low, high]).Should().Be(highSqlId);
        First([high, low]).Should().Be(highSqlId);
    }

    [Fact]
    public void Timestamp_order_precedes_event_id_and_respects_tenant_filter()
    {
        UsageEvent newest = Event(Guid.Parse("ffffffff-0000-0000-0000-000000000001"), At.AddSeconds(1));
        UsageEvent older = Event(Guid.Parse("00000000-0000-0000-0000-000000000002"), At);
        UsageEvent foreign = Event(Guid.NewGuid(), At.AddSeconds(2), Guid.NewGuid());

        IReadOnlyList<UsageEvent> rows = UsageEventRepositoryCore.ListInPeriod(
            [foreign, older, newest], Tenant, At.AddMinutes(-1), At.AddMinutes(1),
            kindFilter: UsageMeterKind.ApiRequest, take: 2);

        rows.Select(static item => item.Id).Should().Equal(newest.Id, older.Id);
    }

    [Fact]
    public void Sql_list_query_has_same_id_tiebreaker()
    {
        DapperUsageEventRepository.ListOrderingSql.Should()
            .Be(" ORDER BY RecordedUtc DESC, Id DESC;");
    }

    private static UsageEvent Event(Guid id, DateTimeOffset recorded, Guid? tenant = null) =>
        new()
        {
            Id = id,
            TenantId = tenant ?? Tenant,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            Kind = UsageMeterKind.ApiRequest,
            Quantity = 1,
            RecordedUtc = recorded
        };
}
