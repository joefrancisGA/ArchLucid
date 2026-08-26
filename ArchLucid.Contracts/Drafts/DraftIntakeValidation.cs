namespace ArchLucid.Contracts.Drafts;

/// <summary>Shared validation thresholds for guided draft intake (<c>POST /v1/architecture/draft</c>).</summary>
public static class DraftIntakeValidation
{
    /// <summary>Minimum trimmed <see cref="CreateDraftRequest.FreeTextIntent" /> length for admission-quality context.</summary>
    public const int MinimumFreeTextIntentLength = 100;

    /// <summary>
    ///     Maximum trimmed architecture narrative paste size for draft documents and advisory intake endpoints
    ///     (overview rewrite, chat intake, draft parse). Sized for roughly 1000 pages of typical Word prose
    ///     (~350 words/page ≈ 2M characters).
    /// </summary>
    public const int MaximumFreeTextIntentLength = 2_000_000;
}
