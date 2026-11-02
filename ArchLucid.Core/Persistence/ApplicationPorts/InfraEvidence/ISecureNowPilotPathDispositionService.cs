using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface ISecureNowPilotPathDispositionService
{
    Task<SecureNowPilotPathDispositionResponse?> TryGetLatestAsync(
        ScopeContext scope,
        Guid pathId,
        CancellationToken cancellationToken = default);

    Task<SecureNowPilotPathDispositionSaveResult> SaveAsync(
        ScopeContext scope,
        Guid pathId,
        SecureNowPilotPathDispositionWriteRequest request,
        string actorUserId,
        CancellationToken cancellationToken = default);
}
