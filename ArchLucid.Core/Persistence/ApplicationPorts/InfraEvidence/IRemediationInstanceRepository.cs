namespace ArchLucid.Persistence.InfraEvidence;

public interface IRemediationInstanceRepository
{
    Task InsertInstanceAsync(RemediationInstanceRecord instance, CancellationToken cancellationToken = default);

    Task UpdateInstanceAsync(RemediationInstanceRecord instance, CancellationToken cancellationToken = default);

    Task<RemediationInstanceRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid instanceId,
        CancellationToken cancellationToken = default);

    Task InsertEvidenceAsync(RemediationEvidenceRecord evidence, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationEvidenceRecord>> ListEvidenceByInstanceAsync(
        Guid tenantId,
        Guid instanceId,
        CancellationToken cancellationToken = default);
}
