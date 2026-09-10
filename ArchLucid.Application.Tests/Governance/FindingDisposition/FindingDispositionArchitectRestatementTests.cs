using ArchLucid.Application.Governance.FindingReview;
using ArchLucid.Application.Tests.Governance.FindingDisposition.Support;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;
using FindingDispositionService = ArchLucid.Application.Governance.FindingDisposition.FindingDispositionService;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance.FindingDisposition;

[Trait("Category", "Unit")]
public sealed class FindingDispositionArchitectRestatementTests
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
    public async Task RecordAsync_persists_architect_restatement_separate_from_rationale()
    {
        ConcurrentFindingReviewTrailRepository trailRepository = new();
        FindingDispositionService sut = FindingDispositionServiceTestFactory.Create(trailRepository);

        const string restatement = "We will tell the ARB that cross-region replication is accepted with compensating controls.";
        const string rationale = "Residual risk accepted after control review.";

        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-restatement-001",
            Disposition = Disposition.Accepted,
            Rationale = rationale,
            TradeOffAcknowledgment = "accepting replication latency trade-off",
            ArchitectRestatement = restatement,
        };

        FindingDispositionEventDto result = await sut.RecordAsync(request, Scope, "alice", CancellationToken.None);

        result.Rationale.Should().Contain("Residual risk accepted");
        result.Rationale.Should().NotContain(restatement);
        result.ArchitectRestatement.Should().Be(restatement);

        IReadOnlyList<FindingDispositionEventDto> history =
            await sut.ListHistoryAsync(Scope, "finding-restatement-001", CancellationToken.None);

        history.Should().ContainSingle();
        history[0].ArchitectRestatement.Should().Be(restatement);
    }

    [Fact]
    public async Task RecordAsync_omits_blank_architect_restatement()
    {
        ConcurrentFindingReviewTrailRepository trailRepository = new();
        FindingDispositionService sut = FindingDispositionServiceTestFactory.Create(trailRepository);

        RecordFindingDispositionRequest request = new()
        {
            FindingId = "finding-restatement-002",
            Disposition = Disposition.Remediated,
            Rationale = "Remediation shipped in release 2.4.",
            ArchitectRestatement = "   ",
        };

        FindingDispositionEventDto result = await sut.RecordAsync(request, Scope, "alice", CancellationToken.None);

        result.ArchitectRestatement.Should().BeNull();
    }
}
