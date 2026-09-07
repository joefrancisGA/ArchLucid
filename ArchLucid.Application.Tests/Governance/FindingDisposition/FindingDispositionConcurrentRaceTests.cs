using ArchLucid.Application.Governance.FindingReview;
using ArchLucid.Application.Tests.Governance.FindingDisposition.Support;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FindingDispositionKind = ArchLucid.Contracts.Findings.FindingDisposition;
using FindingDispositionService = ArchLucid.Application.Governance.FindingDisposition.FindingDispositionService;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance.FindingDisposition;

/// <summary>
/// ADR 0076 — disposition current-pointer CAS: one writer succeeds; loser gets conflict without becoming current.
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
    public async Task RecordAsync_concurrent_opposing_dispositions_one_succeeds_one_conflicts()
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

        FindingDispositionEventDto winner = await acceptTask;
        Func<Task> loser = async () => await remediateTask;

        await loser.Should().ThrowAsync<ArchLucid.Application.Governance.FindingDisposition.FindingDispositionConflictException>();
        trailRepository.EventCount.Should().Be(1);
        winner.Disposition.Should().Be(FindingDispositionKind.Accepted);
        winner.CurrentDispositionRowVersionBase64.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task ListHistoryAsync_returns_latest_disposition_first_after_sequential_writes_with_version()
    {
        ConcurrentFindingReviewTrailRepository trailRepository = new();
        FindingDispositionService sut = CreateService(trailRepository);

        FindingDispositionEventDto first = await sut.RecordAsync(
            CreateRequest(
                FindingDispositionKind.Accepted,
                "first writer",
                tradeOffAcknowledgment: "accepting first-writer trade-off for pilot scope"),
            Scope,
            "alice",
            CancellationToken.None);

        FindingDispositionEventDto second = await sut.RecordAsync(
            CreateRequest(
                FindingDispositionKind.Remediated,
                "second writer",
                expectedRowVersionBase64: first.CurrentDispositionRowVersionBase64),
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
    public async Task RecordAsync_stale_row_version_throws_conflict_without_second_trail_row()
    {
        ConcurrentFindingReviewTrailRepository trailRepository = new();
        FindingDispositionService sut = CreateService(trailRepository);

        FindingDispositionEventDto first = await sut.RecordAsync(
            CreateRequest(FindingDispositionKind.Deferred, "defer first", revisitDueUtc: DateTimeOffset.UtcNow.AddDays(30)),
            Scope,
            "alice",
            CancellationToken.None);

        RecordFindingDispositionRequest stale = CreateRequest(
            FindingDispositionKind.Remediated,
            "stale writer",
            expectedRowVersionBase64: Convert.ToBase64String(new byte[] { 9, 9, 9, 9, 9, 9, 9, 9 }));

        Func<Task> act = async () => await sut.RecordAsync(stale, Scope, "bob", CancellationToken.None);

        await act.Should().ThrowAsync<ArchLucid.Application.Governance.FindingDisposition.FindingDispositionConflictException>();
        trailRepository.EventCount.Should().Be(1);
        first.EventId.Should().NotBeEmpty();
    }

    private static FindingDispositionService CreateService(ConcurrentFindingReviewTrailRepository trailRepository)
    {
        IFindingDispositionConcurrencyRepository concurrencyRepository =
            new InMemoryFindingDispositionConcurrencyRepository(trailRepository);
        FindingReviewTrailAppendService appendService = new(trailRepository, Mock.Of<IAuditService>());

        return new FindingDispositionService(concurrencyRepository, trailRepository, appendService);
    }

    private static RecordFindingDispositionRequest CreateRequest(
        FindingDispositionKind disposition,
        string rationale,
        DateTimeOffset? revisitDueUtc = null,
        string? tradeOffAcknowledgment = null,
        string? expectedRowVersionBase64 = null)
    {
        return new RecordFindingDispositionRequest
        {
            FindingId = "finding-race-001",
            Disposition = disposition,
            Rationale = rationale,
            RevisitDueUtc = revisitDueUtc,
            TradeOffAcknowledgment = tradeOffAcknowledgment,
            ExpectedCurrentDispositionRowVersionBase64 = expectedRowVersionBase64,
        };
    }
}
