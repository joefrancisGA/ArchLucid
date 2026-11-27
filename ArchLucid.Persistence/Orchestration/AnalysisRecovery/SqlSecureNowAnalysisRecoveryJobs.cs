using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Orchestration.AnalysisRecovery;

/// <summary>Queue of immutable post-materialization admissions in the tenant catalog.</summary>
public sealed class SqlSecureNowAnalysisRecoveryJobs(ISqlConnectionFactory factory, IScopeContextProvider scopeProvider)
    : ISecureNowAnalysisRecoveryJobs
{
    private const string Key = """
        TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND ProjectId = @ProjectId AND SnapshotId = @SnapshotId
        """;

    public async Task<SecureNowAnalysisRecoveryJob> AdmitAsync(
        ProjectScopeKey scope, Guid snapshotId, string? subscriptionId, bool fullRecompute, string inputVersion,
        DateTime admittedUtc, DateTime deadlineUtc, CancellationToken ct)
    {
        DemandScope(scope);
        await using SqlConnection db = await factory.CreateOpenConnectionAsync(ct);
        await using SqlTransaction tx = (SqlTransaction)await db.BeginTransactionAsync(ct);
        const string sql = $"""
            IF NOT EXISTS (SELECT 1 FROM dbo.SecureNowAnalysisRecoveryJobs WITH (UPDLOCK, HOLDLOCK) WHERE {Key})
                INSERT dbo.SecureNowAnalysisRecoveryJobs
                    (TenantId, WorkspaceId, ProjectId, SnapshotId, SubscriptionId, FullRecompute,
                     InputVersion, AdmittedUtc, DeadlineUtc)
                VALUES (@TenantId, @WorkspaceId, @ProjectId, @SnapshotId, @SubscriptionId, @FullRecompute,
                        @InputVersion, @AdmittedUtc, @DeadlineUtc);
            SELECT * FROM dbo.SecureNowAnalysisRecoveryJobs WHERE {Key};
            """;
        SecureNowAnalysisRecoveryJob job = await db.QuerySingleAsync<SecureNowAnalysisRecoveryJob>(
            new CommandDefinition(sql, new
            {
                scope.TenantId, scope.WorkspaceId, scope.ProjectId, SnapshotId = snapshotId,
                SubscriptionId = subscriptionId, FullRecompute = fullRecompute,
                InputVersion = inputVersion, AdmittedUtc = admittedUtc, DeadlineUtc = deadlineUtc
            }, tx, cancellationToken: ct));
        await tx.CommitAsync(ct);

        return job;
    }

    // Scheduled infrastructure alone enumerates opaque admissions within the active tenant.
    [TenantScopeExempt(TenantScopeExemptReason.Operational,
        "Lists admitted jobs within the selected active tenant catalog; each job is rebound to its saved project before execution.")]
    public async Task<IReadOnlyList<SecureNowAnalysisRecoveryJob>> ListPendingAsync(Guid tenantId, CancellationToken ct)
    {
        if (tenantId == Guid.Empty || scopeProvider.GetCurrentScope().TenantId != tenantId)
            throw new InvalidOperationException("SecureNow recovery requires the selected tenant catalog.");

        await using SqlConnection db = await factory.CreateOpenConnectionAsync(ct);
        const string sql = """
            SELECT TOP (4) j.*
            FROM dbo.SecureNowAnalysisRecoveryJobs j
            LEFT JOIN dbo.AnalysisStageRecovery claim
              ON claim.TenantId = j.TenantId AND claim.WorkspaceId = j.WorkspaceId AND claim.ProjectId = j.ProjectId
             AND claim.Pipeline = N'securenow' AND claim.RunId = j.SnapshotId AND claim.Stage = N'job'
            WHERE j.TenantId = @TenantId AND j.Outcome IS NULL
              AND (claim.LeaseUntilUtc IS NULL OR claim.LeaseUntilUtc <= SYSUTCDATETIME())
            ORDER BY j.AdmittedUtc, j.SnapshotId;
            """;

        return (await db.QueryAsync<SecureNowAnalysisRecoveryJob>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: ct))).AsList();
    }

    public async Task RecordOutcomeAsync(SecureNowAnalysisRecoveryJob job, string outcome, CancellationToken ct)
    {
        ProjectScopeKey scope = ProjectScopeKey.Create(job.TenantId, job.WorkspaceId, job.ProjectId);
        DemandScope(scope);
        await using SqlConnection db = await factory.CreateOpenConnectionAsync(ct);
        const string sql = $"""
            UPDATE dbo.SecureNowAnalysisRecoveryJobs SET Outcome = @Outcome
             WHERE {Key} AND Outcome IS NULL
               AND ((@Outcome = N'timed_out' AND DeadlineUtc <= SYSUTCDATETIME())
                OR EXISTS (SELECT 1 FROM dbo.AnalysisStageRecovery
                   WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND ProjectId = @ProjectId
                     AND RunId = @SnapshotId AND Pipeline = N'securenow' AND Stage = N'job'
                     AND State = CASE WHEN @Outcome = N'succeeded' THEN N'succeeded' ELSE N'failed' END));
            """;
        await db.ExecuteAsync(new CommandDefinition(sql, new
        {
            job.TenantId, job.WorkspaceId, job.ProjectId, job.SnapshotId, Outcome = outcome
        }, cancellationToken: ct));
    }

    private void DemandScope(ProjectScopeKey scope)
    {
        ScopeContext active = scopeProvider.GetCurrentScope();

        if (!scope.Matches(active.TenantId, active.WorkspaceId, active.ProjectId))
            throw new InvalidOperationException("SecureNow recovery requires the active project scope.");
    }
}
