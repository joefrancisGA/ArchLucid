using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;
using ArchLucid.Persistence.Transactions;

using Dapper;

using Microsoft.Data.SqlClient;

using Moq;

namespace ArchLucid.Persistence.Tests.Orchestration.AnalysisRecovery;

[Trait("Category", "Integration")]
[Collection(nameof(SqlServerPersistenceCollection))]
public sealed class SqlAnalysisRecoveryRepositoryTests(SqlServerPersistenceFixture fixture)
{
    private const string Version = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

    [SkippableFact]
    public async Task Concurrent_claims_fence_old_workers_and_roll_back_checkpoint_with_output()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        ISqlConnectionFactory factory = new SqlConnectionFactory(fixture.ConnectionString);
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        Mock<IScopeContextProvider> scopes = new();
        scopes.Setup(p => p.GetCurrentScope()).Returns(scope);
        SqlAnalysisRecoveryRepository first = new(factory, scopes.Object);
        SqlAnalysisRecoveryRepository second = new(factory, scopes.Object);
        AnalysisRecoveryStageKey key = new(ProjectScopeKey.From(scope), "authority", Guid.NewGuid(), "graph");
        Guid workerA = Guid.NewGuid();
        Guid workerB = Guid.NewGuid();
        CancellationToken ct = CancellationToken.None;

        AnalysisRecoveryClaim[] contenders = await Task.WhenAll(first.ClaimAsync(key, Version, workerA, 30, 3, ct),
            second.ClaimAsync(key, Version, workerB, 30, 3, ct));
        AnalysisRecoveryClaim initial = contenders[0];
        Guid previous = Assert.IsType<Guid>(initial.Owner);
        Guid replacement = previous == workerA ? workerB : workerA;

        Assert.All(contenders, c => Assert.Equal(previous, c.Owner));
        Assert.Equal(1, initial.Attempts);
        Assert.True(await first.RenewAsync(key, previous, initial.Fence, 30, ct));

        await using SqlConnection db = await factory.CreateOpenConnectionAsync(ct);
        await db.ExecuteAsync(new CommandDefinition("""
            UPDATE dbo.AnalysisStageRecovery SET LeaseUntilUtc = DATEADD(second, -1, SYSUTCDATETIME())
            WHERE TenantId=@TenantId AND WorkspaceId=@WorkspaceId AND ProjectId=@ProjectId
              AND RunId=@RunId AND Pipeline=@Pipeline AND Stage=@Stage;
            """, new { scope.TenantId, scope.WorkspaceId, scope.ProjectId, key.RunId, key.Pipeline, key.Stage },
            cancellationToken: ct));

        AnalysisRecoveryClaim reclaimed = await second.ClaimAsync(key, Version, replacement, 30, 3, ct);
        Assert.Equal(2, reclaimed.Attempts);
        Assert.True(reclaimed.Fence > initial.Fence);
        Assert.False(await first.CompleteAsync(key, previous, initial.Fence, "stale", null, ct));

        await using (DapperArchLucidUnitOfWork uow = new(db, db.BeginTransaction()))
        {
            using (AnalysisRecoveryFenceContext.Enter(key, previous, initial.Fence, null))
            {
                await Assert.ThrowsAsync<InvalidOperationException>(() =>
                    SqlAnalysisRecoveryFence.DemandAsync(uow.Connection, uow.Transaction,
                        scope.TenantId, scope.WorkspaceId, scope.ProjectId, ct));
            }

            Assert.True(await second.CompleteAsync(key, replacement, reclaimed.Fence, "rolled-back-output", uow, ct));
            await uow.RollbackAsync(ct);
        }

        AnalysisRecoveryClaim? running = await first.ReadAsync(key, ct);
        Assert.NotNull(running);
        Assert.Equal("running", running.State);
        Assert.True(await second.CompleteAsync(key, replacement, reclaimed.Fence, "committed-output", null, ct));
        AnalysisRecoveryClaim replay = await first.ClaimAsync(key, Version, workerA, 30, 3, ct);
        Assert.Equal("succeeded", replay.State);
        Assert.Equal(2, replay.Attempts);
        Assert.Equal("committed-output", replay.ResultReference);

