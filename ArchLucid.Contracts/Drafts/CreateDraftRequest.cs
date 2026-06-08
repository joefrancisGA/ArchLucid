namespace ArchLucid.Contracts.Drafts;

/// <summary>Body for <c>POST /v1/architecture/draft</c>.</summary>
public sealed class CreateDraftRequest
{
    /// <summary>Initial free-text intent (minimum 10 characters after trim).</summary>
    public string FreeTextIntent
    {
        get;
        set;
    } = string.Empty;
}
