using ArchLucid.Application.Analysis;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Resilience;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Options;

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
    TimeProvider? timeProvider = null) : IAzureInventorySnapshotPostMaterializeCoordinator
{
    public async Task OnSnapshotMaterializedAsync(
        ScopeContext scope,
        Guid snapshotId,
        string? subscriptionId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        AnalysisStageExecutionOptions options = executionOptions?.CurrentValue ?? new AnalysisStageExecutionOptions();
        using AnalysisExecutionBudget budget = new(options, timeProvider ?? TimeProvider.System,
            options.GetSecureNowRunTimeout(), cancellationToken);
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
                diffResult = await budget.ExecuteAsync("securenow.diff",
                    token => diffService.ComputeAndPersistDiffAsync(scope, priorSnapshotId.Value, snapshotId, token),
                    cancellationToken, succeeded: static result => result.Succeeded && result.ConsumerFanOutSucceeded);
            }
        }

        bool fullRecompute = neighborhoodOptions.Value.FullRecompute
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
