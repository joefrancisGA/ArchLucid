using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Application.Drafts;

/// <summary>Maps persisted draft documents to list summaries.</summary>
public static class DraftRequestSummaryMapper
{
    public static DraftRequestSummaryResponse FromResponse(DraftRequestResponse draft)
    {
        ArgumentNullException.ThrowIfNull(draft);

        return FromDocument(
            draft.DraftId,
            draft.Status,
            draft.Document,
            draft.SpawnedRunId,
            draft.CreatedByUserId,
            draft.CreatedUtc,
            draft.UpdatedUtc);
    }

    public static DraftRequestSummaryResponse FromDocument(
        Guid draftId,
        DraftRequestStatus status,
        DraftRequestDocument document,
        string? spawnedRunId,
        string createdByUserId,
        DateTime createdUtc,
        DateTime updatedUtc)
    {
        ArgumentNullException.ThrowIfNull(document);
        ArgumentException.ThrowIfNullOrWhiteSpace(createdByUserId);

        return new DraftRequestSummaryResponse
        {
            DraftId = draftId,
            Status = status,
            SystemName = string.IsNullOrWhiteSpace(document.SystemName) ? null : document.SystemName.Trim(),
            FreeTextIntent = document.FreeTextIntent.Trim(),
            SpawnedRunId = string.IsNullOrWhiteSpace(spawnedRunId) ? null : spawnedRunId.Trim(),
            CreatedByUserId = createdByUserId,
            CreatedUtc = createdUtc,
            UpdatedUtc = updatedUtc,
            ReviewReadinessValid = ArchitectureDraftReviewReadinessValidator.EvaluateBlockers(document).Count == 0,
        };
    }
}
