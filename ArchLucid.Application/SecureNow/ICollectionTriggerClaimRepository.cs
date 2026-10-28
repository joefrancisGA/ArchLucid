using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.SecureNow;

/// <summary>Cross-replica reservation of a collection trigger's stable run identity.</summary>
public interface ICollectionTriggerClaimRepository
{
    Task<(bool Acquired, Guid RunId, byte State)> TryReserveAsync(
        ProjectScopeKey scope, string idempotencyKey, Guid proposedRunId,
        CancellationToken cancellationToken = default);

    Task<bool> ReconcilePersistedRunAsync(
        ProjectScopeKey scope, string idempotencyKey, Guid runId,
        CancellationToken cancellationToken = default);
}
