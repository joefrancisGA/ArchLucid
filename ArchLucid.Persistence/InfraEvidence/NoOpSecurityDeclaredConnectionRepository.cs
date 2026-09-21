using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpSecurityDeclaredConnectionRepository : ISecurityDeclaredConnectionRepository
{
    public Task InsertAsync(SecurityDeclaredConnectionRecord record, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task<SecurityDeclaredConnectionRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid connectionId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<SecurityDeclaredConnectionRecord?>(null);

    public Task<IReadOnlyList<SecurityDeclaredConnectionRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<SecurityDeclaredConnectionRecord>>([]);

    public Task<SecurityDeclaredConnectionRecord?> TryGetActiveDuplicateAsync(
        Guid tenantId,
        Guid fromCloudResourceId,
        Guid toCloudResourceId,
        SecurityDeclaredConnectionRelationshipType relationshipType,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<SecurityDeclaredConnectionRecord?>(null);

    public Task<IReadOnlyList<SecurityDeclaredConnectionRecord>> ListActiveByTenantAsync(
        Guid tenantId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<SecurityDeclaredConnectionRecord>>([]);

    public Task<IReadOnlyList<SecurityDeclaredConnectionRecord>> MarkExpiredAsync(
        Guid tenantId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<SecurityDeclaredConnectionRecord>>([]);

    public Task MarkExpiryProcessedAsync(
        Guid tenantId,
        Guid connectionId,
        DateTime processedUtc,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task RevokeAsync(
        Guid tenantId,
        Guid connectionId,
        string revokedByActorKey,
        DateTime revokedUtc,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task UpdateRenewalAsync(
        SecurityDeclaredConnectionRecord record,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
