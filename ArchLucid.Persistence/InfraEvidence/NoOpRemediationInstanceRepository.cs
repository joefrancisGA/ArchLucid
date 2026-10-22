using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpRemediationInstanceRepository : IRemediationInstanceRepository
{
    public Task InsertInstanceAsync(RemediationInstanceRecord instance, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task UpdateInstanceAsync(RemediationInstanceRecord instance, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task<RemediationInstanceRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid instanceId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<RemediationInstanceRecord?>(null);

    public Task InsertEvidenceAsync(RemediationEvidenceRecord evidence, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task<IReadOnlyList<RemediationEvidenceRecord>> ListEvidenceByInstanceAsync(
        Guid tenantId,
        Guid instanceId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<RemediationEvidenceRecord>>([]);

    public Task<IReadOnlyList<RemediationInstanceRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<RemediationInstanceRecord>>([]);

    public Task<(IReadOnlyList<RemediationInstanceRecord> Items, int TotalCount)> ListByCloudResourceIdPagedAsync(
        Guid tenantId,
        Guid cloudResourceId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<(IReadOnlyList<RemediationInstanceRecord> Items, int TotalCount)>(([], 0));

    public Task<IReadOnlyList<RemediationInstanceRecord>> ListByFindingIdAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<RemediationInstanceRecord>>([]);
}
