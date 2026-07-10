namespace ArchLucid.Application.Pilots;

/// <summary>Build-time metadata for static product-documentation PDFs (TB-723).</summary>
public sealed class ProductDocumentationPdfRenderMetadata
{
    public required string Title { get; init; }

    public string? VersionDateLabel { get; init; }

    public string? AudienceLabel { get; init; }

    public string? StatusLabel { get; init; }

    /// <summary>Optional raster logo path (PNG/JPEG) resolved at CLI build time.</summary>
    public string? LogoPath { get; init; }
}
