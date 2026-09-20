using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IRemediationInstanceRepository
{
    Task InsertInstanceAsync(RemediationInstanceRecord instance, CancellationToken cancellationToken = default);

    Task UpdateInstanceAsync(RemediationInstanceRecord instance, CancellationToken cancellationToken = default);

    async Task UpdateInstanceInScopeAsync(
        ProjectScopeKey scope,
        RemediationInstanceRecord instance,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(instance);

        if (!scope.Matches(instance.TenantId, instance.WorkspaceId, instance.ProjectId))
            throw new InvalidOperationException("Remediation instance scope does not match the authorized project scope.");

        await UpdateInstanceAsync(instance, cancellationToken);
    }

    Task<RemediationInstanceRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid instanceId,
        CancellationToken cancellationToken = default);

    async Task<RemediationInstanceRecord?> TryGetByIdInScopeAsync(
        ProjectScopeKey scope,
        Guid instanceId,
        CancellationToken cancellationToken = default)
    {
        RemediationInstanceRecord? record =
            await TryGetByIdAsync(scope.TenantId, instanceId, cancellationToken);

        return record is not null
               && scope.Matches(record.TenantId, record.WorkspaceId, record.ProjectId)
            ? record
            : null;
    }

    Task InsertEvidenceAsync(RemediationEvidenceRecord evidence, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationEvidenceRecord>> ListEvidenceByInstanceAsync(
        Guid tenantId,
        Guid instanceId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationInstanceRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<RemediationInstanceRecord> Items, int TotalCount)> ListByCloudResourceIdPagedAsync(
        Guid tenantId,
        Guid cloudResourceId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationInstanceRecord>> ListByFindingIdAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default);
}
