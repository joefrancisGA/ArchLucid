namespace ArchLucid.Contracts.Drafts;

/// <summary>Shared validation thresholds for guided draft intake (<c>POST /v1/architecture/draft</c>).</summary>
public static class DraftIntakeValidation
{
    /// <summary>Minimum trimmed <see cref="CreateDraftRequest.FreeTextIntent" /> length for admission-quality context.</summary>
    public const int MinimumFreeTextIntentLength = 100;
}
