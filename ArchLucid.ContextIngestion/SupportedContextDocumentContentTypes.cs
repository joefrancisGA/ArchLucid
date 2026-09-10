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

    /// <summary>
    ///     Mermaid flowchart / C4 source posted as raw text for server-side structured parse (AS-007).
    /// </summary>
    public const string Mermaid = "text/vnd.mermaid";

    /// <summary>
    ///     Sanitized SVG diagram source for server-side structured parse (AS-008). Raw <c>image/svg+xml</c> remains forbidden.
    /// </summary>
    public const string StructuredDiagramSvg = "application/vnd.archlucid.diagram+svg";

    /// <summary>
    ///     Uncompressed draw.io / diagrams.net <c>mxfile</c> XML (AS-009).
    /// </summary>
    public const string DrawIoXml = "application/vnd.jgraph.mxfile";

    /// <summary>
    ///     Visio <c>.vsdx</c> Open Packaging zip posted as base64 (AS-010). Legacy <c>.vsd</c> remains unsupported.
    /// </summary>
    public const string VisioVsdx = "application/vnd.ms-visio.drawing.main+xml";

    public static readonly IReadOnlyList<string> All =
    [
        "text/plain",
        "text/markdown",
        StructuredDiagramJson,
        Mermaid,
        StructuredDiagramSvg,
        DrawIoXml,
        VisioVsdx,
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

    public static bool IsStructuredDiagramJsonContentType(string? contentType)
    {
        return !string.IsNullOrWhiteSpace(contentType)
               && string.Equals(contentType.Trim(), StructuredDiagramJson, StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsMermaidContentType(string? contentType)
    {
        return !string.IsNullOrWhiteSpace(contentType)
               && string.Equals(contentType.Trim(), Mermaid, StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsStructuredDiagramSvgContentType(string? contentType)
    {
        return !string.IsNullOrWhiteSpace(contentType)
               && string.Equals(contentType.Trim(), StructuredDiagramSvg, StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsDrawIoXmlContentType(string? contentType)
    {
        return !string.IsNullOrWhiteSpace(contentType)
               && string.Equals(contentType.Trim(), DrawIoXml, StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsVisioVsdxContentType(string? contentType)
    {
        return !string.IsNullOrWhiteSpace(contentType)
               && string.Equals(contentType.Trim(), VisioVsdx, StringComparison.OrdinalIgnoreCase);
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
