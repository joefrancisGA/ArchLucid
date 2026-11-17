using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface ISecureNowInvestigationEffortInputService
{
    Task<SecureNowInvestigationEffortInputsResponse?> TryGetLatestAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default);

    Task<SecureNowInvestigationEffortInputsSaveResult> SaveAsync(
        ScopeContext scope,
        SecureNowInvestigationEffortInputsWriteRequest request,
        string actorUserId,
        CancellationToken cancellationToken = default);
}
