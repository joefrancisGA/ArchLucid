using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Application.Drafts;

/// <summary>Builds <see cref="SubmitDraftResponse" /> for draft submit and replay paths.</summary>
public static class DraftSubmitResponseFactory
{
    /// <summary>Creates a submit response from draft and run linkage fields.</summary>
    public static SubmitDraftResponse Create(
        Guid draftId,
        DraftRequestStatus status,
        string runId,
        string requestId,
        string? parentSpawnedRunId) =>
        new()
        {
            DraftId = draftId,
            Status = status,
            RunId = runId,
            RequestId = requestId,
            ParentSpawnedRunId = parentSpawnedRunId,
        };
}
