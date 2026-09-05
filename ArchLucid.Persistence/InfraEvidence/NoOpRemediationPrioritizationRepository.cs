namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpRemediationPrioritizationRepository : IRemediationPrioritizationRepository
{
    public Task<RemediationPrioritizationWeightsRecord?> TryGetWeightsAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<RemediationPrioritizationWeightsRecord?>(null);

    public Task UpsertWeightsAsync(
        RemediationPrioritizationWeightsRecord weights,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task UpsertScoreAsync(
        RemediationPrioritizationScoreRecord score,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task<RemediationPrioritizationScoreRecord?> TryGetScoreAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<RemediationPrioritizationScoreRecord?>(null);

    public Task<IReadOnlyList<RemediationPrioritizationScoreRecord>> ListScoresByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<RemediationPrioritizationScoreRecord>>([]);
}
