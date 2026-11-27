using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Core.Configuration;

using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Serialization;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public sealed class SecureNowArchitectNeighborhoodRunner(
    IAzureInventorySnapshotRepository snapshotRepository,
    SecureNowArchitectPathCarryForwardService carryForwardService,
    IPrivilegePathEngine privilegePathEngine,
    IIntendedReachabilityEngine intendedReachabilityEngine,
    IToxicCombinationEngine toxicCombinationEngine,
    IAuditService auditService,
    ILogger<SecureNowArchitectNeighborhoodRunner> logger,
    IOptionsMonitor<AnalysisStageExecutionOptions>? executionOptions = null,
    TimeProvider? timeProvider = null) : ISecureNowArchitectNeighborhoodRunner
{
    public async Task<SecureNowArchitectNeighborhoodRecomputeResult> RecomputeNeighborhoodAsync(
        ScopeContext scope,
        AzureInventoryDiffSummaryRecord summary,
        IReadOnlyList<AzureInventoryChangeRecord> changes,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(summary);
        ArgumentNullException.ThrowIfNull(changes);
        AnalysisStageExecutionOptions options = executionOptions?.CurrentValue ?? new AnalysisStageExecutionOptions();
        using AnalysisExecutionBudget? owned = SecureNowAnalysisRun.ExecutionBudget is null
            ? new(options, timeProvider ?? TimeProvider.System, options.GetSecureNowRunTimeout(), cancellationToken)
            : null;
        AnalysisExecutionBudget budget = SecureNowAnalysisRun.ExecutionBudget ?? owned!;
        using IDisposable analysisRun = SecureNowAnalysisRun.JoinOrBegin(budget);

        if (changes.Count == 0)
        {
            return new SecureNowArchitectNeighborhoodRecomputeResult
            {
                Succeeded = true,
                ChangeCount = 0,
            };
        }

        SecureNowAnalysisSnapshot? analysisSnapshot =
            await budget.ExecuteAsync("securenow.neighborhood.snapshot",
                token => SecureNowAnalysisRun.LoadAsync(snapshotRepository, scope, summary.SnapshotBId, token),
                cancellationToken);
        AzureInventorySnapshotDetailReadModel? snapshot = analysisSnapshot?.Snapshot;

        if (snapshot is null)
        {
            return new SecureNowArchitectNeighborhoodRecomputeResult
            {
                Succeeded = false,
                ErrorMessage = "Target snapshot was not found in the current tenant scope.",
            };
        }

        IReadOnlySet<Guid> seeds = SecureNowArchitectNeighborhoodExpander.Expand(snapshot, changes, analysisSnapshot);
        IReadOnlyDictionary<string, Guid> cloudResourceIdByArmId =
            analysisSnapshot!.CloudResourceIdsByArmId;

        if (seeds.Count == 0)
        {
            return new SecureNowArchitectNeighborhoodRecomputeResult
            {
                Succeeded = true,
                ChangeCount = changes.Count,
            };
        }

        int carriedForward = await budget.ExecuteAsync("securenow.neighborhood.carry_forward", token =>
            carryForwardService.CarryForwardAsync(scope, summary.SnapshotAId, summary.SnapshotBId, seeds, cloudResourceIdByArmId, token),
            cancellationToken);

        SecureNowArchitectEngineRunScope runScope = SecureNowArchitectEngineRunScope.Neighborhood(seeds);

        var (privilegeResult, privilegeFailure) = await budget.ExecuteIndependentAsync("securenow.privilege", token =>
            privilegePathEngine.RunAsync(scope, summary.SnapshotBId, SecureNowArchitectConstants.SystemActorId, token, runScope),
            cancellationToken, static result => result.Succeeded);

        var (reachabilityResult, reachabilityFailure) = await budget.ExecuteIndependentAsync("securenow.reachability", token =>
            intendedReachabilityEngine.RunAsync(scope, summary.SnapshotBId, SecureNowArchitectConstants.SystemActorId, token, runScope),
            cancellationToken, static result => result.Succeeded);

        PrivilegePathEngineResult? toxicResult = null;

        if (privilegeFailure is null && reachabilityFailure is null)
        {
            toxicResult = await budget.ExecuteAsync("securenow.toxic", token =>
                toxicCombinationEngine.RunAsync(scope, summary.SnapshotBId, SecureNowArchitectConstants.SystemActorId, token, runScope),
                cancellationToken, succeeded: static result => result.Succeeded);
        }
        else
        {
            budget.RecordNotStarted("securenow.toxic");

            if (privilegeResult is null || reachabilityResult is null)
                throw privilegeFailure ?? reachabilityFailure!;
        }

        int pathsDiscovered = privilegeResult!.PathsDiscovered + reachabilityResult!.PathsDiscovered + (toxicResult?.PathsDiscovered ?? 0);
        int pathsPersisted = privilegeResult.PathsPersisted + reachabilityResult.PathsPersisted + (toxicResult?.PathsPersisted ?? 0);

        await budget.ExecuteAsync("securenow.neighborhood.audit", token => LogAuditAsync(
            scope,
            summary,
            changes.Count,
            seeds.Count,
            carriedForward,
            pathsDiscovered,
            pathsPersisted,
            token), cancellationToken);

        if (!privilegeResult.Succeeded || !reachabilityResult.Succeeded || toxicResult is not { Succeeded: true })
        {
            logger.LogWarning(
                "SecureNow neighborhood recompute completed with engine errors for DiffId={DiffId}.",
                summary.DiffId);

            return new SecureNowArchitectNeighborhoodRecomputeResult
            {
                Succeeded = false,
                ErrorMessage = privilegeResult.ErrorMessage
                               ?? reachabilityResult.ErrorMessage
                               ?? toxicResult?.ErrorMessage
                               ?? "A dependent analysis stage did not complete.",
                ChangeCount = changes.Count,
                SeedCount = seeds.Count,
                PathsCarriedForward = carriedForward,
                PathsDiscovered = pathsDiscovered,
                PathsPersisted = pathsPersisted,
            };
        }

        return new SecureNowArchitectNeighborhoodRecomputeResult
        {
            Succeeded = true,
            ChangeCount = changes.Count,
            SeedCount = seeds.Count,
            PathsCarriedForward = carriedForward,
            PathsDiscovered = pathsDiscovered,
            PathsPersisted = pathsPersisted,
        };
    }

    public Task<int> CarryForwardAllAsync(
        ScopeContext scope,
        Guid fromSnapshotId,
        Guid toSnapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return carryForwardService.CarryForwardAsync(
            scope,
            fromSnapshotId,
            toSnapshotId,
            excludeCloudResourceIds: null,
            cloudResourceIdByArmId: new Dictionary<string, Guid>(StringComparer.OrdinalIgnoreCase),
            cancellationToken);
    }

    private async Task LogAuditAsync(
        ScopeContext scope,
        AzureInventoryDiffSummaryRecord summary,
        int changeCount,
        int seedCount,
        int pathsCarriedForward,
        int pathsDiscovered,
        int pathsPersisted,
        CancellationToken cancellationToken)
    {
        try
        {
            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.SecureNowArchitectNeighborhoodRecomputed,
                    ActorUserId = SecureNowArchitectConstants.SystemActorId,
                    ActorUserName = SecureNowArchitectConstants.SystemActorId,
                    ExplicitActor = true,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            diffId = summary.DiffId,
                            snapshotAId = summary.SnapshotAId,
                            snapshotBId = summary.SnapshotBId,
                            changeCount,
                            seedCount,
                            pathsCarriedForward,
                            pathsDiscovered,
                            pathsPersisted,
                        },
                        AuditJsonSerializationOptions.Instance),
                },
                cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Failed to log SecureNow neighborhood recompute audit for DiffId={DiffId}.", summary.DiffId);
        }
    }
}
