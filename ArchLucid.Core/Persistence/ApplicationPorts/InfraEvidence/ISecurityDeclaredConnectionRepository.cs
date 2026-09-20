using ArchLucid.Core.Scoping;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public interface ISecurityDeclaredConnectionRepository
{
    Task InsertAsync(SecurityDeclaredConnectionRecord record, CancellationToken cancellationToken = default);

    Task<SecurityDeclaredConnectionRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid connectionId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SecurityDeclaredConnectionRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);

    async Task<SecurityDeclaredConnectionRecord?> TryGetByIdInScopeAsync(
        ProjectScopeKey scope,
        Guid connectionId,
        CancellationToken cancellationToken = default)
    {
        SecurityDeclaredConnectionRecord? record =
            await TryGetByIdAsync(scope.TenantId, connectionId, cancellationToken);

        return record is not null
               && scope.Matches(record.TenantId, record.WorkspaceId, record.ProjectId)
            ? record
            : null;
    }

    async Task<IReadOnlyList<SecurityDeclaredConnectionRecord>> ListByScopeAsync(
        ProjectScopeKey scope,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<SecurityDeclaredConnectionRecord> records =
            await ListByTenantAsync(scope.TenantId, cancellationToken);

        return records
            .Where(record => scope.Matches(record.TenantId, record.WorkspaceId, record.ProjectId))
            .ToList();
    }

    Task<SecurityDeclaredConnectionRecord?> TryGetActiveDuplicateAsync(
        Guid tenantId,
        Guid fromCloudResourceId,
        Guid toCloudResourceId,
        SecurityDeclaredConnectionRelationshipType relationshipType,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SecurityDeclaredConnectionRecord>> ListActiveByTenantAsync(
        Guid tenantId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SecurityDeclaredConnectionRecord>> MarkExpiredAsync(
        Guid tenantId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);

    Task MarkExpiryProcessedAsync(
        Guid tenantId,
        Guid connectionId,
        DateTime processedUtc,
        CancellationToken cancellationToken = default);

    Task RevokeAsync(
        Guid tenantId,
        Guid connectionId,
        string revokedByActorKey,
        DateTime revokedUtc,
        CancellationToken cancellationToken = default);

    Task UpdateRenewalAsync(
        SecurityDeclaredConnectionRecord record,
        CancellationToken cancellationToken = default);
}
