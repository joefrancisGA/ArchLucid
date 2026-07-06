namespace ArchLucid.Contracts.Drafts;

/// <summary>Body for <c>POST /v1/architecture/draft</c>.</summary>
public sealed class CreateDraftRequest
{
    /// <summary>Initial free-text intent (minimum <see cref="DraftIntakeValidation.MinimumFreeTextIntentLength" /> characters after trim).</summary>
    public string FreeTextIntent
    {
        get;
        set;
    } = string.Empty;
}
