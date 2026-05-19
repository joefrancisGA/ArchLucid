using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Exports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Exports;

/// <summary>
///     Orchestrates finalized-review exports (DOCX/PDF) using hydrated run detail + analysis projection.
/// </summary>
public sealed class ArchitectureReviewExportService(
    IRunDetailQueryService runDetailQueryService,
    IArchitectureAnalysisService architectureAnalysisService,
    IScopeContextProvider scopeContextProvider,
    ITenantRepository tenantRepository,
    ArchitectureReviewDocxBuilder docxBuilder,
    ArchitectureReviewPdfBuilder pdfBuilder) : IArchitectureReviewExportService
{
    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IArchitectureAnalysisService _architectureAnalysisService =
        architectureAnalysisService ?? throw new ArgumentNullException(nameof(architectureAnalysisService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly ArchitectureReviewDocxBuilder _docxBuilder =
        docxBuilder ?? throw new ArgumentNullException(nameof(docxBuilder));

    private readonly ArchitectureReviewPdfBuilder _pdfBuilder =
        pdfBuilder ?? throw new ArgumentNullException(nameof(pdfBuilder));

    /// <inheritdoc/>
    public async Task<ExportResult> GenerateReportAsync(string runId, ExportFormat format, WhitelabelConfiguration? whitelabel,
        byte[]? logoImageBytes, string? httpCorrelationId, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        ArchitectureReviewBoardCoverLogoValidator.ValidateLogoOptional(logoImageBytes);

        ArchitectureRunDetail? detail = await _runDetailQueryService.GetRunDetailAsync(runId.Trim(), cancellationToken);

        if (detail is null)
            throw new RunNotFoundException(runId.Trim());

        if (detail.HasBrokenManifestReference)
            throw new ConflictException(
                "This finalized review references an architecture snapshot that could not be loaded from storage. Resolve the broken manifest reference before exporting.");

        if (!detail.IsCommitted)
            throw new ConflictException("Export requires a finalized review with a committed architecture snapshot.");

        ArchitectureAnalysisRequest analysisRequest = new()
        {
            RunId = detail.Run.RunId,
            PreloadedRunDetail = detail,
            IncludeEvidence = true,
            IncludeExecutionTraces = true,
            IncludeManifest = true,
            IncludeDiagram = false,
            IncludeSummary = true,
            IncludeDeterminismCheck = false,
            IncludeManifestCompare = false,
            IncludeAgentResultCompare = false
        };

        ArchitectureAnalysisReport report = await _architectureAnalysisService.BuildAsync(analysisRequest, cancellationToken);

        ArchitectureReviewBoardExportDocumentModel documentModel =
            ArchitectureReviewBoardExportDocumentFactory.Create(detail, report, httpCorrelationId, extractorTimestampUtcLabel: null);

        string safeSegment = SanitizeRunIdForFileName(documentModel.RunId);

        switch (format)
        {
            case ExportFormat.Docx:
            {
                byte[] bytes = await _docxBuilder.BuildAsync(documentModel, whitelabel, logoImageBytes, cancellationToken);

                MemoryStream stream = new(bytes);

                return new ExportResult(stream, "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    $"architecture-review-board-{safeSegment}.docx");
            }

            case ExportFormat.Pdf:
            {
                bool includeActiveTrialExportNotice = await ShouldIncludeActiveTrialExportNoticeAsync(cancellationToken);
                byte[] bytes = await _pdfBuilder.BuildAsync(
                    documentModel,
                    whitelabel,
                    logoImageBytes,
                    includeActiveTrialExportNotice,
                    cancellationToken);

                MemoryStream stream = new(bytes);

                return new ExportResult(stream, "application/pdf", $"architecture-review-board-{safeSegment}.pdf");
            }

            default:
                throw new ArgumentOutOfRangeException(nameof(format), format, "Unsupported export format.");
        }
    }

    private async Task<bool> ShouldIncludeActiveTrialExportNoticeAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
            return false;

        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken);

        if (tenant is null)
            return false;

        return string.Equals(tenant.TrialStatus, TrialLifecycleStatus.Active, StringComparison.Ordinal);
    }

    private static string SanitizeRunIdForFileName(string runId)
    {
        string trimmed = runId.Trim();

        if (trimmed.Length == 0)
            return "run";

        foreach (char c in Path.GetInvalidFileNameChars())
            trimmed = trimmed.Replace(c, '_');

        return trimmed.Length <= 120 ? trimmed : trimmed[..120];
    }
}