        scopes.Setup(p => p.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ProjectId = Guid.NewGuid()
        });
        await Assert.ThrowsAsync<InvalidOperationException>(() => first.ReadAsync(key, ct));
    }

    [SkippableFact]
    public async Task SecureNow_admission_keeps_its_plan_and_deadline_and_closes_only_after_owned_completion()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        ISqlConnectionFactory factory = new SqlConnectionFactory(fixture.ConnectionString);
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        Mock<IScopeContextProvider> scopes = new();
        scopes.Setup(p => p.GetCurrentScope()).Returns(scope);
        SqlSecureNowAnalysisRecoveryJobs jobs = new(factory, scopes.Object);
        SqlAnalysisRecoveryRepository stages = new(factory, scopes.Object);
        Guid snapshot = Guid.NewGuid();
        ProjectScopeKey project = ProjectScopeKey.From(scope);
        DateTime admittedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;
        DateTime deadline = admittedUtc.AddMinutes(15);
        CancellationToken ct = CancellationToken.None;

        SecureNowAnalysisRecoveryJob job = await jobs.AdmitAsync(project, snapshot, "original", false, Version,
            admittedUtc, deadline, ct);
        SecureNowAnalysisRecoveryJob redelivery = await jobs.AdmitAsync(project, snapshot, "different", true, Version,
            admittedUtc.AddMinutes(1), deadline.AddMinutes(15), ct);
        Assert.Equal(job.DeadlineUtc, redelivery.DeadlineUtc);
        Assert.False(redelivery.FullRecompute);
        Assert.Equal("original", redelivery.SubscriptionId);
        await jobs.RecordOutcomeAsync(job, "succeeded", ct);
        Assert.Single(await jobs.ListPendingAsync(scope.TenantId, ct));

        AnalysisRecoveryStageKey key = new(project, "securenow", snapshot, "job");
        Guid owner = Guid.NewGuid();
        AnalysisRecoveryClaim claim = await stages.ClaimAsync(key, Version, owner, 30, 3, ct);
        Assert.Empty(await jobs.ListPendingAsync(scope.TenantId, ct));
        Assert.True(await stages.CompleteAsync(key, owner, claim.Fence, snapshot.ToString("D"), null, ct));
        await jobs.RecordOutcomeAsync(job, "succeeded", ct);
        Assert.Empty(await jobs.ListPendingAsync(scope.TenantId, ct));
    }

    [SkippableFact]
    public async Task Scoped_admission_read_does_not_create_jobs_and_terminal_reasons_are_fenced()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        ISqlConnectionFactory factory = new SqlConnectionFactory(fixture.ConnectionString);
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        Mock<IScopeContextProvider> scopes = new();
        scopes.Setup(p => p.GetCurrentScope()).Returns(scope);
        SqlSecureNowAnalysisRecoveryJobs jobs = new(factory, scopes.Object);
        SqlAnalysisRecoveryRepository stages = new(factory, scopes.Object);
        ProjectScopeKey project = ProjectScopeKey.From(scope);
        Guid snapshot = Guid.NewGuid();
        DateTime now = TimeProvider.System.GetUtcNow().UtcDateTime;
        CancellationToken ct = CancellationToken.None;
        Assert.Null(await jobs.TryGetAsync(project, snapshot, ct));

        SecureNowAnalysisRecoveryJob job = await jobs.AdmitAsync(project, snapshot, null, true, Version, now, now.AddMinutes(5), ct);
        Assert.Equal(snapshot, (await jobs.TryGetAsync(project, snapshot, ct))?.SnapshotId);

        AnalysisRecoveryStageKey key = new(project, "securenow", snapshot, "job");
        Guid owner = Guid.NewGuid();
        AnalysisRecoveryClaim current = await stages.ClaimAsync(key, Version, owner, 30, 3, ct);
        Assert.False(await stages.ReleaseWithCoverageReasonAsync(key, Guid.NewGuid(), current.Fence, "incomplete_path_coverage", ct));
        Assert.True(await stages.ReleaseWithCoverageReasonAsync(key, owner, current.Fence, "incomplete_path_coverage", ct));
        await jobs.RecordOutcomeAsync(job, "failed", ct);

        Assert.Equal("failed", (await jobs.TryGetAsync(project, snapshot, ct))?.Outcome);
        AnalysisRecoveryClaim? closed = await stages.ReadAsync(key, ct);
        Assert.Equal("failed", closed?.State);
        Assert.Null(closed?.ResultReference);
        Assert.Equal("incomplete_path_coverage", closed?.CoverageReason);
        scopes.Setup(p => p.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ProjectId = Guid.NewGuid(),
        });
        await Assert.ThrowsAsync<InvalidOperationException>(() => jobs.TryGetAsync(project, snapshot, ct));
    }
}
