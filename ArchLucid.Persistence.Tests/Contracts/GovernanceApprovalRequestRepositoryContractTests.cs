using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Contracts;

/// <summary>
/// Shared contract assertions for <see cref="IGovernanceApprovalRequestRepository"/>.
/// </summary>
public abstract class GovernanceApprovalRequestRepositoryContractTests
{
    protected virtual void SkipIfSqlServerUnavailable()
    {
    }

    protected abstract IGovernanceApprovalRequestRepository CreateRepository();

    [SkippableFact]
    public async Task Create_then_GetById_round_trips()
    {
        SkipIfSqlServerUnavailable();
        IGovernanceApprovalRequestRepository repo = CreateRepository();
        string runId = Guid.NewGuid().ToString("N");
        string approvalId = "apr-" + Guid.NewGuid().ToString("N");
        DateTime requestedUtc = new(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc);

        GovernanceApprovalRequest item = NewApproval(approvalId, runId, requestedUtc);

        await repo.CreateAsync(item, CancellationToken.None);

        GovernanceApprovalRequest? loaded = await repo.GetByIdAsync(approvalId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded.ApprovalRequestId.Should().Be(approvalId);
        loaded.RunId.Should().Be(runId);
        loaded.Status.Should().Be(GovernanceApprovalStatus.Submitted);
    }

    [SkippableFact]
    public async Task Update_then_GetById_reflects_status()
    {
        SkipIfSqlServerUnavailable();
        IGovernanceApprovalRequestRepository repo = CreateRepository();
        string runId = Guid.NewGuid().ToString("N");
        string approvalId = "apr-upd-" + Guid.NewGuid().ToString("N");
        GovernanceApprovalRequest item = NewApproval(approvalId, runId, DateTime.UtcNow);

        await repo.CreateAsync(item, CancellationToken.None);

        item.Status = GovernanceApprovalStatus.Approved;
        item.ReviewedBy = "reviewer";
        item.ReviewedUtc = new DateTime(2026, 4, 2, 0, 0, 0, DateTimeKind.Utc);

        await repo.UpdateAsync(item, CancellationToken.None);

        GovernanceApprovalRequest? loaded = await repo.GetByIdAsync(approvalId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded.Status.Should().Be(GovernanceApprovalStatus.Approved);
        loaded.ReviewedBy.Should().Be("reviewer");
        loaded.ReviewedUtc.Should().Be(new DateTime(2026, 4, 2, 0, 0, 0, DateTimeKind.Utc));
    }

    [SkippableFact]
    public async Task GetByRunId_orders_descending_by_RequestedUtc()
    {
        SkipIfSqlServerUnavailable();
        IGovernanceApprovalRequestRepository repo = CreateRepository();
        string runId = Guid.NewGuid().ToString("N");
        DateTime older = new(2026, 4, 1, 10, 0, 0, DateTimeKind.Utc);
        DateTime newer = new(2026, 4, 1, 11, 0, 0, DateTimeKind.Utc);

        await repo.CreateAsync(NewApproval("apr-old", runId, older), CancellationToken.None);
        await repo.CreateAsync(NewApproval("apr-new", runId, newer), CancellationToken.None);

        IReadOnlyList<GovernanceApprovalRequest> list = await repo.GetByRunIdAsync(runId, CancellationToken.None);

        list.Should().HaveCount(2);
        list[0].ApprovalRequestId.Should().Be("apr-new");
        list[1].ApprovalRequestId.Should().Be("apr-old");
    }

    [SkippableFact]
    public async Task GetPendingAsync_returns_draft_and_submitted_ordered_by_RequestedUtc_desc()
    {
        SkipIfSqlServerUnavailable();
        IGovernanceApprovalRequestRepository repo = CreateRepository();
        string runId = Guid.NewGuid().ToString("N");
        DateTime older = new(2026, 4, 1, 10, 0, 0, DateTimeKind.Utc);
        DateTime newer = new(2026, 4, 1, 11, 0, 0, DateTimeKind.Utc);

        GovernanceApprovalRequest draftOld = NewApproval("apr-draft-old", runId, older);
        draftOld.Status = GovernanceApprovalStatus.Draft;
        await repo.CreateAsync(draftOld, CancellationToken.None);

        await repo.CreateAsync(NewApproval("apr-sub-new", runId, newer), CancellationToken.None);

        IReadOnlyList<GovernanceApprovalRequest> pending = await repo.GetPendingAsync(50, CancellationToken.None);

        pending.Should().HaveCount(2);
        pending[0].ApprovalRequestId.Should().Be("apr-sub-new");
        pending[1].ApprovalRequestId.Should().Be("apr-draft-old");
    }

    [SkippableFact]
    public async Task GetPendingAsync_respects_maxRows()
    {
        SkipIfSqlServerUnavailable();
        IGovernanceApprovalRequestRepository repo = CreateRepository();
        string runId = Guid.NewGuid().ToString("N");
        DateTime t1 = new(2026, 4, 1, 10, 0, 0, DateTimeKind.Utc);
        DateTime t2 = new(2026, 4, 1, 11, 0, 0, DateTimeKind.Utc);
        DateTime t3 = new(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc);

        await repo.CreateAsync(NewApproval("apr-a", runId, t1), CancellationToken.None);
        await repo.CreateAsync(NewApproval("apr-b", runId, t2), CancellationToken.None);
        await repo.CreateAsync(NewApproval("apr-c", runId, t3), CancellationToken.None);

        IReadOnlyList<GovernanceApprovalRequest> pending = await repo.GetPendingAsync(2, CancellationToken.None);

        pending.Should().HaveCount(2);
        pending[0].ApprovalRequestId.Should().Be("apr-c");
        pending[1].ApprovalRequestId.Should().Be("apr-b");
    }

    [SkippableFact]
    public async Task GetRecentDecisionsAsync_orders_by_ReviewedUtc_desc_and_excludes_pending()
    {
        SkipIfSqlServerUnavailable();
        IGovernanceApprovalRequestRepository repo = CreateRepository();
        string runId = Guid.NewGuid().ToString("N");
        DateTime requested = new(2026, 4, 1, 9, 0, 0, DateTimeKind.Utc);
        DateTime reviewedOlder = new(2026, 4, 2, 10, 0, 0, DateTimeKind.Utc);
        DateTime reviewedNewer = new(2026, 4, 2, 12, 0, 0, DateTimeKind.Utc);

        GovernanceApprovalRequest approved = NewApproval("apr-apr", runId, requested);
        approved.Status = GovernanceApprovalStatus.Approved;
        approved.ReviewedBy = "r1";
        approved.ReviewedUtc = reviewedOlder;
        await repo.CreateAsync(approved, CancellationToken.None);

        GovernanceApprovalRequest rejected = NewApproval("apr-rej", runId, requested);
        rejected.Status = GovernanceApprovalStatus.Rejected;
        rejected.ReviewedBy = "r2";
        rejected.ReviewedUtc = reviewedNewer;
        await repo.CreateAsync(rejected, CancellationToken.None);

        await repo.CreateAsync(NewApproval("apr-still-open", runId, requested), CancellationToken.None);

        IReadOnlyList<GovernanceApprovalRequest> decisions = await repo.GetRecentDecisionsAsync(50, CancellationToken.None);

        decisions.Should().HaveCount(2);
        decisions[0].ApprovalRequestId.Should().Be("apr-rej");
        decisions[1].ApprovalRequestId.Should().Be("apr-apr");
    }

    private static GovernanceApprovalRequest NewApproval(string approvalId, string runId, DateTime requestedUtc)
    {
        return new GovernanceApprovalRequest
        {
            ApprovalRequestId = approvalId,
            RunId = runId,
            ManifestVersion = "v1",
            SourceEnvironment = GovernanceEnvironment.Dev,
            TargetEnvironment = GovernanceEnvironment.Test,
            Status = GovernanceApprovalStatus.Submitted,
            RequestedBy = "alice",
            RequestedUtc = requestedUtc,
        };
    }
}
