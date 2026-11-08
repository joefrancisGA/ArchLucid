using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.ApplicationPorts.SecureNow;

public interface ICollectionTriggerClaimRepository
{
    Task<(bool Acquired, Guid RunId, byte State)> TryReserveAsync(
        ProjectScopeKey scope, string idempotencyKey, Guid proposedRunId,
        CancellationToken cancellationToken = default);
    Task<bool> ReconcilePersistedRunAsync(
        ProjectScopeKey scope, string idempotencyKey, Guid runId,
        CancellationToken cancellationToken = default);
}
