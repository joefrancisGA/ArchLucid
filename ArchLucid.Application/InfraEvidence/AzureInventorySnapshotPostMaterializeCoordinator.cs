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
    ISecurityEvidencePathRoutingSyncService pathRoutingSyncService) : IAzureInventorySnapshotPostMaterializeCoordinator
{
    public async Task OnSnapshotMaterializedAsync(
        ScopeContext scope,
        Guid snapshotId,
        string? subscriptionId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        Guid? priorSnapshotId = null;
        AzureInventoryDiffComputeResult? diffResult = null;

        if (!string.IsNullOrWhiteSpace(subscriptionId))
        {
            priorSnapshotId = await snapshotRepository.TryGetPriorMaterializedSnapshotIdAsync(
                scope,
                subscriptionId,
                snapshotId,
                cancellationToken);

            if (priorSnapshotId is not null && priorSnapshotId != Guid.Empty)
            {
                diffResult = await diffService.ComputeAndPersistDiffAsync(
                    scope,
                    priorSnapshotId.Value,
                    snapshotId,
                    cancellationToken);
            }
        }

        bool fullRecompute = neighborhoodOptions.Value.FullRecompute || priorSnapshotId is null;

        if (fullRecompute)
        {
            await RunFullSecureNowPipelineAsync(scope, snapshotId, cancellationToken);

            return;
        }

        if (diffResult is { Succeeded: true, Changes.Count: 0, WasExisting: false })
        {
            await neighborhoodRunner.CarryForwardAllAsync(
                scope,
                priorSnapshotId!.Value,
                snapshotId,
                cancellationToken);
        }

        await RunDownstreamSecureNowPipelineAsync(scope, snapshotId, cancellationToken);
    }

    private async Task RunFullSecureNowPipelineAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken)
    {
        await privilegePathEngine.RunAsync(
            scope,
            snapshotId,
            SecureNowArchitectConstants.SystemActorId,
            cancellationToken: cancellationToken);

        await intendedReachabilityEngine.RunAsync(
            scope,
            snapshotId,
            SecureNowArchitectConstants.SystemActorId,
            cancellationToken: cancellationToken);

        await toxicCombinationEngine.RunAsync(
            scope,
            snapshotId,
            SecureNowArchitectConstants.SystemActorId,
            cancellationToken: cancellationToken);

        await capabilityToFlowEngine.RunAsync(
            scope,
            snapshotId,
            SecureNowArchitectConstants.SystemActorId,
            cancellationToken);

        await sharedControlBlastRadiusEngine.RunAsync(
            scope,
            snapshotId,
            SecureNowArchitectConstants.SystemActorId,
            cancellationToken);

        await fourRealityDriftEngine.RunAsync(
            scope,
            snapshotId,
            SecureNowArchitectConstants.SystemActorId,
            cancellationToken);

        await pathRankingEngine.RunAsync(
            scope,
            snapshotId,
            SecureNowArchitectConstants.SystemActorId,
            cancellationToken);

        await cutPointAnalysisEngine.RunAsync(
            scope,
            snapshotId,
            SecureNowArchitectConstants.SystemActorId,
            cancellationToken);

        await pathRoutingSyncService.SyncSnapshotAsync(scope, snapshotId, cancellationToken);
    }

    private async Task RunDownstreamSecureNowPipelineAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken)
    {
        await pathRoutingSyncService.SyncSnapshotAsync(scope, snapshotId, cancellationToken);

        await fourRealityDriftEngine.RunAsync(
            scope,
            snapshotId,
            SecureNowArchitectConstants.SystemActorId,
            cancellationToken);

        await pathRankingEngine.RunAsync(
            scope,
            snapshotId,
            SecureNowArchitectConstants.SystemActorId,
            cancellationToken);

        await cutPointAnalysisEngine.RunAsync(
            scope,
            snapshotId,
            SecureNowArchitectConstants.SystemActorId,
            cancellationToken);
    }

    private async Task RunDownstreamSecureNowPipelineAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken)
    {
        await fourRealityDriftEngine.RunAsync(
            scope,
            snapshotId,
            SecureNowArchitectConstants.SystemActorId,
            cancellationToken);

        await pathRankingEngine.RunAsync(
            scope,
            snapshotId,
            SecureNowArchitectConstants.SystemActorId,
            cancellationToken);

        await cutPointAnalysisEngine.RunAsync(
            scope,
            snapshotId,
            SecureNowArchitectConstants.SystemActorId,
            cancellationToken);
    }
}
