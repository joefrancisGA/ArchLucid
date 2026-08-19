namespace ArchLucid.Persistence.Integrations;

/// <summary>ITSM external ticket â†” ArchLucid finding linkage; uses non-RLS SQL for inbound webhooks.</summary>
public interface IItsmFindingCorrelationRepository
{
    Task<ItsmFindingCorrelationRecord?> TryGetByExternalKeyAsync(
        string provider,
        string externalKey,
        CancellationToken ct);

    Task<ItsmFindingCorrelationRecord?> TryGetByExternalKeyForTenantAsync(
        Guid tenantId,
        string provider,
        string externalKey,
        CancellationToken ct);

    Task<ItsmFindingCorrelationRecord?> TryGetByFindingAndProviderAsync(
        Guid tenantId,
        string findingId,
        string provider,
        CancellationToken ct);

    Task<IReadOnlyList<ItsmFindingCorrelationRecord>> ListByFindingAsync(
        Guid tenantId,
        string findingId,
        CancellationToken ct);

    Task<IReadOnlyList<ItsmFindingCorrelationRecord>> ListByFindingsAsync(
        Guid tenantId,
        IReadOnlyList<string> findingIds,
        CancellationToken ct);

    Task RegisterAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string findingId,
        string provider,
        string externalKey,
        string? externalSysId,
        Guid? findingRecordId,
        CancellationToken ct);

    /// <summary>Resolves the scoped finding row for an authority run + logical finding id.</summary>
    Task<Guid?> TryResolveFindingRecordIdForRunFindingAsync(
        Guid tenantId,
        Guid runId,
        string findingId,
        CancellationToken ct);

    /// <summary>Resolves the latest committed snapshot row for a tenant-wide logical finding id.</summary>
    Task<Guid?> TryResolveLatestCommittedFindingRecordIdAsync(
        Guid tenantId,
        string findingId,
        CancellationToken ct);

    Task<ItsmFindingCorrelationUpdateResult> UpdateExternalTrackingAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string findingId,
        string provider,
        string externalKey,
        string? externalSysId,
        CancellationToken ct);

    Task<ItsmFindingCorrelationRecord?> RemoveByFindingAndProviderAsync(
        Guid tenantId,
        string findingId,
        string provider,
        CancellationToken ct);

    Task<int> UpdateHumanReviewStatusForFindingAsync(
        Guid tenantId,
        string findingId,
        string humanReviewStatus,
        Guid? findingRecordId,
        CancellationToken ct);

    /// <summary>Returns whether the intended <c>dbo.FindingRecords</c> row exists for inbound sync.</summary>
    Task<bool> FindingRecordExistsAsync(
        Guid tenantId,
        string findingId,
        Guid? findingRecordId,
        CancellationToken ct);
}
