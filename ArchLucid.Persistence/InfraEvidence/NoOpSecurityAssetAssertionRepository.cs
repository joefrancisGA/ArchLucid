using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpSecurityAssetAssertionRepository : ISecurityAssetAssertionRepository
{
    public Task InsertAsync(SecurityAssetAssertionRecord record, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task<SecurityAssetAssertionRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid assertionId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<SecurityAssetAssertionRecord?>(null);

    public Task<IReadOnlyList<SecurityAssetAssertionRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<SecurityAssetAssertionRecord>>([]);

    public Task<SecurityAssetAssertionRecord?> TryGetActiveByCloudResourceIdAsync(
        Guid tenantId,
        Guid cloudResourceId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<SecurityAssetAssertionRecord?>(null);

    public Task<IReadOnlyList<Guid>> ListActiveAssertionIdsAsync(
        Guid tenantId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<Guid>>([]);

    public Task<IReadOnlyList<SecurityAssetAssertionRecord>> MarkExpiredAsync(
        Guid tenantId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<SecurityAssetAssertionRecord>>([]);

    public Task MarkExpiryProcessedAsync(
        Guid tenantId,
        Guid assertionId,
        DateTime processedUtc,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task RevokeAsync(
        Guid tenantId,
        Guid assertionId,
        string revokedByActorKey,
        DateTime revokedUtc,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task UpdateRenewalAsync(
        SecurityAssetAssertionRecord record,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
