using ArchLucid.Application.Governance.FindingReview;
using ArchLucid.Application.Tests.Governance.FindingDisposition.Support;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using FindingDispositionKind = ArchLucid.Contracts.Findings.FindingDisposition;
using FindingDispositionService = ArchLucid.Application.Governance.FindingDisposition.FindingDispositionService;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance.FindingDisposition;

/// <summary>
/// TB-988 — append-only finding disposition races: both writers persist; current = latest <c>OccurredAtUtc</c>.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
[Trait("Backlog", "TB-988")]
public sealed class FindingDispositionConcurrentRaceTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private static readonly Guid ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    private static readonly ScopeContext Scope = new()
    {
        TenantId = TenantId,
        WorkspaceId = WorkspaceId,
        ProjectId = ProjectId,
    };

    [Fact]
    public async Task RecordAsync_concurrent_opposing_dispositions_persist_both_events_without_conflict()
    {
        ConcurrentFindingReviewTrailRepository trailRepository = new();
        FindingDispositionService sut = CreateService(trailRepository);

        RecordFindingDispositionRequest acceptRequest = CreateRequest(
            FindingDispositionKind.Accepted,
            "accept concurrent",
            tradeOffAcknowledgment: "accepting concurrent latency trade-off for lower cost");
        RecordFindingDispositionRequest remediateRequest = CreateRequest(FindingDispositionKind.Remediated, "remediate concurrent");

        Task<FindingDispositionEventDto> acceptTask = sut.RecordAsync(acceptRequest, Scope, "alice", CancellationToken.None);
        Task<FindingDispositionEventDto> remediateTask = sut.RecordAsync(remediateRequest, Scope, "bob", CancellationToken.None);

        FindingDispositionEventDto[] results = await Task.WhenAll(acceptTask, remediateTask);

        results.Should().HaveCount(2);
        results.Select(result => result.EventId).Should().OnlyHaveUniqueItems();
        trailRepository.EventCount.Should().Be(2);
    }

    [Fact]
    public async Task ListHistoryAsync_returns_latest_disposition_first_after_sequential_race()
    {
        ConcurrentFindingReviewTrailRepository trailRepository = new();
        FindingDispositionService sut = CreateService(trailRepository);

        await sut.RecordAsync(
            CreateRequest(
                FindingDispositionKind.Accepted,
                "first writer",
                tradeOffAcknowledgment: "accepting first-writer trade-off for pilot scope"),
            Scope,
            "alice",
            CancellationToken.None);

        await Task.Delay(5);

        await sut.RecordAsync(
            CreateRequest(FindingDispositionKind.Remediated, "second writer"),
            Scope,
            "carol",
            CancellationToken.None);

        IReadOnlyList<FindingDispositionEventDto> history =
            await sut.ListHistoryAsync(Scope, "finding-race-001", CancellationToken.None);

        history.Should().HaveCount(2);
        history[0].Disposition.Should().Be(FindingDispositionKind.Remediated);
        history[0].ReviewerUserId.Should().Be("carol");
        history[1].Disposition.Should().Be(FindingDispositionKind.Accepted);
    }

    [Fact]
    public async Task RecordAsync_never_overwrites_prior_disposition_events()
    {
        ConcurrentFindingReviewTrailRepository trailRepository = new();
        FindingDispositionService sut = CreateService(trailRepository);

        FindingDispositionEventDto first = await sut.RecordAsync(
            CreateRequest(FindingDispositionKind.Deferred, "defer first", revisitDueUtc: DateTimeOffset.UtcNow.AddDays(30)),
            Scope,
            "alice",
            CancellationToken.None);

        FindingDispositionEventDto second = await sut.RecordAsync(
            CreateRequest(FindingDispositionKind.Remediated, "remediate second"),
            Scope,
            "bob",
            CancellationToken.None);

        IReadOnlyList<FindingDispositionEventDto> history =
            await sut.ListHistoryAsync(Scope, "finding-race-001", CancellationToken.None);

        history.Should().ContainSingle(item => item.EventId == first.EventId && item.Disposition == FindingDispositionKind.Deferred);
        history.Should().ContainSingle(item => item.EventId == second.EventId && item.Disposition == FindingDispositionKind.Remediated);
    }

    private static FindingDispositionService CreateService(ConcurrentFindingReviewTrailRepository trailRepository)
    {
        FindingReviewTrailAppendService appendService = new(trailRepository, Mock.Of<IAuditService>());
        return new FindingDispositionService(appendService, trailRepository);
    }

    private static RecordFindingDispositionRequest CreateRequest(
        FindingDispositionKind disposition,
        string rationale,
        DateTimeOffset? revisitDueUtc = null,
        string? tradeOffAcknowledgment = null)
    {
        return new RecordFindingDispositionRequest
        {
            FindingId = "finding-race-001",
            Disposition = disposition,
            Rationale = rationale,
            RevisitDueUtc = revisitDueUtc,
            TradeOffAcknowledgment = tradeOffAcknowledgment,
        };
    }
}
