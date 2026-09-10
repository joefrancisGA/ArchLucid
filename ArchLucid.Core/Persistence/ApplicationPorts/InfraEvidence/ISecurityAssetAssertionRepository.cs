namespace ArchLucid.Persistence.InfraEvidence;

public interface ISecurityAssetAssertionRepository
{
    Task InsertAsync(SecurityAssetAssertionRecord record, CancellationToken cancellationToken = default);

    Task<SecurityAssetAssertionRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid assertionId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SecurityAssetAssertionRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);

    Task<SecurityAssetAssertionRecord?> TryGetActiveByCloudResourceIdAsync(
        Guid tenantId,
        Guid cloudResourceId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Guid>> ListActiveAssertionIdsAsync(
        Guid tenantId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SecurityAssetAssertionRecord>> MarkExpiredAsync(
        Guid tenantId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);

    Task MarkExpiryProcessedAsync(
        Guid tenantId,
        Guid assertionId,
        DateTime processedUtc,
        CancellationToken cancellationToken = default);

    Task RevokeAsync(
        Guid tenantId,
        Guid assertionId,
        string revokedByActorKey,
        DateTime revokedUtc,
        CancellationToken cancellationToken = default);

    Task UpdateRenewalAsync(
        SecurityAssetAssertionRecord record,
        CancellationToken cancellationToken = default);
}
