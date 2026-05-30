using System.Globalization;
using System.Text;

using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Exports;
using ArchLucid.Core.Explanation;
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
    IRunExplanationSummaryService runExplanationSummaryService,
    ITenantReviewBoardCoverLogoStore? tenantReviewBoardCoverLogoStore,
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

    private readonly IRunExplanationSummaryService _runExplanationSummaryService =
        runExplanationSummaryService ?? throw new ArgumentNullException(nameof(runExplanationSummaryService));

    private readonly ArchitectureReviewDocxBuilder _docxBuilder =
        docxBuilder ?? throw new ArgumentNullException(nameof(docxBuilder));

    private readonly ArchitectureReviewPdfBuilder _pdfBuilder =
        pdfBuilder ?? throw new ArgumentNullException(nameof(pdfBuilder));

    private readonly ITenantReviewBoardCoverLogoStore? _tenantReviewBoardCoverLogoStore = tenantReviewBoardCoverLogoStore;

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

        string? tenantDisplayName = await ResolveTenantDisplayNameAsync(cancellationToken).ConfigureAwait(false);
        string? explanationCallout = await TryBuildExplanationConfidenceCalloutAsync(detail, cancellationToken).ConfigureAwait(false);

        ArchitectureReviewBoardExportDocumentModel documentModel =
            ArchitectureReviewBoardExportDocumentFactory.Create(
                detail,
                report,
                httpCorrelationId,
                extractorTimestampUtcLabel: null,
                tenantDisplayName: tenantDisplayName,
                explanationConfidenceCallout: explanationCallout);

        string? activeTrialExportNotice = await ResolveActiveTrialExportNoticeAsync(cancellationToken).ConfigureAwait(false);

        byte[]? resolvedLogoBytes = logoImageBytes;

        if (resolvedLogoBytes is null && _tenantReviewBoardCoverLogoStore is not null)
            resolvedLogoBytes = await _tenantReviewBoardCoverLogoStore.TryGetBytesAsync(cancellationToken).ConfigureAwait(false);

        string safeSegment = SanitizeRunIdForFileName(documentModel.RunId);

        switch (format)
        {
            case ExportFormat.Docx:
            {
                byte[] bytes = await _docxBuilder.BuildAsync(
                    documentModel,
                    whitelabel,
                    resolvedLogoBytes,
                    activeTrialExportNotice,
                    cancellationToken);

                MemoryStream stream = new(bytes);

                return new ExportResult(stream, "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    $"architecture-review-board-{safeSegment}.docx");
            }

            case ExportFormat.Pdf:
            {
                byte[] bytes = await _pdfBuilder.BuildAsync(
                    documentModel,
                    whitelabel,
                    resolvedLogoBytes,
                    activeTrialExportNotice,
                    cancellationToken);

                MemoryStream stream = new(bytes);

                return new ExportResult(stream, "application/pdf", $"architecture-review-board-{safeSegment}.pdf");
            }

            case ExportFormat.Html:
            {
                byte[] bytes = Encoding.UTF8.GetBytes(BuildMinimalHtml(documentModel));
                MemoryStream stream = new(bytes);

                return new ExportResult(stream, "text/html; charset=utf-8", $"architecture-review-board-{safeSegment}.html");
            }

            default:
                throw new ArgumentOutOfRangeException(nameof(format), format, "Unsupported export format.");
        }
    }

    private async Task<string?> ResolveActiveTrialExportNoticeAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
            return null;

        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        return ActiveTrialExportNoticeFormatter.Format(tenant);
    }

    private async Task<string?> ResolveTenantDisplayNameAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
            return null;

        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null || string.IsNullOrWhiteSpace(tenant.Name))
            return null;

        return tenant.Name.Trim();
    }

    private async Task<string?> TryBuildExplanationConfidenceCalloutAsync(
        ArchitectureRunDetail detail,
        CancellationToken cancellationToken)
    {
        string runId = detail.Run.RunId ?? string.Empty;

        if (!TryParseRunGuid(runId, out Guid runGuid))
            return null;

        try
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            RunExplanationSummary? summary = await _runExplanationSummaryService
                .GetSummaryAsync(scope, runGuid, cancellationToken)
                .ConfigureAwait(false);

            if (summary is null)
                return null;

            RunExplanationConfidenceSignals signals = RunExplanationConfidenceCalloutBuilder.FromSummary(summary);

            return RunExplanationConfidenceCalloutBuilder.BuildExportCallout(signals);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return null;
        }
    }

    private static bool TryParseRunGuid(string runId, out Guid runGuid)
    {
        runGuid = Guid.Empty;

        if (string.IsNullOrWhiteSpace(runId))
            return false;

        if (Guid.TryParse(runId, out runGuid))
            return true;

        if (runId.Length >= 32 && Guid.TryParseExact(runId[..32], "N", out runGuid))
            return true;

        return false;
    }

    private static string BuildMinimalHtml(ArchitectureReviewBoardExportDocumentModel documentModel)
    {
        ArgumentNullException.ThrowIfNull(documentModel);

        string title = string.IsNullOrWhiteSpace(documentModel.SystemName)
            ? "Architecture review"
            : documentModel.SystemName.Trim();
        string summary = string.IsNullOrWhiteSpace(documentModel.ExecutiveSummary)
            ? "No executive summary is available for this review."
            : documentModel.ExecutiveSummary.Trim();

        StringBuilder html = new();
        html.AppendLine("<!DOCTYPE html>");
        html.AppendLine("<html lang=\"en\">");
        html.AppendLine("<head>");
        html.AppendLine("<meta charset=\"utf-8\" />");
        html.AppendLine(CultureInfo.InvariantCulture, $"<title>{HtmlEncode(title)}</title>");
        html.AppendLine("</head>");
        html.AppendLine("<body>");
        html.AppendLine(CultureInfo.InvariantCulture, $"<h1>{HtmlEncode(title)}</h1>");
        html.AppendLine(CultureInfo.InvariantCulture, $"<p><strong>Run:</strong> {HtmlEncode(documentModel.RunId)}</p>");

        if (!string.IsNullOrWhiteSpace(documentModel.ManifestVersion))
        {
            html.AppendLine(
                CultureInfo.InvariantCulture,
                $"<p><strong>Manifest version:</strong> {HtmlEncode(documentModel.ManifestVersion)}</p>");
        }

        html.AppendLine("<h2>Summary</h2>");
        html.AppendLine(CultureInfo.InvariantCulture, $"<p>{HtmlEncode(summary)}</p>");
        html.AppendLine("</body>");
        html.AppendLine("</html>");

        return html.ToString();
    }

    private static string HtmlEncode(string value)
    {
        return System.Net.WebUtility.HtmlEncode(value);
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
