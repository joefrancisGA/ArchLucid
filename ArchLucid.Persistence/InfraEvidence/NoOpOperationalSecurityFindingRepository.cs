using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpOperationalSecurityFindingRepository : IOperationalSecurityFindingRepository
{
    public Task<OperationalSecurityFindingRecord?> TryGetByNaturalKeyAsync(
        Guid tenantId,
        CloudProvider provider,
        string sourceSystem,
        string sourceFindingId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<OperationalSecurityFindingRecord?>(null);

    public Task<OperationalSecurityFindingRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<OperationalSecurityFindingRecord?>(null);

    public Task<IReadOnlyList<OperationalSecurityFindingRecord>> ListByTenantAsync(
        Guid tenantId,
        OperationalSecurityFindingStatus? status,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<OperationalSecurityFindingRecord>>([]);

    public Task<IReadOnlyList<OperationalSecurityFindingMetadataRecord>> ListMetadataByFindingAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<OperationalSecurityFindingMetadataRecord>>([]);

    public Task<IReadOnlyList<OperationalSecurityFindingObservationRecord>> ListObservationsByFindingAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<OperationalSecurityFindingObservationRecord>>([]);

    public Task InsertAsync(
        OperationalSecurityFindingRecord finding,
        IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
        OperationalSecurityFindingObservationRecord observation,
        CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task UpdateAsync(
        OperationalSecurityFindingRecord finding,
        IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
        OperationalSecurityFindingObservationRecord? observation,
        CancellationToken cancellationToken = default)
        => Task.CompletedTask;
}
