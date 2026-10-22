using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Contracts.Exports;

namespace ArchLucid.Application.Exports;

public sealed partial class ArchitectureReviewExportService
{
    private async Task<ExportResult> BuildPdfExportAsync(
        ArchitectureReviewBoardExportDocumentModel documentModel,
        WhitelabelConfiguration? whitelabel,
        byte[]? resolvedLogoBytes,
        string? activeTrialExportNotice,
        string safeSegment,
        CancellationToken cancellationToken)
    {
        byte[] bytes = await pdfBuilder.BuildAsync(
            documentModel,
            whitelabel,
            resolvedLogoBytes,
            activeTrialExportNotice,
            cancellationToken);

        MemoryStream stream = new(bytes);

        return new ExportResult(stream, "application/pdf", $"architecture-review-board-{safeSegment}.pdf");
    }
}
