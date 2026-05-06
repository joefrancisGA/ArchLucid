namespace ArchLucid.Persistence.Integrations;

/// <summary>ITSM external ticket ↔ ArchLucid finding linkage; uses non-RLS SQL for inbound webhooks.</summary>
public interface IItsmFindingCorrelationRepository
{
    Task<ItsmFindingCorrelationRecord?> TryGetByExternalKeyAsync(
        string provider,
        string externalKey,
        CancellationToken ct);

    Task RegisterAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string findingId,
        string provider,
        string externalKey,
        string? externalSysId,
        CancellationToken ct);

    Task<int> UpdateHumanReviewStatusForFindingAsync(
        Guid tenantId,
        string findingId,
        string humanReviewStatus,
        CancellationToken ct);
}
