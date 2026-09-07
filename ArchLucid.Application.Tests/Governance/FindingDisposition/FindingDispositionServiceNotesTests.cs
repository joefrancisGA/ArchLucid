using ArchLucid.Application.Governance.FindingReview;
using ArchLucid.Application.Tests.Governance.FindingDisposition.Support;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;
using FindingDispositionService = ArchLucid.Application.Governance.FindingDisposition.FindingDispositionService;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance.FindingDisposition;

[Trait("Category", "Unit")]
public sealed class FindingDispositionServiceNotesTests
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
    public async Task RecordAsync_remediated_ignores_trade_off_acknowledgment_in_notes()
    {
        ConcurrentFindingReviewTrailRepository trailRepository = new();
        FindingDispositionService sut = CreateService(trailRepository);

        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-notes-001",
            Disposition = Disposition.Remediated,
            Rationale = "Remediation shipped in release 2.4.",
            TradeOffAcknowledgment = "this trade-off must not appear on remediated events",
        };

        FindingDispositionEventDto result = await sut.RecordAsync(request, Scope, "alice", CancellationToken.None);

        result.Rationale.Should().Be("Remediation shipped in release 2.4.");
    }

    [Fact]
    public async Task RecordAsync_accepted_drops_revisit_and_evidence_fields()
    {
        ConcurrentFindingReviewTrailRepository trailRepository = new();
        FindingDispositionService sut = CreateService(trailRepository);

        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-notes-002",
            Disposition = Disposition.Accepted,
            Rationale = "We accept residual risk because rollback is documented.",
            TradeOffAcknowledgment = "accepting latency trade-off for lower cost",
            RevisitDueUtc = DateTimeOffset.UtcNow.AddDays(14),
            EvidenceRequestText = "should not persist on accepted",
        };

        FindingDispositionEventDto result = await sut.RecordAsync(request, Scope, "alice", CancellationToken.None);

        result.RevisitDueUtc.Should().BeNull();
        result.EvidenceRequestText.Should().BeNull();
    }

    [Fact]
    public async Task RecordAsync_needs_evidence_drops_revisit_and_trade_off_fields()
    {
        ConcurrentFindingReviewTrailRepository trailRepository = new();
        FindingDispositionService sut = CreateService(trailRepository);

        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-notes-003",
            Disposition = Disposition.NeedsEvidence,
            EvidenceRequestText = "Provide SOC 2 Type II attestation for the data store.",
            TradeOffAcknowledgment = "must not appear on needs-evidence events",
            RevisitDueUtc = DateTimeOffset.UtcNow.AddDays(14),
        };

        FindingDispositionEventDto result = await sut.RecordAsync(request, Scope, "alice", CancellationToken.None);

        result.EvidenceRequestText.Should().Be("Provide SOC 2 Type II attestation for the data store.");
        result.Rationale.Should().BeNull();
        result.RevisitDueUtc.Should().BeNull();
    }

    [Fact]
    public async Task ListHistoryAsync_excludes_disposition_events_from_other_project()
    {
        ConcurrentFindingReviewTrailRepository trailRepository = new();
        FindingDispositionService sut = CreateService(trailRepository);

        ScopeContext otherProjectScope = new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
        };

        await sut.RecordAsync(
            new RecordFindingDispositionRequest
            {
                FindingId = "shared-finding-id",
                Disposition = Disposition.Remediated,
                Rationale = "Remediated in the other project.",
            },
            otherProjectScope,
            "bob",
            CancellationToken.None);

        IReadOnlyList<FindingDispositionEventDto> history =
            await sut.ListHistoryAsync(Scope, "shared-finding-id", CancellationToken.None);

        history.Should().BeEmpty();
    }

    private static FindingDispositionService CreateService(ConcurrentFindingReviewTrailRepository trailRepository)
    {
        IFindingDispositionConcurrencyRepository concurrencyRepository =
            new InMemoryFindingDispositionConcurrencyRepository(trailRepository);
        FindingReviewTrailAppendService appendService = new(trailRepository, Mock.Of<IAuditService>());

        return new FindingDispositionService(concurrencyRepository, trailRepository, appendService);
    }
}
