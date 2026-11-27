using System.Text.Json;

using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Audit;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Analysis;

/// <summary>Recovers only named, replay-safe SQL units projected from a single pinned inventory admission.</summary>
internal sealed class SecureNowRecoverySession(
    IAnalysisRecoveryRepository checkpoints, SecureNowAnalysisRecoveryJob job, int maxAttempts,
    TimeProvider clock, ILogger logger, CancellationToken workerToken, bool versioned = false,
    bool useGraph = false, bool observeGraph = false, IAuditRepository? audit = null,
    IArchLucidUnitOfWorkFactory? transactions = null)
{
    private readonly Dictionary<string, string> _outputs = new(StringComparer.Ordinal);
    private readonly Dictionary<string, (string Version, string Reference)> _completedCheckpoints = new(StringComparer.Ordinal);
    private readonly Dictionary<string, string> _outputWitnesses = new(StringComparer.Ordinal);
    private AnalysisDependencyExecution? _planner = useGraph || observeGraph
        ? new(AnalysisDependencyGraphs.SecurePrelude, Scope(job), job.SnapshotId) : null;
    private string? _snapshot;
    private string? _diff;
    private string? _graphPlan;
    private Func<string, CancellationToken, Task<string?>>? _outputWitness;
    private SecureNowDependencyVersions? _configuration;
    private string? _priorEvidence;
    public Guid? PriorSnapshotId { get; private set; }
    private string? _plan;
    public bool Versioned => versioned;
    public bool UsesGraph => useGraph;
    public bool CompleteForCarryForward { get; private set; } = true;
    public SecureNowDependencyReceipt? Receipt { get; set; }

    public void BindSnapshot(string snapshot, SecureNowDependencyVersions configuration)
    {
        _snapshot = snapshot;
        _configuration = configuration;
    }

    internal void BindOutputWitness(Func<string, CancellationToken, Task<string?>> read) => _outputWitness = read;

    internal void BindDiff(Guid diffId, Guid snapshotAId, Guid snapshotBId)
    {
        if (_planner is null)
            return;

        if (snapshotBId != job.SnapshotId || snapshotAId != PriorSnapshotId || diffId == Guid.Empty)
        {
            if (useGraph)
                throw new AnalysisDependencyRejectionException(AnalysisDependencyGraphs.Audit, "stale_dependencies");

            return;
        }

        _diff = AnalysisDependencyFingerprint.Digest(new { diffId, snapshotAId, snapshotBId });
    }

    public void BindPrior(Guid? id, string? evidence)
    {
        PriorSnapshotId = id;
        _priorEvidence = evidence;
    }

    public async Task<string> PinPlanAsync(string planInput, string decision, CancellationToken ct)
    {
        _plan = planInput;

        if (_planner is not null)
        {
            string? priorWitness = _planner.OutputWitness(AnalysisDependencyGraphs.Prior);

            if (useGraph && !string.IsNullOrWhiteSpace(job.SubscriptionId) && priorWitness is null)
                throw new AnalysisDependencyRejectionException(AnalysisDependencyGraphs.Plan, "incomplete_engine_coverage");

            _graphPlan = AnalysisDependencyFingerprint.Digest(new
            {
                Plan = planInput,
                Prior = priorWitness,
                Diff = _diff,
                Audit = _planner.OutputWitness(AnalysisDependencyGraphs.Audit),
            });
            _planner = new(decision == "carry_forward" ? AnalysisDependencyGraphs.SecureCarry : AnalysisDependencyGraphs.SecureFull,
                Scope(job), job.SnapshotId);
        }

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
        AnalysisDependencyBinding? binding = BindStage(stage);
        string inputVersion = useGraph ? binding!.InputVersion : versioned ? VersionFor(stage) : job.InputVersion;
        AnalysisRecoveryClaim? known = versioned ? await checkpoints.ReadAsync(key, upstream) : null;

        AnalysisDependencyDecision? decision = null;

        if (binding is not null)
        {
            string? rejected = AnalysisDependencyFingerprint.Rejection(known, inputVersion, true, true);
            decision = _planner!.Observe(stage, binding, rejected, rejected is null, useGraph, logger);
        }

        if (known is not null && !string.Equals(known.InputVersion, inputVersion, StringComparison.Ordinal))
            throw new AnalysisDependencyRejectionException(stage, "stale_snapshot_plan");

        await using AnalysisRecoveryLease lease = await AnalysisRecoveryLease.AcquireAsync(
            checkpoints, key, inputVersion, safeReplay ? maxAttempts : 1, clock, upstream);

        if (lease.IsComplete)
        {
            string? rejection = AnalysisDependencyFingerprint.Rejection(lease.Claim, inputVersion, true, true);

            if (rejection is not null)
                throw new AnalysisDependencyRejectionException(stage, rejection);

            T recovered;

            if (useGraph)
            {
                AnalysisDependencyOutput<T>? saved;

                try
                {
                    saved = JsonSerializer.Deserialize<AnalysisDependencyOutput<T>>(
                        lease.Claim.ResultReference!, AuditJsonSerializationOptions.Instance);
                }
                catch (JsonException)
                {
                    throw new AnalysisDependencyRejectionException(stage, "output_missing");
                }

                string witness = await ReadOutputWitnessAsync(stage, lease.Token);

                if (saved is null || !string.Equals(saved.Witness, witness, StringComparison.Ordinal)
                    || (succeeded is not null && (saved.Output is null || !succeeded(saved.Output))))
                    throw new AnalysisDependencyRejectionException(stage, "output_missing");

                _outputWitnesses[stage] = witness;
                recovered = saved.Output;
            }
            else
            {
                recovered = JsonSerializer.Deserialize<T>(lease.Claim.ResultReference!, AuditJsonSerializationOptions.Instance)!;
            }
            EnsureCoverage(stage, recovered);
            RecordOutput(stage, inputVersion, lease.Claim.ResultReference!, recovered, lease.Claim.Fence);
            logger.LogInformation("Reused SecureNow analysis checkpoint. SnapshotId={SnapshotId} Stage={Stage}",
                job.SnapshotId, stage);

            return recovered;
        }

        try
        {
            using IDisposable fence = lease.EnterSqlFence(job.AdmittedUtc);
            T result = await work(lease.Token);

            if (succeeded is not null && !succeeded(result))
                throw new AnalysisStageExecutionException(stage, AnalysisStageOutcome.Failed);

            EnsureCoverage(stage, result);
            string reference;

            if (useGraph)
            {
                string witness = await ReadOutputWitnessAsync(stage, lease.Token);
                _outputWitnesses[stage] = witness;
                reference = JsonSerializer.Serialize(new AnalysisDependencyOutput<T>(result, witness), AuditJsonSerializationOptions.Instance);
            }
            else
            {
                reference = JsonSerializer.Serialize(result, AuditJsonSerializationOptions.Instance);
            }

            if (useGraph)
            {
                await CompleteWithLineageAsync(lease, key, binding!, decision!, reference, recheckUpstream: false);
            }
            else
            {
                await lease.CompleteAsync(reference, null, lease.Token);
            }

            RecordOutput(stage, inputVersion, reference, result, lease.Claim.Fence);

            return result;
        }
        catch (Exception ex)
        {
            _planner?.RecordFailure(stage);
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

    private void RecordOutput<T>(string stage, string version, string reference, T output, long fence)
    {
        if (!versioned)
            return;

        _outputs[stage] = AnalysisDependencyFingerprint.Digest(new { Version = version, Result = reference });
        _planner?.Record(stage, version, reference, fence);

        if (useGraph)
            _completedCheckpoints[stage] = (version, reference);

        if (output is PrivilegePathEngineResult { IdentityEvidenceIncomplete: true })
            CompleteForCarryForward = false;
    }

    internal async Task CompleteJobAsync(AnalysisRecoveryLease lease, AnalysisRecoveryStageKey key, string reference)
    {
        if (_planner is null)
        {
            await lease.CompleteAsync(reference, null, lease.Token);

            return;
        }

        AnalysisDependencyBinding binding = BindStage(AnalysisDependencyGraphs.Job)!;
        AnalysisDependencyDecision decision = _planner.Observe(AnalysisDependencyGraphs.Job, binding,
            "checkpoint_not_successful", legacyReuse: false, useGraph, logger);

        if (useGraph)
        {
            foreach (var (stage, witness) in _outputWitnesses)
            {
                if (witness != await ReadOutputWitnessAsync(stage, lease.Token))
                    throw new AnalysisDependencyRejectionException(AnalysisDependencyGraphs.Job, "upstream_changed_during_execution");
            }

            await CompleteWithLineageAsync(lease, key, binding, decision, reference, recheckUpstream: true);
        }
        else
        {
            await lease.CompleteAsync(reference, null, lease.Token);
        }
    }

    private AnalysisDependencyBinding? BindStage(string stage) => _planner?.BindInputs(stage, new
        {
            job.InputVersion,
            job.SnapshotId,
            Capture = _snapshot,
            Configuration = stage == AnalysisDependencyGraphs.Prior ? null : _configuration?.ForStage(stage),
            Prior = stage == AnalysisDependencyGraphs.Prior ? null : _priorEvidence,
            Plan = stage is AnalysisDependencyGraphs.Prior or AnalysisDependencyGraphs.Audit ? null : _graphPlan,
            Diff = stage == AnalysisDependencyGraphs.Prior ? null : _diff,
        });

    private async Task<string> ReadOutputWitnessAsync(string stage, CancellationToken ct)
    {
        // These stages persist their entire result in the checkpoint or bind an independently verified diff.

        if (stage is AnalysisDependencyGraphs.Prior or AnalysisDependencyGraphs.Plan)
            return AnalysisDependencyFingerprint.Digest(stage);

        if (stage == AnalysisDependencyGraphs.Audit && _diff is not null)
            return _diff;

        string? witness = _outputWitness is null ? null : await _outputWitness(stage, ct);

        return witness ?? throw new AnalysisDependencyRejectionException(stage, "output_missing");
    }

    private async Task CompleteWithLineageAsync(AnalysisRecoveryLease lease, AnalysisRecoveryStageKey key,
        AnalysisDependencyBinding binding, AnalysisDependencyDecision decision, string reference, bool recheckUpstream)
    {
        if (audit is null || transactions is null)
            throw new AnalysisDependencyRejectionException(key.Stage, "dependency_provider_unavailable");

        await using IArchLucidUnitOfWork tx = await transactions.CreateAsync(lease.Token);

        if (recheckUpstream)
        {
            foreach (var (stage, saved) in _completedCheckpoints.OrderBy(item => item.Key, StringComparer.Ordinal))
            {
                var upstream = new AnalysisRecoveryStageKey(key.Scope, key.Pipeline, key.RunId, stage);

                if (!await checkpoints.IsCurrentAsync(upstream, saved.Version, saved.Reference, tx, lease.Token))
                    throw new AnalysisDependencyRejectionException(key.Stage, "upstream_changed_during_execution");
            }
        }

        await AnalysisDependencyAudit.AppendAsync(audit, clock, key, binding,
            decision.Action == AnalysisDependencyAction.Reuse ? new(AnalysisDependencyAction.Recompute, "checkpoint_changed_during_claim") : decision,
            reference, lease.Claim.Fence, tx, lease.Token);
        await lease.CompleteAsync(reference, tx, lease.Token);
        await tx.CommitAsync(lease.Token);
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
