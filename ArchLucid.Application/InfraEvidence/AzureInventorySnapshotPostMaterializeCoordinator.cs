using ArchLucid.Application.Analysis;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Resilience;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;

using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence;

public interface IAzureInventorySnapshotPostMaterializeCoordinator
{
    Task OnSnapshotMaterializedAsync(
        ScopeContext scope,
        Guid snapshotId,
        string? subscriptionId,
        CancellationToken cancellationToken = default);
}

public sealed class AzureInventorySnapshotPostMaterializeCoordinator(
    IAzureInventorySnapshotRepository snapshotRepository,
    IAzureInventoryDiffService diffService,
    IOptions<SecureNowArchitectNeighborhoodOptions> neighborhoodOptions,
    ISecureNowArchitectNeighborhoodRunner neighborhoodRunner,
    IPrivilegePathEngine privilegePathEngine,
    IIntendedReachabilityEngine intendedReachabilityEngine,
    IToxicCombinationEngine toxicCombinationEngine,
    ICapabilityToFlowEngine capabilityToFlowEngine,
    ISharedControlBlastRadiusEngine sharedControlBlastRadiusEngine,
    IFourRealityDriftEngine fourRealityDriftEngine,
    IPathRankingEngine pathRankingEngine,
    ICutPointAnalysisEngine cutPointAnalysisEngine,
    ISecurityEvidencePathRoutingSyncService pathRoutingSyncService,
    IOptionsMonitor<AnalysisStageExecutionOptions>? executionOptions = null,
    TimeProvider? timeProvider = null,
    SecureNowAnalysisDurableRecovery? durableRecovery = null,
    SecureNowDependencyInputs? dependencyInputs = null,
    ILogger<AzureInventorySnapshotPostMaterializeCoordinator>? logger = null) : IAzureInventorySnapshotPostMaterializeCoordinator
{
    public async Task OnSnapshotMaterializedAsync(
        ScopeContext scope,
        Guid snapshotId,
        string? subscriptionId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        AnalysisStageExecutionOptions options = executionOptions?.CurrentValue ?? new AnalysisStageExecutionOptions();

        if (durableRecovery is not null && options.EnableDurableSecureNowRecovery)
        {
            SecureNowAnalysisRecoveryJob job = await durableRecovery.AdmitAsync(
                scope, snapshotId, subscriptionId, neighborhoodOptions.Value.FullRecompute, cancellationToken);
            await ResumeJobAsync(job, cancellationToken);

            return;
        }

        using AnalysisExecutionBudget budget = new(options, timeProvider ?? TimeProvider.System,
            options.GetSecureNowRunTimeout(), cancellationToken);
        await ExecuteAsync(scope, snapshotId, subscriptionId, neighborhoodOptions.Value.FullRecompute, budget, cancellationToken);
    }

    public async Task ResumeJobAsync(SecureNowAnalysisRecoveryJob job, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(job);
        ScopeContext scope = job.CreateScope();

        if (durableRecovery is null)
            throw new InvalidOperationException("SecureNow recovery requires SQL storage.");

        await durableRecovery.ExecuteAsync(job, async (budget, token) =>
        {
            AzureInventorySnapshotRecord? snapshot = await snapshotRepository.TryGetBySnapshotIdAsync(scope, job.SnapshotId, token);

            if (snapshot is null || !string.Equals(snapshot.SubscriptionId, job.SubscriptionId, StringComparison.Ordinal))
                throw new AnalysisStageExecutionException("securenow.snapshot_binding", AnalysisStageOutcome.Failed);

            SecureNowDependencyVersions? version = null;

            if (budget.RecoverySession is { Versioned: true } session)
            {
                if (dependencyInputs is null)
                    throw new AnalysisDependencyRejectionException("securenow.job", "dependency_provider_unavailable");

                version = await dependencyInputs.ConfigurationAsync(ProjectScopeKey.From(scope), job.SnapshotId, token);
                session.BindSnapshot(SnapshotBinding(snapshot), version);
            }

            await ExecuteAsync(scope, job.SnapshotId, job.SubscriptionId, job.FullRecompute, budget, token,
                snapshot, version);
        }, cancellationToken);
    }

    private async Task ExecuteAsync(
        ScopeContext scope, Guid snapshotId, string? subscriptionId, bool fullRecomputeRequested,
        AnalysisExecutionBudget budget, CancellationToken cancellationToken,
        AzureInventorySnapshotRecord? target = null, SecureNowDependencyVersions? version = null)
    {
        using IDisposable analysisRun = SecureNowAnalysisRun.Begin(budget);

        Guid? priorSnapshotId = null;
        AzureInventoryDiffComputeResult? diffResult = null;

        if (!string.IsNullOrWhiteSpace(subscriptionId))
        {
            priorSnapshotId = await budget.ExecuteAsync("securenow.prior_snapshot",
                token => snapshotRepository.TryGetPriorMaterializedSnapshotIdAsync(scope, subscriptionId, snapshotId, token),
                cancellationToken,
                retrySafeRead: static failure => failure is ReplaySafeAnalysisReadException retry
                    ? new AnalysisReadRetrySignal(retry.RetryAfter)
                    : null);

            if (priorSnapshotId == Guid.Empty)
            {
                priorSnapshotId = null;
            }

            if (priorSnapshotId is not null)
            {
                if (budget.RecoverySession is { Versioned: true } session)
                {
                    AzureInventorySnapshotRecord? source = await snapshotRepository.TryGetBySnapshotIdAsync(
                        scope, priorSnapshotId.Value, cancellationToken);
                    session.BindPrior(priorSnapshotId, source is null ? null : SnapshotBinding(source));
                }

                diffResult = await budget.ExecuteAsync("securenow.diff",
                    token => diffService.ComputeAndPersistDiffAsync(scope, priorSnapshotId.Value, snapshotId, token),
                    cancellationToken, succeeded: static result => result.Succeeded && result.ConsumerFanOutSucceeded);
            }
        }

        if (budget.RecoverySession is { Versioned: true } recovery)
        {
            await RunVersionedAsync(scope, target!, version!, priorSnapshotId, diffResult, budget, recovery, cancellationToken);

            return;
        }

        if (budget.RecoverySession is not null &&
            diffResult is ({ Succeeded: false } or { ConsumerFanOutSucceeded: false }))
            throw new AnalysisStageExecutionException("securenow.diff", AnalysisStageOutcome.Failed);

        bool fullRecompute = fullRecomputeRequested
            || priorSnapshotId is null
            || diffResult is { Succeeded: false }
            || diffResult is { ConsumerFanOutSucceeded: false };

        if (fullRecompute)
        {
            await RunFullSecureNowPipelineAsync(scope, snapshotId, budget);

            return;
        }

        if (diffResult is { Succeeded: true, Changes.Count: 0 })
        {
            await budget.ExecuteAsync("securenow.carry_forward", token =>
                neighborhoodRunner.CarryForwardAllAsync(scope, priorSnapshotId!.Value, snapshotId, token), cancellationToken);
        }

        await RunDownstreamSecureNowPipelineAsync(scope, snapshotId, budget);
    }

    private async Task RunVersionedAsync(ScopeContext scope, AzureInventorySnapshotRecord target, SecureNowDependencyVersions version,
        Guid? prior, AzureInventoryDiffComputeResult? diff, AnalysisExecutionBudget budget,
        SecureNowRecoverySession recovery, CancellationToken ct)
    {
        SecureNowDependencyInputs inputs = dependencyInputs!;
        int maxAgeHours = executionOptions?.CurrentValue.SecureNowReuseMaxAgeHours ?? 24;

        if (!inputs.Eligible(target, maxAgeHours))
            throw new AnalysisDependencyRejectionException("securenow.reuse_plan", "incomplete_or_stale_inventory");

        string? reason = recovery.FullRecompute ? "full_recompute_requested"
            : prior is null || diff is not { Succeeded: true, ConsumerFanOutSucceeded: true, Changes.Count: 0 }
                ? "incremental_equivalence_unproven"
                : await inputs.CarryForwardRejectionAsync(scope, target, prior.Value, version.Paths, maxAgeHours, ct);
        string plan = reason is null ? "carry_forward" : "full_recompute";
        string binding = AnalysisDependencyFingerprint.Digest(new { Plan = plan, Prior = prior, DiffId = diff?.DiffId, MaxAgeHours = maxAgeHours });
        string admitted = await recovery.PinPlanAsync(binding, plan, ct);

        if (admitted != plan)
            throw new AnalysisDependencyRejectionException("securenow.reuse_plan", "stale_snapshot_plan");

        logger?.LogInformation("SecureNow dependency decision. SnapshotId={SnapshotId} Plan={Plan} Reason={Reason}",
            target.SnapshotId, plan, reason ?? "verified_source");

        if (plan == "carry_forward")
        {
            await budget.ExecuteAsync("securenow.carry_forward", token =>
                neighborhoodRunner.CarryForwardAllAsync(scope, prior!.Value, target.SnapshotId, token), ct);
            await RequireEngineAsync(budget, "securenow.drift",
                token => fourRealityDriftEngine.RunAsync(scope, target.SnapshotId, SecureNowArchitectConstants.SystemActorId, token));
            await RunRankingAndCutPointAnalysisAsync(scope, target.SnapshotId, budget);
            await budget.ExecuteAsync("securenow.routing",
                token => pathRoutingSyncService.SyncSnapshotAsync(scope, target.SnapshotId, token), ct);

            if (await inputs.CarryForwardRejectionAsync(scope, target, prior!.Value, version.Paths, maxAgeHours, ct) is not null)
                throw new AnalysisDependencyRejectionException("securenow.carry_forward", "source_changed_during_execution");
        }
        else
        {
            await RunFullSecureNowPipelineAsync(scope, target.SnapshotId, budget);
        }

        SecureNowDependencyReceipt? receipt = await inputs.CreateReceiptAsync(
            scope, target, version.Paths, maxAgeHours, recovery.CompleteForCarryForward, ct);
        AzureInventorySnapshotRecord? current = await snapshotRepository.TryGetBySnapshotIdAsync(scope, target.SnapshotId, ct);

        if (current is null || SnapshotBinding(target) != SnapshotBinding(current) ||
            version != await inputs.ConfigurationAsync(ProjectScopeKey.From(scope), target.SnapshotId, ct))
            throw new AnalysisDependencyRejectionException("securenow.job", "inputs_changed_during_execution");

        if (receipt is null)
            throw new AnalysisDependencyRejectionException("securenow.job", "incomplete_path_coverage");

        recovery.Receipt = receipt;
    }

    private static string SnapshotBinding(AzureInventorySnapshotRecord snapshot) => AnalysisDependencyFingerprint.Digest(new
    {
        snapshot.SnapshotId, snapshot.CapturedUtc, Evidence = SecureNowDependencyInputs.Evidence(snapshot)
    });

    private async Task RunFullSecureNowPipelineAsync(ScopeContext scope, Guid snapshotId, AnalysisExecutionBudget budget)
    {
        const string actor = SecureNowArchitectConstants.SystemActorId;
        AnalysisStageExecutionException? firstFailure = null;

        bool privilegeSucceeded = await RunIndependentAsync("securenow.privilege",
            token => privilegePathEngine.RunAsync(scope, snapshotId, actor, cancellationToken: token));
        bool reachabilitySucceeded = await RunIndependentAsync("securenow.reachability",
            token => intendedReachabilityEngine.RunAsync(scope, snapshotId, actor, cancellationToken: token));
        bool pathsComplete = privilegeSucceeded && reachabilitySucceeded;

        if (pathsComplete)
        {
            await RunIndependentAsync("securenow.toxic",
                token => toxicCombinationEngine.RunAsync(scope, snapshotId, actor, cancellationToken: token));
        }
        else
        {
            budget.RecordNotStarted("securenow.toxic");
        }

        await RunIndependentAsync("securenow.capability_flow",
            token => capabilityToFlowEngine.RunAsync(scope, snapshotId, actor, token));
        await RunIndependentAsync("securenow.shared_control",
            token => sharedControlBlastRadiusEngine.RunAsync(scope, snapshotId, actor, token));

        if (pathsComplete)
        {
            await RunIndependentAsync("securenow.drift",
                token => fourRealityDriftEngine.RunAsync(scope, snapshotId, actor, token));
        }
        else
        {
            budget.RecordNotStarted("securenow.drift");
        }

        if (firstFailure is not null)
        {
            budget.RecordNotStarted("securenow.ranking");
            budget.RecordNotStarted("securenow.cut_point");
            budget.RecordNotStarted("securenow.routing");
            throw firstFailure;
        }

        await RunRankingAndCutPointAnalysisAsync(scope, snapshotId, budget);
        await budget.ExecuteAsync("securenow.routing", token => pathRoutingSyncService.SyncSnapshotAsync(scope, snapshotId, token),
            budget.Token);

        async Task<bool> RunIndependentAsync(string stage, Func<CancellationToken, Task<PrivilegePathEngineResult>> work)
        {
            var (_, failure) = await budget.ExecuteIndependentAsync(stage, work, budget.Token, static result => result.Succeeded);
            firstFailure ??= failure;

            return failure is null;
        }
    }

    private async Task RunDownstreamSecureNowPipelineAsync(ScopeContext scope, Guid snapshotId, AnalysisExecutionBudget budget)
    {
        await budget.ExecuteAsync("securenow.routing", token => pathRoutingSyncService.SyncSnapshotAsync(scope, snapshotId, token),
            budget.Token);
        await RequireEngineAsync(budget, "securenow.drift",
            token => fourRealityDriftEngine.RunAsync(scope, snapshotId, SecureNowArchitectConstants.SystemActorId, token));
        await RunRankingAndCutPointAnalysisAsync(scope, snapshotId, budget);
    }

    private async Task RunRankingAndCutPointAnalysisAsync(ScopeContext scope, Guid snapshotId, AnalysisExecutionBudget budget)
    {
        const string actor = SecureNowArchitectConstants.SystemActorId;
        PathRankingEngineResult ranking = await budget.ExecuteAsync("securenow.ranking",
            token => pathRankingEngine.RunAsync(scope, snapshotId, actor, token), budget.Token,
            succeeded: static result => result.Succeeded);

        if (!ranking.Succeeded)
        {
            budget.RecordNotStarted("securenow.cut_point");
            throw new AnalysisStageExecutionException("securenow.ranking", AnalysisStageOutcome.Failed);
        }

        CutPointAnalysisEngineResult cutPoints = await budget.ExecuteAsync("securenow.cut_point",
            token => cutPointAnalysisEngine.RunAsync(scope, snapshotId, actor, token), budget.Token,
            succeeded: static result => result.Succeeded);

        if (!cutPoints.Succeeded)
            throw new AnalysisStageExecutionException("securenow.cut_point", AnalysisStageOutcome.Failed);
    }

    private static Task<PrivilegePathEngineResult> RunEngineAsync(
        AnalysisExecutionBudget budget, string stage, Func<CancellationToken, Task<PrivilegePathEngineResult>> work) =>
        budget.ExecuteAsync(stage, work, budget.Token, succeeded: static result => result.Succeeded);

    private static async Task RequireEngineAsync(
        AnalysisExecutionBudget budget, string stage, Func<CancellationToken, Task<PrivilegePathEngineResult>> work)
    {
        PrivilegePathEngineResult result = await RunEngineAsync(budget, stage, work);

        if (!result.Succeeded)
            throw new AnalysisStageExecutionException(stage, AnalysisStageOutcome.Failed);
    }
}
