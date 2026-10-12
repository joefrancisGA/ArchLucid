using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IVerifiedRemediationControlAssociationRepository
{
    Task<VerifiedRemediationControlAssociationRecord> UpsertAsync(
        ProjectScopeKey scope,
        VerifiedRemediationControlAssociationRecord record,
        CancellationToken cancellationToken = default);

    Task<VerifiedRemediationControlAssociationRecord?> TryGetAsync(
        ProjectScopeKey scope,
        Guid associationId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<VerifiedRemediationControlAssociationRecord>> ListByInstanceAsync(
        ProjectScopeKey scope,
        Guid instanceId,
        CancellationToken cancellationToken = default);
}
