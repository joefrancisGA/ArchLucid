namespace ArchLucid.Persistence.InfraEvidence;

public interface IRemediationPrioritizationRepository
{
    Task<RemediationPrioritizationWeightsRecord?> TryGetWeightsAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);

    Task UpsertWeightsAsync(
        RemediationPrioritizationWeightsRecord weights,
        CancellationToken cancellationToken = default);

    Task UpsertScoreAsync(
        RemediationPrioritizationScoreRecord score,
        CancellationToken cancellationToken = default);

    Task<RemediationPrioritizationScoreRecord?> TryGetScoreAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationPrioritizationScoreRecord>> ListScoresByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);
}
