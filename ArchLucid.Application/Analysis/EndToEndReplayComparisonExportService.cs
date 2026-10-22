namespace ArchLucid.Application.Analysis;

/// <summary>
///     Generates exportable artifacts (Markdown, HTML, DOCX, PDF) from an
///     <see cref = "EndToEndReplayComparisonReport"/>. Output verbosity is controlled by the
///     <see cref = "EndToEndComparisonExportProfile"/> constants (<c>detailed</c>, <c>sponsor</c>, <c>short</c>).
/// </summary>
public sealed class EndToEndReplayComparisonExportService(IEndToEndReplayComparisonSummaryFormatter summaryFormatter) : IEndToEndReplayComparisonExportService
{
    private readonly IEndToEndReplayComparisonSummaryFormatter
        _summaryFormatter = summaryFormatter ?? throw new ArgumentNullException(nameof(summaryFormatter));

    /// <summary>
    ///     Renders <paramref name = "report"/> as a Markdown document under the given export <paramref name = "profile"/>.
    ///     Defaults to <see cref = "EndToEndComparisonExportProfile.Default"/> when <paramref name = "profile"/> is <c>null</c>.
    /// </summary>
    public string GenerateMarkdown(EndToEndReplayComparisonReport report, string? profile = null)
    {
        ArgumentNullException.ThrowIfNull(report);
        return EndToEndReplayComparisonMarkdownExportFormatter.Generate(_summaryFormatter, report, profile);
    }

    /// <summary>
    ///     Renders <paramref name = "report"/> as a self-contained HTML document under the given export
    ///     <paramref name = "profile"/>.
    /// </summary>
    public string GenerateHtml(EndToEndReplayComparisonReport report, string? profile = null)
    {
        ArgumentNullException.ThrowIfNull(report);
        return EndToEndReplayComparisonHtmlExportFormatter.Generate(_summaryFormatter, report, profile);
    }

    /// <summary>
    ///     Renders <paramref name = "report"/> as a DOCX byte array using OpenXml under the given export
    ///     <paramref name = "profile"/>.
    /// </summary>
    public Task<byte[]> GenerateDocxAsync(EndToEndReplayComparisonReport report, CancellationToken cancellationToken = default, string? profile = null)
    {
        ArgumentNullException.ThrowIfNull(report);
        return EndToEndReplayComparisonDocxExportFormatter.GenerateAsync(_summaryFormatter, report, cancellationToken, profile);
    }

    /// <summary>
    ///     Renders <paramref name = "report"/> as a PDF byte array using QuestPDF under the given export
    ///     <paramref name = "profile"/>.
    /// </summary>
    public Task<byte[]> GeneratePdfAsync(EndToEndReplayComparisonReport report, CancellationToken cancellationToken = default, string? profile = null)
    {
        ArgumentNullException.ThrowIfNull(report);
        return EndToEndReplayComparisonPdfExportFormatter.GenerateAsync(_summaryFormatter, report, cancellationToken, profile);
    }
}
