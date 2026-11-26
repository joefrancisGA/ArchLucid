using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Data.Repositories;

using ArchLucid.Core.Scoping;
namespace ArchLucid.Persistence.Tests.Contracts;
[Trait("Category", "Unit")]

/// <summary>
///     Shared contract assertions for <see cref="IGovernanceApprovalRequestRepository" />.
/// </summary>
public abstract class GovernanceApprovalRequestRepositoryContractTests
{
    protected virtual void SkipIfSqlServerUnavailable()
    {
    }

    protected abstract IGovernanceApprovalRequestRepository CreateRepository();

    // Pending and recent-decision queries intentionally have no per-test run or project filter.
    protected virtual Task<IGovernanceApprovalRequestRepository> CreateGlobalQueryRepositoryAsync() =>
        Task.FromResult(CreateRepository());

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
        GovernanceApprovalRequest item = NewApproval(approvalId, runId, TimeProvider.System.UtcNowDateTime());

        await repo.CreateAsync(item, CancellationToken.None);

        item.Status = GovernanceApprovalStatus.Approved;
        item.ReviewedBy = "reviewer";
        item.ReviewedUtc = new DateTime(2026, 4, 2, 0, 0, 0, DateTimeKind.Utc);

        await repo.UpdateAsync(item, CancellationToken.None);

        GovernanceApprovalRequest? loaded = await repo.GetByIdAsync(approvalId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded.Status.Should().Be(GovernanceApprovalStatus.Approved);
        loaded.ReviewedBy.Should().Be("reviewer");
        loaded.ReviewedUtc.Should().NotBeNull();

        // SqlClient maps datetime2 to DateTimeKind.Unspecified; compare the instant, not Kind.
        DateTime expectedReviewed = new(2026, 4, 2, 0, 0, 0, DateTimeKind.Utc);
        loaded.ReviewedUtc!.Value.Should().BeCloseTo(expectedReviewed, TimeSpan.FromSeconds(1));
    }

