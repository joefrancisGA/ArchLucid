namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpSecurityEvidencePathRoutingRepository : ISecurityEvidencePathRoutingRepository
{
    public Task<IReadOnlyList<SecurityEvidencePathRoutingRecord>> ListByPathIdAsync(
        Guid tenantId,
        Guid pathId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<SecurityEvidencePathRoutingRecord>>([]);

    public Task ReplaceRoutingForPathAsync(
        Guid tenantId,
        Guid pathId,
        IReadOnlyList<SecurityEvidencePathRoutingRecord> routingRows,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
