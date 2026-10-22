namespace ArchLucid.Application.Drafts;

/// <summary>Stable <see cref="Contracts.Requests.ArchitectureRequest.RequestId" /> derived from a draft id (ADR 0048 submit).</summary>
public static class DraftSpawnedArchitectureRequestId
{
    /// <summary>Returns the 32-character hex representation of <paramref name="draftId" /> (no dashes).</summary>
    public static string FromDraftId(Guid draftId) => draftId.ToString("N");
}
