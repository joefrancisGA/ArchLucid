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

[Trait("Category", "Unit")]
public sealed class FindingDispositionServiceBulkAtomicityTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task RecordBulkAsync_does_not_persist_prior_rows_when_later_item_conflicts()
    {
        ConcurrentFindingReviewTrailRepository trailRepository = new();
        FindingDispositionService sut = CreateService(trailRepository);

        await sut.RecordAsync(
            CreateRequest(
                "finding-conflict-target",
                FindingDispositionKind.Accepted,
                "existing accepted disposition",
                tradeOffAcknowledgment: "accepting existing disposition trade-off for pilot scope"),
            Scope,
            "alice",
            CancellationToken.None);

        int eventsAfterSeed = trailRepository.EventCount;

        RecordFindingDispositionRequest freshFinding = CreateRequest(
            "finding-fresh",
            FindingDispositionKind.Accepted,
            "bulk fresh finding",
            tradeOffAcknowledgment: "accepting fresh finding trade-off for pilot scope");
        RecordFindingDispositionRequest conflictingFinding = CreateRequest(
            "finding-conflict-target",
            FindingDispositionKind.Remediated,
            "bulk conflicting remediation");

        Func<Task> act = () => sut.RecordBulkAsync(
            [freshFinding, conflictingFinding],
            Scope,
            "bob",
            CancellationToken.None);

        await act.Should().ThrowAsync<ArchLucid.Application.Governance.FindingDisposition.FindingDispositionConflictException>();

        trailRepository.EventCount.Should().Be(eventsAfterSeed);
        (await sut.ListHistoryAsync(Scope, "finding-fresh", CancellationToken.None)).Should().BeEmpty();
    }

    private static FindingDispositionService CreateService(ConcurrentFindingReviewTrailRepository trailRepository)
    {
        return FindingDispositionServiceTestFactory.Create(trailRepository);
    }

    private static RecordFindingDispositionRequest CreateRequest(
        string findingId,
        FindingDispositionKind disposition,
        string rationale,
        string? tradeOffAcknowledgment = null)
    {
        return new RecordFindingDispositionRequest
        {
            FindingId = findingId,
            Disposition = disposition,
            Rationale = rationale,
            TradeOffAcknowledgment = tradeOffAcknowledgment,
        };
    }
}
