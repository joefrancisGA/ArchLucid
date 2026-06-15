namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Canonical Do Not Log categories for production diagnostic output (ADR 0053 / TB-330).
/// </summary>
/// <remarks>
///     Enforcement lives in <see cref="LogSanitizer" />, <see cref="ArchLucid.Core.Llm.Redaction.PromptRedactor" />,
///     and support-bundle redaction helpers — this type is the authoritative reference for PR review.
/// </remarks>
public static class LoggingPolicy
{
    /// <summary>
    ///     Categories of content that must never appear in unstructured logs, span tags, or metrics labels.
    /// </summary>
    public static readonly IReadOnlyList<string> NeverLogCategories =
    [
        "secrets_and_credentials",
        "connection_strings",
        "bearer_tokens_and_api_keys",
        "raw_customer_evidence",
        "full_llm_prompts",
        "full_llm_responses",
        "embedding_vectors",
        "pii_outside_explicit_audit_paths",
    ];
}
