using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models;

/// <summary>
///     Markdown (or markdown-shaped) golden-manifest export body for governance architecture routes —
///     distinct from <see cref="ArchLucid.Api.Contracts.ManifestSummaryResponse" /> (authority manifest counters/metadata).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class ManifestMarkdownDocumentResponse
{
    public string ManifestVersion
    {
        get;
        set;
    } = string.Empty;

    public string Format
    {
        get;
        set;
    } = "markdown";

    /// <summary>
    ///     Markdown content (preferred field).
    /// </summary>
    public string Content
    {
        get;
        set;
    } = string.Empty;

    /// <summary>
    ///     Back-compat field for older clients (same as <see cref="Content" />).
    /// </summary>
    public string Summary
    {
        get;
        set;
    } = string.Empty;
}
