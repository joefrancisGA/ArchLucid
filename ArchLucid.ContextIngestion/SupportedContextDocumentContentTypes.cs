namespace ArchLucid.ContextIngestion;

/// <summary>
///     Canonical list of MIME types accepted for inline <see cref="Models.ContextDocumentReference" /> at the API
///     boundary.
///     Parsers (<see cref="Contracts.IContextDocumentParser" />) should register support for these (or a subset).
///     Structured diagram JSON reopens the allowlist per
///     <c>docs/library/ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT.md</c> (ADR 0084 / AS-003) — raster image/*
///     types remain forbidden.
/// </summary>
public static class SupportedContextDocumentContentTypes
{
    /// <summary>
    ///     Structured diagram payload serialized as <c>ArchitectureDiagramModelRecord</c> JSON (IE-18 family).
    ///     Parser wiring ships in AS-006+; until then ingestion may warn-skip unmatched parsers.
    /// </summary>
    public const string StructuredDiagramJson = "application/vnd.archlucid.diagram+json";

    public static readonly IReadOnlyList<string> All =
    [
        "text/plain",
        "text/markdown",
        StructuredDiagramJson,
    ];

    public static bool IsSupported(string? contentType)
    {
        return !string.IsNullOrWhiteSpace(contentType)
               && All.Contains(contentType.Trim(), StringComparer.OrdinalIgnoreCase);
    }

    public static bool IsPlainTextContentType(string? contentType)
    {
        return !string.IsNullOrWhiteSpace(contentType)
               && string.Equals(contentType.Trim(), "text/plain", StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsMarkdownContentType(string? contentType)
    {
        return !string.IsNullOrWhiteSpace(contentType)
               && string.Equals(contentType.Trim(), "text/markdown", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    ///     Fail-closed guard: raster and other image MIME types must never be posted as context documents.
    /// </summary>
    public static bool IsForbiddenImageContentType(string? contentType)
    {
        return !string.IsNullOrWhiteSpace(contentType)
               && contentType.Trim().StartsWith("image/", StringComparison.OrdinalIgnoreCase);
    }
}
