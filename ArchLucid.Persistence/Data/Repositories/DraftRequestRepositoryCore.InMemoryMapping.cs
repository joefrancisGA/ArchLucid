using System.Text.Json;

using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Persistence.Data.Repositories;

internal static partial class DraftRequestRepositoryCore
{
    public static DraftRequestResponse MapInMemoryStoredDraft(
        InMemoryDraftRequestStoredDraft stored,
        JsonSerializerOptions jsonOptions)
    {
        ArgumentNullException.ThrowIfNull(stored);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        return new DraftRequestResponse
        {
            DraftId = stored.DraftId,
            TenantId = stored.TenantId,
            WorkspaceId = stored.WorkspaceId,
            ProjectId = stored.ProjectId,
            Status = stored.Status,
            Document = CloneDocument(stored.Document, jsonOptions),
            RedirectReason = stored.RedirectReason,
            SpawnedRunId = stored.SpawnedRunId,
            SpawnedArchitectureVersionId = stored.SpawnedArchitectureVersionId,
            DocumentContentHashSha256 = stored.DocumentContentHashSha256,
            SpawnedDocumentContentHashSha256 = stored.SpawnedDocumentContentHashSha256,
            ArchitectureId = stored.ArchitectureId,
            CreatedByUserId = stored.CreatedByUserId,
            CreatedUtc = stored.CreatedUtc,
            UpdatedUtc = stored.UpdatedUtc,
        };
    }
}
