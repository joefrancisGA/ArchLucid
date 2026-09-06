using System.Text.Json;

using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Persistence.Data.Repositories;

internal static partial class DraftRequestRepositoryCore
{
    public const int MaxPriorDraftsCap = 25;
    public const int MaxReaperBatchSize = 10000;

    public static int ClampReaperBatchSize(int batchSize) => Math.Clamp(batchSize, 1, MaxReaperBatchSize);

    public static int ClampPriorDraftsMaxCount(int maxCount) => Math.Clamp(maxCount, 1, MaxPriorDraftsCap);

    public static string NormalizeSystemName(string systemName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(systemName);
        return systemName.Trim().ToUpperInvariant();
    }

    public static DraftRequestDocument CloneDocument(DraftRequestDocument document, JsonSerializerOptions options)
    {
        ArgumentNullException.ThrowIfNull(document);
        ArgumentNullException.ThrowIfNull(options);
        return JsonSerializer.Deserialize<DraftRequestDocument>(JsonSerializer.Serialize(document, options), options)
            ?? throw new InvalidOperationException("Failed to clone draft document.");
    }

    public static DraftRequestStatus ParseStatus(string status, Guid draftId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(status);

        if (!Enum.TryParse(status, true, out DraftRequestStatus parsed))
            throw new InvalidOperationException($"Draft {draftId} has invalid status '{status}'.");

        return parsed;
    }

    public static DraftRequestDocument DeserializeDocument(string json, Guid draftId, JsonSerializerOptions options)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(json);
        ArgumentNullException.ThrowIfNull(options);
        return JsonSerializer.Deserialize<DraftRequestDocument>(json, options)
            ?? throw new InvalidOperationException($"Draft {draftId} document JSON could not be deserialized.");
    }

    public static DraftRequestResponse MapToResponse(
        Guid draftId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DraftRequestStatus status,
        DraftRequestDocument document,
        string? redirectReason,
        string? spawnedRunId,
        string createdByUserId,
        DateTime createdUtc,
        DateTime updatedUtc,
        Guid? architectureId = null)
    {
        ArgumentNullException.ThrowIfNull(document);
        ArgumentException.ThrowIfNullOrWhiteSpace(createdByUserId);

        return new DraftRequestResponse
        {
            DraftId = draftId,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            ArchitectureId = architectureId,
            Status = status,
            Document = document,
            RedirectReason = redirectReason,
            SpawnedRunId = spawnedRunId,
            CreatedByUserId = createdByUserId,
            CreatedUtc = createdUtc,
            UpdatedUtc = updatedUtc,
        };
    }

    public static bool MatchesProjectScope(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid storedTenantId,
        Guid storedWorkspaceId,
        Guid storedProjectId) =>
        storedTenantId == tenantId && storedWorkspaceId == workspaceId && storedProjectId == projectId;

    public static bool IsTerminalReaperStatus(DraftRequestStatus status) =>
        status is DraftRequestStatus.Redirected or DraftRequestStatus.Abandoned;

    public static bool IsReaperEligible(DraftRequestStatus status, DateTime updatedUtc, DateTime updatedBeforeUtc) =>
        IsTerminalReaperStatus(status) && updatedUtc < updatedBeforeUtc;

    public static bool IsMutableDraftStatus(DraftRequestStatus status) =>
        status is DraftRequestStatus.Drafting or DraftRequestStatus.Admitted;

    public static bool MatchesChildBranch(Guid? documentParentDraftId, Guid parentDraftId) =>
        documentParentDraftId == parentDraftId;

    public static bool MatchesMutableSystemName(
        string? documentSystemName,
        string normalizedSystemName,
        Guid draftId,
        Guid? excludeDraftId)
    {
        if (draftId == excludeDraftId)
            return false;

        return !string.IsNullOrWhiteSpace(documentSystemName)
               && string.Equals(documentSystemName.Trim(), normalizedSystemName, StringComparison.OrdinalIgnoreCase);
    }

    public static bool MatchesRunSpawnedInScope(
        DraftRequestStatus status,
        Guid draftId,
        Guid excludeDraftId) =>
        status == DraftRequestStatus.RunSpawned && draftId != excludeDraftId;

    public static bool MatchesCreatorInWorkspace(
        string storedCreatedByUserId,
        DraftRequestStatus status,
        string createdByUserId,
        IReadOnlySet<DraftRequestStatus> statusFilter) =>
        string.Equals(storedCreatedByUserId, createdByUserId, StringComparison.Ordinal)
        && statusFilter.Contains(status);

    public static bool MatchesSpawnedRunId(string? storedSpawnedRunId, string spawnedRunId) =>
        string.Equals(storedSpawnedRunId, spawnedRunId, StringComparison.OrdinalIgnoreCase);

    public static void ValidateStatusFilter(IReadOnlyList<DraftRequestStatus> statuses)
    {
        if (statuses is null || statuses.Count == 0)
            throw new ArgumentException("At least one status filter is required.", nameof(statuses));
    }
}
