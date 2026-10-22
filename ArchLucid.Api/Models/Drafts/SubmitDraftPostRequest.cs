namespace ArchLucid.Api.Models.Drafts;

/// <summary>Optional body for draft submit/start-review optimistic concurrency.</summary>
public sealed class SubmitDraftPostRequest
{
    public DateTime? ExpectedUpdatedUtc
    {
        get;
        init;
    }
}
