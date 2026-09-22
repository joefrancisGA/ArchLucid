using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Serialization;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public sealed class SecureNowArchitectNeighborhoodRunner(
    IAzureInventorySnapshotRepository snapshotRepository,
    SecureNowArchitectPathCarryForwardService carryForwardService,
    IPrivilegePathEngine privilegePathEngine,
    IIntendedReachabilityEngine intendedReachabilityEngine,
    IToxicCombinationEngine toxicCombinationEngine,
    IAuditService auditService,
    ILogger<SecureNowArchitectNeighborhoodRunner> logger) : ISecureNowArchitectNeighborhoodRunner
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

        if (changes.Count == 0)
        {
            return new SecureNowArchitectNeighborhoodRecomputeResult
            {
                Succeeded = true,
                ChangeCount = 0,
            };
        }

        AzureInventorySnapshotDetailReadModel? snapshot =
            await snapshotRepository.TryGetSnapshotDetailAsync(scope, summary.SnapshotBId, cancellationToken);

        if (snapshot is null)
        {
            return new SecureNowArchitectNeighborhoodRecomputeResult
            {
                Succeeded = false,
                ErrorMessage = "Target snapshot was not found in the current tenant scope.",
            };
        }

        IReadOnlySet<Guid> seeds = SecureNowArchitectNeighborhoodExpander.Expand(snapshot, changes);
        IReadOnlyDictionary<string, Guid> cloudResourceIdByArmId =
            SecureNowArchitectNeighborhoodFilter.BuildCloudResourceIdByArmId(snapshot);

        if (seeds.Count == 0)
        {
            return new SecureNowArchitectNeighborhoodRecomputeResult
            {
                Succeeded = true,
                ChangeCount = changes.Count,
            };
        }

        int carriedForward = await carryForwardService.CarryForwardAsync(
            scope,
            summary.SnapshotAId,
            summary.SnapshotBId,
            seeds,
            cloudResourceIdByArmId,
            cancellationToken);

        SecureNowArchitectEngineRunScope runScope = SecureNowArchitectEngineRunScope.Neighborhood(seeds);

        PrivilegePathEngineResult privilegeResult = await privilegePathEngine.RunAsync(
            scope,
            summary.SnapshotBId,
            SecureNowArchitectConstants.SystemActorId,
            cancellationToken,
            runScope);

        PrivilegePathEngineResult reachabilityResult = await intendedReachabilityEngine.RunAsync(
            scope,
            summary.SnapshotBId,
            SecureNowArchitectConstants.SystemActorId,
            cancellationToken,
            runScope);

        PrivilegePathEngineResult toxicResult = await toxicCombinationEngine.RunAsync(
            scope,
            summary.SnapshotBId,
            SecureNowArchitectConstants.SystemActorId,
            cancellationToken,
            runScope);

        int pathsDiscovered = privilegeResult.PathsDiscovered
                              + reachabilityResult.PathsDiscovered
                              + toxicResult.PathsDiscovered;
        int pathsPersisted = privilegeResult.PathsPersisted
                             + reachabilityResult.PathsPersisted
                             + toxicResult.PathsPersisted;

        await LogAuditAsync(
            scope,
            summary,
            changes.Count,
            seeds.Count,
            carriedForward,
            pathsDiscovered,
            pathsPersisted,
            cancellationToken);

        if (!privilegeResult.Succeeded || !reachabilityResult.Succeeded || !toxicResult.Succeeded)
        {
            logger.LogWarning(
                "SecureNow neighborhood recompute completed with engine errors for DiffId={DiffId}.",
                summary.DiffId);

            return new SecureNowArchitectNeighborhoodRecomputeResult
            {
                Succeeded = false,
                ErrorMessage = privilegeResult.ErrorMessage
                               ?? reachabilityResult.ErrorMessage
                               ?? toxicResult.ErrorMessage,
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

public sealed class SecureNowArchitectNeighborhoodRecomputeResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }

    public int ChangeCount
    {
        get;
        init;
    }

    public int SeedCount
    {
        get;
        init;
    }

    public int PathsCarriedForward
    {
        get;
        init;
    }

    public int PathsDiscovered
    {
        get;
        init;
    }

    public int PathsPersisted
    {
        get;
        init;
    }
}
