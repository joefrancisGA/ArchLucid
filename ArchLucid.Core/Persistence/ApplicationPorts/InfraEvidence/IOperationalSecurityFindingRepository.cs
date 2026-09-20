using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IOperationalSecurityFindingRepository
{
    Task<OperationalSecurityFindingRecord?> TryGetByNaturalKeyAsync(
        Guid tenantId,
        CloudProvider provider,
        string sourceSystem,
        string sourceFindingId,
        CancellationToken cancellationToken = default);

    Task<OperationalSecurityFindingRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default);

    async Task<OperationalSecurityFindingRecord?> TryGetByNaturalKeyInScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CloudProvider provider,
        string sourceSystem,
        string sourceFindingId,
        CancellationToken cancellationToken = default)
    {
        OperationalSecurityFindingRecord? record = await TryGetByNaturalKeyAsync(
            tenantId,
            provider,
            sourceSystem,
            sourceFindingId,
            cancellationToken);

        return record is not null
               && record.WorkspaceId == workspaceId
               && record.ProjectId == projectId
            ? record
            : null;
    }

    async Task<OperationalSecurityFindingRecord?> TryGetByIdInScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid findingId,
        CancellationToken cancellationToken = default)
    {
        OperationalSecurityFindingRecord? record =
            await TryGetByIdAsync(tenantId, findingId, cancellationToken);

        return record is not null
               && record.WorkspaceId == workspaceId
               && record.ProjectId == projectId
            ? record
            : null;
    }

    Task<IReadOnlyList<OperationalSecurityFindingRecord>> ListByTenantAsync(
        Guid tenantId,
        OperationalSecurityFindingStatus? status,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<OperationalSecurityFindingRecord> Items, int TotalCount)> ListByCloudResourceIdPagedAsync(
        Guid tenantId,
        Guid cloudResourceId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Guid>> ListFindingIdsByPathIdAsync(
        Guid tenantId,
        Guid pathId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<OperationalSecurityFindingMetadataRecord>> ListMetadataByFindingAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<OperationalSecurityFindingObservationRecord>> ListObservationsByFindingAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default);

    Task InsertAsync(
        OperationalSecurityFindingRecord finding,
        IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
        OperationalSecurityFindingObservationRecord observation,
        CancellationToken cancellationToken = default);

    Task UpdateAsync(
        OperationalSecurityFindingRecord finding,
        IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
        OperationalSecurityFindingObservationRecord? observation,
        CancellationToken cancellationToken = default);
}
