using System.Text.Json;

using ArchLucid.Core.Scoping;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Analysis;

/// <summary>Recovers only named, replay-safe SQL units projected from a single pinned inventory admission.</summary>
internal sealed class SecureNowRecoverySession(
    IAnalysisRecoveryRepository checkpoints, SecureNowAnalysisRecoveryJob job, int maxAttempts,
    TimeProvider clock, ILogger logger, CancellationToken workerToken, bool versioned = false)
{
    private readonly Dictionary<string, string> _outputs = new(StringComparer.Ordinal);
    private string? _snapshot;
    private SecureNowDependencyVersions? _configuration;
    private string? _priorEvidence;
    public Guid? PriorSnapshotId { get; private set; }
    private string? _plan;
    public bool Versioned => versioned;
    public bool CompleteForCarryForward { get; private set; } = true;
    public SecureNowDependencyReceipt? Receipt { get; set; }

    public void BindSnapshot(string snapshot, SecureNowDependencyVersions configuration)
    {
        _snapshot = snapshot;
        _configuration = configuration;
    }

    public void BindPrior(Guid? id, string? evidence)
    {
        PriorSnapshotId = id;
        _priorEvidence = evidence;
    }

    public async Task<string> PinPlanAsync(string planInput, string decision, CancellationToken ct)
    {
        _plan = planInput;

        return await ExecuteAsync("securenow.reuse_plan", _ => Task.FromResult(decision), null, ct);
    }

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
        string inputVersion = versioned ? VersionFor(stage) : job.InputVersion;
        AnalysisRecoveryClaim? known = versioned ? await checkpoints.ReadAsync(key, upstream) : null;

        if (known is not null && !string.Equals(known.InputVersion, inputVersion, StringComparison.Ordinal))
            throw new AnalysisDependencyRejectionException(stage, "stale_snapshot_plan");

        await using AnalysisRecoveryLease lease = await AnalysisRecoveryLease.AcquireAsync(
            checkpoints, key, inputVersion, safeReplay ? maxAttempts : 1, clock, upstream);

        if (lease.IsComplete)
        {
            logger.LogInformation("Reused SecureNow analysis checkpoint. SnapshotId={SnapshotId} Stage={Stage}",
                job.SnapshotId, stage);

            string? rejection = AnalysisDependencyFingerprint.Rejection(lease.Claim, inputVersion, true, true);

            if (rejection is not null)
                throw new AnalysisDependencyRejectionException(stage, rejection);

            T recovered = JsonSerializer.Deserialize<T>(lease.Claim.ResultReference!, AuditJsonSerializationOptions.Instance)!;
            EnsureCoverage(stage, recovered);
            RecordOutput(stage, inputVersion, lease.Claim.ResultReference!, recovered);

            return recovered;
        }

        try
        {
            using IDisposable fence = lease.EnterSqlFence(job.AdmittedUtc);
            T result = await work(lease.Token);

            if (succeeded is not null && !succeeded(result))
                throw new AnalysisStageExecutionException(stage, AnalysisStageOutcome.Failed);

            EnsureCoverage(stage, result);
            string reference = JsonSerializer.Serialize(result, AuditJsonSerializationOptions.Instance);
            await lease.CompleteAsync(reference, null, lease.Token);
            RecordOutput(stage, inputVersion, reference, result);

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

    private void EnsureCoverage<T>(string stage, T output)
    {
        if (versioned && output is PrivilegePathEngineResult { IdentityEvidenceIncomplete: true })
            throw new AnalysisDependencyRejectionException(stage, "incomplete_engine_coverage");
    }

    private void RecordOutput<T>(string stage, string version, string reference, T output)
    {
        if (!versioned)
            return;

        _outputs[stage] = AnalysisDependencyFingerprint.Digest(new { Version = version, Result = reference });

        if (output is PrivilegePathEngineResult { IdentityEvidenceIncomplete: true })
            CompleteForCarryForward = false;
    }

    internal string VersionFor(string stage)
    {
        string[] prerequisites = stage switch
        {
            "securenow.prior_snapshot" => [],
            "securenow.reuse_plan" or "securenow.audit_readiness" => ["securenow.prior_snapshot"],
            "securenow.toxic" or "securenow.drift" => ["securenow.privilege", "securenow.reachability", "securenow.carry_forward"],
            "securenow.ranking" or "securenow.routing" => ["securenow.privilege", "securenow.reachability", "securenow.toxic",
                "securenow.capability_flow", "securenow.shared_control", "securenow.drift", "securenow.carry_forward"],
            "securenow.cut_point" => ["securenow.ranking"],
            _ => []
        };

        return AnalysisDependencyFingerprint.Create(Scope(job), stage,
            job.InputVersion, job.SnapshotId, _snapshot,
            stage == "securenow.prior_snapshot" ? null : _configuration?.ForStage(stage),
            stage == "securenow.prior_snapshot" ? null : _priorEvidence,
            stage == "securenow.prior_snapshot" ? null : _plan,
            prerequisites.Select(name => new { Name = name, Version = _outputs.GetValueOrDefault(name) }).ToArray());
    }

    internal static ProjectScopeKey Scope(SecureNowAnalysisRecoveryJob job) =>
        ProjectScopeKey.Create(job.TenantId, job.WorkspaceId, job.ProjectId);
}
