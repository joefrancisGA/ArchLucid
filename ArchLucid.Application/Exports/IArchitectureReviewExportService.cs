using ArchLucid.Contracts.Exports;

namespace ArchLucid.Application.Exports;

/// <summary>
///     Builds architecture review board export artifacts for a persisted review aggregate.
/// </summary>
public interface IArchitectureReviewExportService
{
    /// <summary>
    ///     Generates a review-board export for <paramref name="reviewId" /> using <paramref name="format" />.
    /// </summary>
    /// <param name="reviewId">Stable identifier for the architecture review instance.</param>
    /// <param name="format">Target binary format.</param>
    /// <param name="whitelabel">Optional consultant branding; validated when non-null.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Stream-backed payload; caller disposes <see cref="ExportResult.Content" />.</returns>
    Task<ExportResult> GenerateReportAsync(Guid reviewId, ExportFormat format, WhitelabelConfiguration? whitelabel,
        CancellationToken cancellationToken);
}
