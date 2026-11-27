using System.Text.Json;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Analysis;

/// <summary>Recovers only named, replay-safe SQL units projected from a single pinned inventory admission.</summary>
internal sealed class SecureNowRecoverySession(
    IAnalysisRecoveryRepository checkpoints, SecureNowAnalysisRecoveryJob job, int maxAttempts,
    TimeProvider clock, ILogger logger, CancellationToken workerToken)
{
    public bool FullRecompute => job.FullRecompute;

    public static bool CanCheckpoint(string stage) => stage is
        "securenow.prior_snapshot" or "securenow.carry_forward" or "securenow.neighborhood.carry_forward" or
        "securenow.privilege" or "securenow.reachability" or "securenow.toxic" or "securenow.capability_flow" or
        "securenow.shared_control" or "securenow.drift" or "securenow.ranking" or "securenow.cut_point" or
        "securenow.routing" or "securenow.audit_readiness" or "securenow.neighborhood.audit";

    public async Task<T> ExecuteAsync<T>(string stage, Func<CancellationToken, Task<T>> work,
        Func<T, bool>? succeeded, CancellationToken upstream)
    {
        AnalysisRecoveryStageKey key = new(Scope(job), "securenow", job.SnapshotId, stage);
        bool safeReplay = stage is not ("securenow.audit_readiness" or "securenow.neighborhood.audit");
        await using AnalysisRecoveryLease lease = await AnalysisRecoveryLease.AcquireAsync(
            checkpoints, key, job.InputVersion, safeReplay ? maxAttempts : 1, clock, upstream);

        if (lease.IsComplete)
        {
            logger.LogInformation("Reused SecureNow analysis checkpoint. SnapshotId={SnapshotId} Stage={Stage}",
                job.SnapshotId, stage);

            return JsonSerializer.Deserialize<T>(lease.Claim.ResultReference!, AuditJsonSerializationOptions.Instance)!;
        }

        try
        {
            using IDisposable fence = lease.EnterSqlFence(job.AdmittedUtc);
            T result = await work(lease.Token);

            if (succeeded is not null && !succeeded(result))
                throw new AnalysisStageExecutionException(stage, AnalysisStageOutcome.Failed);

            string reference = JsonSerializer.Serialize(result, AuditJsonSerializationOptions.Instance);
            await lease.CompleteAsync(reference, null, lease.Token);

            return result;
        }
        catch (Exception ex)
        {
            Exception failure = !upstream.IsCancellationRequested && lease.Token.IsCancellationRequested
                ? new AnalysisRecoveryLeaseLostException(stage) : ex;

            try
            {
                await lease.ReleaseAfterFailureAsync(failure, workerToken.IsCancellationRequested, safeReplay);
            }
            catch (Exception releaseFailure)
            {
                logger.LogWarning(releaseFailure, "SecureNow stage cleanup deferred until lease expiry. Stage={Stage}", stage);
            }

            if (!ReferenceEquals(failure, ex))
                throw failure;

            throw;
        }
    }

    internal static ProjectScopeKey Scope(SecureNowAnalysisRecoveryJob job) =>
        ProjectScopeKey.Create(job.TenantId, job.WorkspaceId, job.ProjectId);
}
