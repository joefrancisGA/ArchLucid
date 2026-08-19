using ArchLucid.Core.Pagination;
using ArchLucid.Decisioning.Alerts;
using ArchLucid.Persistence.Alerts;

namespace ArchLucid.Persistence.Tests.Alerts;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class InMemoryAlertRecordRepositoryTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    private static readonly DateTime BaseUtc = new(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc);

    [SkippableFact]
    public async Task CreateAsync_then_GetByIdAsync_returns_same_row()
    {
        InMemoryAlertRecordRepository repo = new();
        Guid alertId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        AlertRecord alert = BuildAlert(alertId, AlertStatus.Open, BaseUtc, "k1");

        await repo.CreateAsync(alert, CancellationToken.None);

        AlertRecord? loaded = await repo.GetByIdAsync(alertId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded.AlertId.Should().Be(alertId);
        loaded.DeduplicationKey.Should().Be("k1");
    }

    [SkippableFact]
    public async Task UpdateAsync_replaces_existing_alert_by_AlertId()
    {
        InMemoryAlertRecordRepository repo = new();
        Guid alertId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        AlertRecord original = BuildAlert(alertId, AlertStatus.Open, BaseUtc, "k");
        await repo.CreateAsync(original, CancellationToken.None);

        AlertRecord updated = BuildAlert(alertId, AlertStatus.Resolved, BaseUtc.AddHours(1), "k");
        updated.Title = "updated";

        await repo.UpdateAsync(updated, CancellationToken.None);

        AlertRecord? loaded = await repo.GetByIdAsync(alertId, CancellationToken.None);
        loaded.Should().NotBeNull();
        loaded.Status.Should().Be(AlertStatus.Resolved);
        loaded.Title.Should().Be("updated");
    }

    [SkippableFact]
    public async Task CreateAsync_trims_oldest_when_exceeding_MaxEntries_500()
    {
        InMemoryAlertRecordRepository repo = new();
        Guid firstId = Guid.Parse("10000000-0000-0000-0000-000000000001");
        AlertRecord first = BuildAlert(firstId, AlertStatus.Open, BaseUtc, "first");
        await repo.CreateAsync(first, CancellationToken.None);

        Task[] tail = Enumerable
            .Range(2, 500)
            .Select(i => repo.CreateAsync(
                BuildAlert(
                    Guid.Parse($"10000000-0000-0000-0000-{i:000000000000}"),
                    AlertStatus.Open,
                    BaseUtc.AddMinutes(i),
                    $"k{i}"),
                CancellationToken.None))
            .ToArray();

        await Task.WhenAll(tail);

        AlertRecord? gone = await repo.GetByIdAsync(firstId, CancellationToken.None);
        gone.Should().BeNull();

        IReadOnlyList<AlertRecord> scope =
            await repo.ListByScopeAsync(TenantId, WorkspaceId, ProjectId, null, 600, ct: CancellationToken.None);
        scope.Should().HaveCount(500);
    }

    [SkippableFact]
    public async Task GetOpenByDeduplicationKeyAsync_returns_newest_Open_or_Acknowledged_in_scope_only()
    {
        InMemoryAlertRecordRepository repo = new();
        const string key = "dedupe-a";

        await repo.CreateAsync(
            BuildAlert(Guid.Parse("20000000-0000-0000-0000-000000000001"), AlertStatus.Open, BaseUtc, key),
            CancellationToken.None);

        await repo.CreateAsync(
            BuildAlert(Guid.Parse("20000000-0000-0000-0000-000000000002"), AlertStatus.Acknowledged,
                BaseUtc.AddHours(1), key),
            CancellationToken.None);

        await repo.CreateAsync(
            BuildAlert(Guid.Parse("20000000-0000-0000-0000-000000000003"), AlertStatus.Open, BaseUtc.AddHours(2), key),
            CancellationToken.None);

        AlertRecord? match =
            await repo.GetOpenByDeduplicationKeyAsync(TenantId, WorkspaceId, ProjectId, key, CancellationToken.None);
        match.Should().NotBeNull();
        match.AlertId.Should().Be(Guid.Parse("20000000-0000-0000-0000-000000000003"));
    }

    [SkippableFact]
    public async Task GetOpenByDeduplicationKeyAsync_ignores_Resolved_and_wrong_scope()
    {
        InMemoryAlertRecordRepository repo = new();
        const string key = "dedupe-b";

        await repo.CreateAsync(
            BuildAlert(Guid.Parse("21000000-0000-0000-0000-000000000001"), AlertStatus.Resolved, BaseUtc, key),
            CancellationToken.None);

        AlertRecord? noResolved =
            await repo.GetOpenByDeduplicationKeyAsync(TenantId, WorkspaceId, ProjectId, key, CancellationToken.None);
        noResolved.Should().BeNull();

        await repo.CreateAsync(
            BuildAlert(
                Guid.Parse("21000000-0000-0000-0000-000000000002"),
                AlertStatus.Open,
                BaseUtc,
                key,
                Guid.Parse("99999999-9999-9999-9999-999999999999")),
            CancellationToken.None);

        AlertRecord? noOtherTenant =
            await repo.GetOpenByDeduplicationKeyAsync(TenantId, WorkspaceId, ProjectId, key, CancellationToken.None);
        noOtherTenant.Should().BeNull();
    }

    [SkippableFact]
    public async Task ListByScopeAsync_orders_newest_CreatedUtc_first_and_clamps_take()
    {
        InMemoryAlertRecordRepository repo = new();

        await repo.CreateAsync(
            BuildAlert(Guid.Parse("30000000-0000-0000-0000-000000000001"), AlertStatus.Open, BaseUtc, "x"),
            CancellationToken.None);

        await repo.CreateAsync(
            BuildAlert(Guid.Parse("30000000-0000-0000-0000-000000000002"), AlertStatus.Open, BaseUtc.AddHours(3), "x"),
            CancellationToken.None);

        await repo.CreateAsync(
            BuildAlert(Guid.Parse("30000000-0000-0000-0000-000000000003"), AlertStatus.Open, BaseUtc.AddHours(1), "x"),
            CancellationToken.None);

        IReadOnlyList<AlertRecord> list =
            await repo.ListByScopeAsync(TenantId, WorkspaceId, ProjectId, null, 2, ct: CancellationToken.None);
        list.Should().HaveCount(2);
        list[0].CreatedUtc.Should().Be(BaseUtc.AddHours(3));
        list[1].CreatedUtc.Should().Be(BaseUtc.AddHours(1));

        IReadOnlyList<AlertRecord> defaultTake =
            await repo.ListByScopeAsync(TenantId, WorkspaceId, ProjectId, null, 0, ct: CancellationToken.None);
        defaultTake.Should().HaveCount(3);

        IReadOnlyList<AlertRecord> maxCap =
            await repo.ListByScopeAsync(TenantId, WorkspaceId, ProjectId, null, 900, ct: CancellationToken.None);
        maxCap.Should().HaveCount(3);
    }

    [SkippableFact]
    public async Task ListByScopeAsync_status_filter_is_case_insensitive()
    {
        InMemoryAlertRecordRepository repo = new();
        await repo.CreateAsync(
            BuildAlert(Guid.Parse("31000000-0000-0000-0000-000000000001"), AlertStatus.Open, BaseUtc, "a"),
            CancellationToken.None);
        await repo.CreateAsync(
            BuildAlert(Guid.Parse("31000000-0000-0000-0000-000000000002"), AlertStatus.Resolved, BaseUtc, "b"),
            CancellationToken.None);

        IReadOnlyList<AlertRecord> openOnly =
            await repo.ListByScopeAsync(TenantId, WorkspaceId, ProjectId, "open", 50, ct: CancellationToken.None);

        openOnly.Should().ContainSingle();
        openOnly[0].Status.Should().Be(AlertStatus.Open);
    }

    [SkippableFact]
    public async Task ListByScopePagedAsync_returns_total_and_respects_skip_take_with_MaxPageSize_clamp()
    {
        InMemoryAlertRecordRepository repo = new();

        Task[] batch = Enumerable
            .Range(0, 10)
            .Select(n => repo.CreateAsync(
                BuildAlert(Guid.Parse($"32000000-0000-0000-0000-0000000000{n:D2}"), AlertStatus.Open,
                    BaseUtc.AddMinutes(n), $"k{n}"),
                CancellationToken.None))
            .ToArray();

        await Task.WhenAll(batch);

        (IReadOnlyList<AlertRecord> page, int total) = await repo.ListByScopePagedAsync(
            TenantId,
            WorkspaceId,
            ProjectId,
            null,
            2,
            PaginationDefaults.MaxPageSize + 50,
            ct: CancellationToken.None);

        total.Should().Be(10);
        page.Should().HaveCount(8);
        page[0].CreatedUtc.Should().Be(BaseUtc.AddMinutes(7));

        (IReadOnlyList<AlertRecord> page2, int total2) = await repo.ListByScopePagedAsync(
            TenantId,
            WorkspaceId,
            ProjectId,
            null,
            -3,
            3,
            ct: CancellationToken.None);

        total2.Should().Be(10);
        page2.Should().HaveCount(3);
        page2[0].CreatedUtc.Should().Be(BaseUtc.AddMinutes(9));
    }

    [SkippableFact]
    public async Task ListByScopeKeysetAsync_pages_newest_first_and_sets_HasMore()
    {
        InMemoryAlertRecordRepository repo = new();

        Guid idA = Guid.Parse("33000000-0000-0000-0000-00000000000a");
        Guid idB = Guid.Parse("33000000-0000-0000-0000-00000000000b");
        Guid idC = Guid.Parse("33000000-0000-0000-0000-00000000000c");
        Guid idD = Guid.Parse("33000000-0000-0000-0000-00000000000d");

        // Same CreatedUtc for B/C so AlertId DESC is the tie-break.
        DateTime sharedUtc = BaseUtc.AddHours(1);

        await repo.CreateAsync(BuildAlert(idA, AlertStatus.Open, BaseUtc, "a"), CancellationToken.None);
        await repo.CreateAsync(BuildAlert(idB, AlertStatus.Open, sharedUtc, "b"), CancellationToken.None);
        await repo.CreateAsync(BuildAlert(idC, AlertStatus.Open, sharedUtc, "c"), CancellationToken.None);
        await repo.CreateAsync(BuildAlert(idD, AlertStatus.Open, BaseUtc.AddHours(2), "d"), CancellationToken.None);

        (IReadOnlyList<AlertRecord> firstPage, bool firstHasMore) = await repo.ListByScopeKeysetAsync(
            TenantId,
            WorkspaceId,
            ProjectId,
            null,
            null,
            null,
            2,
            ct: CancellationToken.None);

        firstHasMore.Should().BeTrue();
        firstPage.Should().HaveCount(2);
        firstPage[0].AlertId.Should().Be(idD);
        firstPage[1].AlertId.Should().Be(idC);

        (IReadOnlyList<AlertRecord> secondPage, bool secondHasMore) = await repo.ListByScopeKeysetAsync(
            TenantId,
            WorkspaceId,
            ProjectId,
            null,
            firstPage[^1].CreatedUtc,
            firstPage[^1].AlertId,
            2,
            ct: CancellationToken.None);

        secondHasMore.Should().BeFalse();
        secondPage.Should().HaveCount(2);
        secondPage[0].AlertId.Should().Be(idB);
        secondPage[1].AlertId.Should().Be(idA);
    }

    [SkippableFact]
    public async Task ListByScopeKeysetAsync_throws_when_cursor_halves_are_mismatched()
    {
        InMemoryAlertRecordRepository repo = new();

        Func<Task> act = async () => await repo.ListByScopeKeysetAsync(
            TenantId,
            WorkspaceId,
            ProjectId,
            null,
            BaseUtc,
            null,
            10,
            ct: CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [SkippableFact]
    public async Task GetInboxSummaryByScopeAsync_aggregates_status_blocking_and_last_evaluated()
    {
        InMemoryAlertRecordRepository repo = new();

        AlertRecord openHigh = BuildAlert(
            Guid.Parse("40000000-0000-0000-0000-000000000001"),
            AlertStatus.Open,
            BaseUtc,
            "o1",
            severity: AlertSeverity.High);

        AlertRecord openCritical = BuildAlert(
            Guid.Parse("40000000-0000-0000-0000-000000000002"),
            AlertStatus.Open,
            BaseUtc.AddHours(1),
            "o2",
            severity: AlertSeverity.Critical);
        openCritical.LastUpdatedUtc = BaseUtc.AddHours(2);

        AlertRecord acknowledged = BuildAlert(
            Guid.Parse("40000000-0000-0000-0000-000000000003"),
            AlertStatus.Acknowledged,
            BaseUtc.AddMinutes(30),
            "a1");

        AlertRecord resolved = BuildAlert(
            Guid.Parse("40000000-0000-0000-0000-000000000004"),
            AlertStatus.Resolved,
            BaseUtc.AddMinutes(45),
            "r1");

        AlertRecord archivedOpen = BuildAlert(
            Guid.Parse("40000000-0000-0000-0000-000000000005"),
            AlertStatus.Open,
            BaseUtc.AddHours(3),
            "arch",
            severity: AlertSeverity.Critical);
        archivedOpen.IsArchived = true;

        await repo.CreateAsync(openHigh, CancellationToken.None);
        await repo.CreateAsync(openCritical, CancellationToken.None);
        await repo.CreateAsync(acknowledged, CancellationToken.None);
        await repo.CreateAsync(resolved, CancellationToken.None);
        await repo.CreateAsync(archivedOpen, CancellationToken.None);

        AlertsInboxSummaryDto summary = await repo.GetInboxSummaryByScopeAsync(
            TenantId,
            WorkspaceId,
            ProjectId,
            CancellationToken.None);

        summary.OpenCount.Should().Be(2);
        summary.AcknowledgedCount.Should().Be(1);
        summary.ResolvedCount.Should().Be(1);
        summary.BlockingCount.Should().Be(2);
        summary.LastEvaluatedUtc.Should().Be(BaseUtc.AddHours(2));
    }

    [SkippableFact]
    public async Task CreateAsync_with_null_alert_throws()
    {
        InMemoryAlertRecordRepository repo = new();

        Func<Task> act = async () => await repo.CreateAsync(null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [SkippableFact]
    public async Task UpdateAsync_with_null_alert_throws()
    {
        InMemoryAlertRecordRepository repo = new();

        Func<Task> act = async () => await repo.UpdateAsync(null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    private static AlertRecord BuildAlert(
        Guid alertId,
        string status,
        DateTime createdUtc,
        string deduplicationKey,
        Guid? tenantId = null,
        string severity = AlertSeverity.Warning)
    {
        return new AlertRecord
        {
            AlertId = alertId,
            TenantId = tenantId ?? TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            Title = "t",
            Category = "c",
            Severity = severity,
            Status = status,
            TriggerValue = "v",
            Description = "d",
            CreatedUtc = createdUtc,
            DeduplicationKey = deduplicationKey
        };
    }
}
