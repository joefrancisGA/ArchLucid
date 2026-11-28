using System.Security.Cryptography;
using System.Text;

using ArchLucid.Application.Analysis;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>Admits snapshot-bound analysis and resumes it without refreshing its absolute deadline.</summary>
public sealed class SecureNowAnalysisDurableRecovery(
    ISecureNowAnalysisRecoveryJobs jobs, IAnalysisRecoveryRepository checkpoints,
    IOptionsMonitor<AnalysisStageExecutionOptions> options, TimeProvider clock,
    ILogger<SecureNowAnalysisDurableRecovery> logger, IAuditRepository? dependencyAudit = null,
    IArchLucidUnitOfWorkFactory? transactions = null)
{
    private static readonly string Version = Convert.ToHexString(SHA256.HashData(
        Encoding.UTF8.GetBytes($"securenow-recovery-v1:{typeof(SecureNowAnalysisDurableRecovery).Module.ModuleVersionId:D}")));

    private static readonly string DependencyVersion = AnalysisDependencyFingerprint.Digest(new { Version, Schema = 2 });

    private static readonly string GraphVersion = AnalysisDependencyFingerprint.Digest(new
    {
        Version, Prelude = AnalysisDependencyGraphs.SecurePrelude.Version,
        Full = AnalysisDependencyGraphs.SecureFull.Version, Carry = AnalysisDependencyGraphs.SecureCarry.Version,
    });

    private static string SelectedVersion(AnalysisStageExecutionOptions policy) =>
        !policy.EnableDependencyAwareAnalysisReuse ? Version
        : policy.EnableAnalyticalDependencyGraph ? GraphVersion : DependencyVersion;

    internal SecureNowAnalysisRecoveryAdmission? PrepareAdmission(bool fullRecompute)
    {
        AnalysisStageExecutionOptions policy = options.CurrentValue;

        return policy.EnableDurableSecureNowRecovery
            ? new SecureNowAnalysisRecoveryAdmission(SelectedVersion(policy), fullRecompute, (int)policy.GetSecureNowRunTimeout().TotalSeconds)
            : null;
    }

    internal async Task<SecureNowAnalysisRecoveryJob> AdmitAsync(
        ScopeContext scope, Guid snapshotId, string? subscriptionId, bool fullRecompute, CancellationToken ct)
    {
        DateTime admittedUtc = clock.UtcNowDateTime();
        AnalysisStageExecutionOptions policy = options.CurrentValue;

        return await jobs.AdmitAsync(ProjectScopeKey.From(scope), snapshotId, subscriptionId, fullRecompute, SelectedVersion(policy),
            admittedUtc, admittedUtc + policy.GetSecureNowRunTimeout(), ct);
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
                    bool useGraph = string.Equals(GraphVersion, job.InputVersion, StringComparison.Ordinal);
                    bool versioned = useGraph || string.Equals(DependencyVersion, job.InputVersion, StringComparison.Ordinal);

                    if (useGraph && (dependencyAudit is null || transactions is null))
                        throw new AnalysisDependencyRejectionException("securenow.job", "dependency_provider_unavailable");

                    if (!versioned && !string.Equals(Version, job.InputVersion, StringComparison.Ordinal))
                        throw new AnalysisStageExecutionException("securenow.job", AnalysisStageOutcome.Failed);

                    admissionBudget.EnsureCanContinue("securenow.job");
                    using AnalysisExecutionBudget budget = new(policy, clock,
                        job.DeadlineUtc - clock.UtcNowDateTime(), lease.Token);
                    budget.RecoverySession = new SecureNowRecoverySession(checkpoints, job, policy.RecoveryMaxAttempts,
                        clock, logger, caller, versioned, useGraph,
                        versioned && policy.ObserveAnalyticalDependencyGraph, dependencyAudit, transactions);
                    using IDisposable fence = lease.EnterSqlFence(job.AdmittedUtc);
                    await execute(budget, lease.Token);
                    budget.EnsureCanContinue("securenow.job");
                    string reference = budget.RecoverySession.Receipt is { } receipt
                        ? System.Text.Json.JsonSerializer.Serialize(receipt) : job.SnapshotId.ToString("D");
                    await budget.RecoverySession.CompleteJobAsync(lease, key, reference);
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
