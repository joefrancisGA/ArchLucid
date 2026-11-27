using System.Security.Cryptography;
using System.Text;

using ArchLucid.Application.Analysis;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>Admits snapshot-bound analysis and resumes it without refreshing its absolute deadline.</summary>
public sealed class SecureNowAnalysisDurableRecovery(
    ISecureNowAnalysisRecoveryJobs jobs, IAnalysisRecoveryRepository checkpoints,
    IOptionsMonitor<AnalysisStageExecutionOptions> options, TimeProvider clock,
    ILogger<SecureNowAnalysisDurableRecovery> logger)
{
    private static readonly string Version = Convert.ToHexString(SHA256.HashData(
        Encoding.UTF8.GetBytes($"securenow-recovery-v1:{typeof(SecureNowAnalysisDurableRecovery).Module.ModuleVersionId:D}")));

    internal SecureNowAnalysisRecoveryAdmission? PrepareAdmission(bool fullRecompute)
    {
        AnalysisStageExecutionOptions policy = options.CurrentValue;

        return policy.EnableDurableSecureNowRecovery
            ? new SecureNowAnalysisRecoveryAdmission(Version, fullRecompute, (int)policy.GetSecureNowRunTimeout().TotalSeconds)
            : null;
    }

    internal async Task<SecureNowAnalysisRecoveryJob> AdmitAsync(
        ScopeContext scope, Guid snapshotId, string? subscriptionId, bool fullRecompute, CancellationToken ct)
    {
        DateTime admittedUtc = clock.UtcNowDateTime();

        return await jobs.AdmitAsync(ProjectScopeKey.From(scope), snapshotId, subscriptionId, fullRecompute, Version,
            admittedUtc, admittedUtc + options.CurrentValue.GetSecureNowRunTimeout(), ct);
    }

    internal async Task ExecuteAsync(SecureNowAnalysisRecoveryJob job,
        Func<AnalysisExecutionBudget, CancellationToken, Task> execute, CancellationToken caller)
    {
        if (job.Outcome is { } outcome)
        {
            if (outcome != AnalysisStageOutcome.Succeeded)
                throw new AnalysisStageExecutionException("securenow.job", outcome);

            return;
        }

        AnalysisRecoveryStageKey key = new(SecureNowRecoverySession.Scope(job), "securenow", job.SnapshotId, "job");
        AnalysisRecoveryClaim? prior = await checkpoints.ReadAsync(key, caller);

        if (prior is { State: "succeeded" })
        {
            await jobs.RecordOutcomeAsync(job, AnalysisStageOutcome.Succeeded, caller);

            return;
        }

        TimeSpan remaining = job.DeadlineUtc - clock.UtcNowDateTime();

        if (remaining <= TimeSpan.Zero)
        {
            await jobs.RecordOutcomeAsync(job, AnalysisStageOutcome.TimedOut, caller);
            throw new AnalysisStageExecutionException("securenow.job", AnalysisStageOutcome.TimedOut);
        }

        AnalysisStageExecutionOptions policy = options.CurrentValue;
        using AnalysisExecutionBudget admissionBudget = new(policy, clock, remaining, caller);
        AnalysisRecoveryLease lease;

        try
        {
            lease = await AnalysisRecoveryLease.AcquireAsync(checkpoints, key, job.InputVersion,
                policy.RecoveryMaxAttempts, clock, admissionBudget.Token);
        }
        catch (AnalysisStageExecutionException ex) when (ex.Outcome == AnalysisStageOutcome.RetryExhausted)
        {
            await jobs.RecordOutcomeAsync(job, AnalysisStageOutcome.RetryExhausted, caller);
            throw;
        }

        await using (lease)
        {
            if (!lease.IsComplete)
            {
                try
                {
                    if (!string.Equals(Version, job.InputVersion, StringComparison.Ordinal))
                        throw new AnalysisStageExecutionException("securenow.job", AnalysisStageOutcome.Failed);

                    admissionBudget.EnsureCanContinue("securenow.job");
                    using AnalysisExecutionBudget budget = new(policy, clock,
                        job.DeadlineUtc - clock.UtcNowDateTime(), lease.Token);
                    budget.RecoverySession = new SecureNowRecoverySession(checkpoints, job, policy.RecoveryMaxAttempts,
                        clock, logger, caller);
                    using IDisposable fence = lease.EnterSqlFence(job.AdmittedUtc);
                    await execute(budget, lease.Token);
                    budget.EnsureCanContinue("securenow.job");
                    await lease.CompleteAsync(job.SnapshotId.ToString("D"), null, lease.Token);
                }
                catch (Exception ex)
                {
                    using CancellationTokenSource cleanup = new(TimeSpan.FromSeconds(5), clock);
                    bool interrupted = caller.IsCancellationRequested;
                    Exception failure = !admissionBudget.IsExpired && !interrupted && lease.Token.IsCancellationRequested
                        ? new AnalysisRecoveryLeaseLostException(key.Stage) : ex;
                    await lease.ReleaseAfterFailureAsync(failure, interrupted);

                    if (!interrupted && !(failure is AnalysisRecoveryLeaseLostException || SqlTransientDetector.IsTransient(failure)))
                    {
                        string terminalOutcome = admissionBudget.IsExpired ? AnalysisStageOutcome.TimedOut
                            : failure is AnalysisStageExecutionException stageFailure &&
                              stageFailure.Outcome is AnalysisStageOutcome.TimedOut or AnalysisStageOutcome.RetryExhausted
                                ? stageFailure.Outcome : AnalysisStageOutcome.Failed;
                        await jobs.RecordOutcomeAsync(job, terminalOutcome, cleanup.Token);
                    }

                    throw;
                }
            }

            await jobs.RecordOutcomeAsync(job, AnalysisStageOutcome.Succeeded, caller);
        }
    }
}
