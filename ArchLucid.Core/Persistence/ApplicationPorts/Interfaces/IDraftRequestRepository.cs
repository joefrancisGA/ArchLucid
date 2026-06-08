using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Reads and writes <c>dbo.DraftRequests</c> for tenant-scoped Socratic intake drafts (ADR 0048).</summary>
public interface IDraftRequestRepository
{
    Task<DraftRequestResponse?> GetAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid draftId,
        CancellationToken cancellationToken);

    Task<DraftRequestResponse> CreateAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string createdByUserId,
        DraftRequestDocument document,
        CancellationToken cancellationToken);

    Task<DraftRequestResponse?> UpdateAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid draftId,
        DraftRequestStatus status,
        DraftRequestDocument document,
        string? redirectReason,
        string? spawnedRunId,
        CancellationToken cancellationToken);
}