    [SkippableFact]
    public async Task TryTransitionFromReviewableAsync_second_approve_returns_false()
    {
        SkipIfSqlServerUnavailable();
        IGovernanceApprovalRequestRepository repo = CreateRepository();
        string runId = Guid.NewGuid().ToString("N");
        string approvalId = "apr-try-" + Guid.NewGuid().ToString("N");
        GovernanceApprovalRequest item = NewApproval(approvalId, runId, TimeProvider.System.UtcNowDateTime());

        await repo.CreateAsync(item, CancellationToken.None);

        DateTime reviewedUtc = new(2026, 4, 3, 12, 0, 0, DateTimeKind.Utc);

        bool first = await repo.TryTransitionFromReviewableAsync(
            approvalId,
            GovernanceApprovalStatus.Approved,
            "r1",
            "r1",
            "ok",
            reviewedUtc,
            CancellationToken.None);

        bool second = await repo.TryTransitionFromReviewableAsync(
            approvalId,
            GovernanceApprovalStatus.Approved,
            "r2",
            "r2",
            "dup",
            reviewedUtc.AddMinutes(1),
            CancellationToken.None);

        first.Should().BeTrue();
        second.Should().BeFalse();

        GovernanceApprovalRequest? loaded = await repo.GetByIdAsync(approvalId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded.Status.Should().Be(GovernanceApprovalStatus.Approved);
        loaded.ReviewedBy.Should().Be("r1");
        loaded.ReviewComment.Should().Be("ok");
    }

    [SkippableFact]
    public async Task TryTransitionFromReviewableAsync_parallel_approves_only_one_wins()
    {
        SkipIfSqlServerUnavailable();
        IGovernanceApprovalRequestRepository repo = CreateRepository();
        string runId = Guid.NewGuid().ToString("N");
        string approvalId = "apr-par-" + Guid.NewGuid().ToString("N");
        GovernanceApprovalRequest item = NewApproval(approvalId, runId, TimeProvider.System.UtcNowDateTime());

        await repo.CreateAsync(item, CancellationToken.None);

        DateTime reviewedUtc = new(2026, 4, 10, 12, 0, 0, DateTimeKind.Utc);
        const int parallel = 32;
        Task<bool>[] tasks = new Task<bool>[parallel];

        for (int i = 0; i < parallel; i++)
        {
            int reviewerIndex = i;
            tasks[i] = repo.TryTransitionFromReviewableAsync(
                approvalId,
                GovernanceApprovalStatus.Approved,
                $"r{reviewerIndex}",
                $"r{reviewerIndex}",
                "parallel",
                reviewedUtc.AddTicks(reviewerIndex),
                CancellationToken.None);
        }

        bool[] outcomes = await Task.WhenAll(tasks);
        int wins = outcomes.Count(static b => b);

        wins.Should().Be(1);

        GovernanceApprovalRequest? loaded = await repo.GetByIdAsync(approvalId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded.Status.Should().Be(GovernanceApprovalStatus.Approved);
    }

    [SkippableFact]
    public async Task GetByRunId_orders_descending_by_RequestedUtc()
    {
        SkipIfSqlServerUnavailable();
        IGovernanceApprovalRequestRepository repo = CreateRepository();
        string runId = Guid.NewGuid().ToString("N");
        string idOld = "apr-run-old-" + Guid.NewGuid().ToString("N");
        string idNew = "apr-run-new-" + Guid.NewGuid().ToString("N");
        // Distinct sub-ms instants at the DATETIME2 ceiling — avoids unstable ORDER BY vs legacy rows or ms-collisions.
        DateTime newer = DateTime.MaxValue.AddTicks(-2);
        DateTime older = DateTime.MaxValue.AddTicks(-4);

        await repo.CreateAsync(NewApproval(idOld, runId, older), CancellationToken.None);
        await repo.CreateAsync(NewApproval(idNew, runId, newer), CancellationToken.None);

        IReadOnlyList<GovernanceApprovalRequest> list = await repo.GetByRunIdAsync(runId, CancellationToken.None);

        GovernanceApprovalRequest[] ours =
        [
            .. list.Where(r =>
                string.Equals(r.ApprovalRequestId, idNew, StringComparison.Ordinal)
                || string.Equals(r.ApprovalRequestId, idOld, StringComparison.Ordinal))
        ];

        ours.Should().HaveCount(2);
        ours[0].ApprovalRequestId.Should().Be(idNew);
        ours[1].ApprovalRequestId.Should().Be(idOld);
    }

    [SkippableFact]
    public async Task GetPendingAsync_returns_draft_and_submitted_ordered_by_RequestedUtc_desc()
    {
        SkipIfSqlServerUnavailable();
        IGovernanceApprovalRequestRepository repo = await CreateGlobalQueryRepositoryAsync();
        string runId = Guid.NewGuid().ToString("N");
        string idDraft = "apr-pend-draft-" + Guid.NewGuid().ToString("N");
        string idSubmitted = "apr-pend-sub-" + Guid.NewGuid().ToString("N");
        DateTime older = new(2026, 4, 1, 9, 0, 0, DateTimeKind.Utc);
        DateTime newer = older.AddHours(1);

        GovernanceApprovalRequest draftOld = NewApproval(idDraft, runId, older);
        draftOld.Status = GovernanceApprovalStatus.Draft;
        await repo.CreateAsync(draftOld, CancellationToken.None);

        await repo.CreateAsync(NewApproval(idSubmitted, runId, newer), CancellationToken.None);

        IReadOnlyList<GovernanceApprovalRequest> pending = await repo.GetPendingAsync(50, CancellationToken.None);

        pending.Select(r => r.ApprovalRequestId).Should().Equal(idSubmitted, idDraft);
    }

    [SkippableFact]
    public async Task GetPendingAsync_respects_maxRows()
    {
        SkipIfSqlServerUnavailable();
        IGovernanceApprovalRequestRepository repo = await CreateGlobalQueryRepositoryAsync();
        string runId = Guid.NewGuid().ToString("N");
        string idA = "apr-max-a-" + Guid.NewGuid().ToString("N");
        string idB = "apr-max-b-" + Guid.NewGuid().ToString("N");
        string idC = "apr-max-c-" + Guid.NewGuid().ToString("N");
        DateTime t1 = new(2026, 4, 1, 8, 0, 0, DateTimeKind.Utc);
        DateTime t2 = t1.AddHours(1);
        DateTime t3 = t2.AddHours(1);

        await repo.CreateAsync(NewApproval(idA, runId, t1), CancellationToken.None);
        await repo.CreateAsync(NewApproval(idB, runId, t2), CancellationToken.None);
        await repo.CreateAsync(NewApproval(idC, runId, t3), CancellationToken.None);

        IReadOnlyList<GovernanceApprovalRequest> pending = await repo.GetPendingAsync(2, CancellationToken.None);

        pending.Should().HaveCount(2);
        pending[0].ApprovalRequestId.Should().Be(idC);
        pending[1].ApprovalRequestId.Should().Be(idB);
    }

    [SkippableFact]
    public async Task CountPendingApprovalsAsync_returns_uncapped_total()
    {
        SkipIfSqlServerUnavailable();
        IGovernanceApprovalRequestRepository repo = await CreateGlobalQueryRepositoryAsync();
        string runId = Guid.NewGuid().ToString("N");
        string idA = "apr-count-a-" + Guid.NewGuid().ToString("N");
        string idB = "apr-count-b-" + Guid.NewGuid().ToString("N");
        string idC = "apr-count-c-" + Guid.NewGuid().ToString("N");
        DateTime t3 = new DateTime(2030, 1, 3, 0, 0, 0, DateTimeKind.Utc);
        DateTime t2 = new DateTime(2030, 1, 2, 0, 0, 0, DateTimeKind.Utc);
        DateTime t1 = new DateTime(2030, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        await repo.CreateAsync(NewApproval(idA, runId, t1), CancellationToken.None);
        await repo.CreateAsync(NewApproval(idB, runId, t2), CancellationToken.None);
        await repo.CreateAsync(NewApproval(idC, runId, t3), CancellationToken.None);

        IReadOnlyList<GovernanceApprovalRequest> pending = await repo.GetPendingAsync(2, CancellationToken.None);
        long totalPending = await repo.CountPendingApprovalsAsync(CancellationToken.None);
        IReadOnlyList<GovernanceApprovalRequest> allPending =
            await repo.GetPendingAsync((int)totalPending, CancellationToken.None);

        pending.Should().HaveCount(2);
        totalPending.Should().Be(3);

        GovernanceApprovalRequest[] mine =
            [.. allPending.Where(r => r.RunId == runId)];

        mine.Should().Contain(r => r.ApprovalRequestId == idA);
        mine.Should().Contain(r => r.ApprovalRequestId == idB);
        mine.Should().Contain(r => r.ApprovalRequestId == idC);
    }

    [SkippableFact]
    public async Task GetRecentDecisionsAsync_orders_by_ReviewedUtc_desc_and_excludes_pending()
    {
        SkipIfSqlServerUnavailable();
        IGovernanceApprovalRequestRepository repo = await CreateGlobalQueryRepositoryAsync();
        string runId = Guid.NewGuid().ToString("N");
        string idApproved = "apr-apr-" + Guid.NewGuid().ToString("N");
        string idRejected = "apr-rej-" + Guid.NewGuid().ToString("N");
        string idPending = "apr-still-open-" + Guid.NewGuid().ToString("N");
        DateTime requested = new(2026, 4, 1, 9, 0, 0, DateTimeKind.Utc);
        DateTime reviewedOlder = requested.AddHours(1);
        DateTime reviewedNewer = requested.AddHours(2);

        GovernanceApprovalRequest approved = NewApproval(idApproved, runId, requested);
        approved.Status = GovernanceApprovalStatus.Approved;
        approved.ReviewedBy = "r1";
        approved.ReviewedUtc = reviewedOlder;
        await repo.CreateAsync(approved, CancellationToken.None);

        GovernanceApprovalRequest rejected = NewApproval(idRejected, runId, requested);
        rejected.Status = GovernanceApprovalStatus.Rejected;
        rejected.ReviewedBy = "r2";
        rejected.ReviewedUtc = reviewedNewer;
        await repo.CreateAsync(rejected, CancellationToken.None);

        await repo.CreateAsync(NewApproval(idPending, runId, requested), CancellationToken.None);

        IReadOnlyList<GovernanceApprovalRequest> decisions =
            await repo.GetRecentDecisionsAsync(50, CancellationToken.None);

        decisions.Select(r => r.ApprovalRequestId).Should().Equal(idRejected, idApproved);
    }

    private static GovernanceApprovalRequest NewApproval(string approvalId, string runId, DateTime requestedUtc)
    {
        return new GovernanceApprovalRequest
        {
            ApprovalRequestId = approvalId,
            RunId = runId,
            TenantId = GovernanceRepositoryContractScope.TenantId,
            WorkspaceId = GovernanceRepositoryContractScope.WorkspaceId,
            ProjectId = GovernanceRepositoryContractScope.ProjectId,
            ManifestVersion = "v1",
            SourceEnvironment = GovernanceEnvironment.Dev,
            TargetEnvironment = GovernanceEnvironment.Test,
            Status = GovernanceApprovalStatus.Submitted,
            RequestedBy = "alice",
            RequestedUtc = requestedUtc
        };
    }
}
