namespace ArchLucid.Application.Drafts;

/// <summary>Conflict messaging when draft submit left a split-brain state (run exists without draft linkage).</summary>
public static class DraftSubmitSplitState
{
    /// <summary>HTTP 409 message when a draft is stuck in <c>Submitted</c> without <c>SpawnedRunId</c>.</summary>
    public static string ConflictMessage(Guid draftId) =>
        $"Draft '{draftId}' has an incomplete submit. Open the existing review or abandon the draft before submitting again.";
}
