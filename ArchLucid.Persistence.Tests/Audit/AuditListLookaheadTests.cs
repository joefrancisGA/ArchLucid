using ArchLucid.Core.Audit;
using ArchLucid.Core.Pagination;
using ArchLucid.Persistence.Audit;

namespace ArchLucid.Persistence.Tests.Audit;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuditListLookaheadTests
{
    [Fact]
    public async Task Max_size_page_can_fetch_one_lookahead_row_without_raising_the_normal_cap()
    {
        InMemoryAuditRepository repository = new();
        Guid tenant = Guid.NewGuid();
        Guid workspace = Guid.NewGuid();
        Guid project = Guid.NewGuid();
        int cap = PaginationDefaults.MaxListingTake;
        DateTime newest = new(2026, 11, 16, 12, 0, 0, DateTimeKind.Utc);
        for (int i = 0; i <= cap; i++)
        {
            await repository.AppendAsync(new AuditEvent
            {
                EventId = Guid.NewGuid(),
                TenantId = tenant,
                WorkspaceId = workspace,
                ProjectId = project,
                OccurredUtc = newest.AddSeconds(-i),
                EventType = "Example"
            }, CancellationToken.None);
        }

        AuditEventFilter filter = new() { Take = cap + 1 };
        Assert.Equal(cap, (await repository.GetFilteredAsync(
            tenant, workspace, project, filter, CancellationToken.None)).Count);

        filter.AllowListLookaheadRow = true;
        IReadOnlyList<AuditEvent> rows = await repository.GetFilteredAsync(
            tenant, workspace, project, filter, CancellationToken.None);
        Assert.Equal(cap + 1, rows.Count);
        Assert.Equal(newest.AddSeconds(-cap), rows[^1].OccurredUtc);
    }
}
