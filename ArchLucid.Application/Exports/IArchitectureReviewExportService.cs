using ArchLucid.Contracts.Exports;

namespace ArchLucid.Application.Exports;

/// <summary>
///     Builds architecture review board export artifacts for a finalized review (committed architecture snapshot).
/// </summary>
public interface IArchitectureReviewExportService
{
    /// <summary>
    ///     Generates a review-board export for <paramref name="runId" /> using <paramref name="format" />.
    /// </summary>
    /// <param name="runId">Architecture review run identifier (<c>ArchitectureRun.RunId</c>).</param>
    /// <param name="format">Target binary format.</param>
    /// <param name="whitelabel">Optional consultant branding; validated when non-null.</param>
    /// <param name="logoImageBytes">Optional cover logo; validated as PNG/JPEG and max 2&nbsp;MB when non-null.</param>
    /// <param name="httpCorrelationId">Optional traceability header value echoed into the traceability appendix.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Stream-backed payload; caller disposes <see cref="ExportResult.Content" />.</returns>
    Task<ExportResult> GenerateReportAsync(string runId, ExportFormat format, WhitelabelConfiguration? whitelabel,
        byte[]? logoImageBytes, string? httpCorrelationId, CancellationToken cancellationToken);
}
