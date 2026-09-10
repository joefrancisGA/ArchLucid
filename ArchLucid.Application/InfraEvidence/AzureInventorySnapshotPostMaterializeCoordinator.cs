using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

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
    IPrivilegePathEngine privilegePathEngine,
    IIntendedReachabilityEngine intendedReachabilityEngine,
    IToxicCombinationEngine toxicCombinationEngine,
    ICapabilityToFlowEngine capabilityToFlowEngine) : IAzureInventorySnapshotPostMaterializeCoordinator
{
    public async Task OnSnapshotMaterializedAsync(
        ScopeContext scope,
        Guid snapshotId,
        string? subscriptionId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (!string.IsNullOrWhiteSpace(subscriptionId))
        {
            Guid? priorSnapshotId = await snapshotRepository.TryGetPriorMaterializedSnapshotIdAsync(
                scope,
                subscriptionId,
                snapshotId,
                cancellationToken);

            if (priorSnapshotId is not null && priorSnapshotId != Guid.Empty)
            {
                await diffService.ComputeAndPersistDiffAsync(
                    scope,
                    priorSnapshotId.Value,
                    snapshotId,
                    cancellationToken);
            }
        }

        await privilegePathEngine.RunAsync(
            scope,
            snapshotId,
            SecureNowArchitectConstants.SystemActorId,
            cancellationToken);

        await intendedReachabilityEngine.RunAsync(
            scope,
            snapshotId,
            SecureNowArchitectConstants.SystemActorId,
            cancellationToken);

        await toxicCombinationEngine.RunAsync(
            scope,
            snapshotId,
            SecureNowArchitectConstants.SystemActorId,
            cancellationToken);

        await capabilityToFlowEngine.RunAsync(
            scope,
            snapshotId,
            SecureNowArchitectConstants.SystemActorId,
            cancellationToken);
    }
}
