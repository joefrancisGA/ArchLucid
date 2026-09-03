using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Exports;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Exports;

/// <summary>
///     Orchestrates finalized-review exports (DOCX/PDF) using hydrated run detail + analysis projection.
/// </summary>
public sealed partial class ArchitectureReviewExportService(
    IRunDetailQueryService runDetailQueryService,
    IArchitectureAnalysisService architectureAnalysisService,
    IScopeContextProvider scopeContextProvider,
    ITenantRepository tenantRepository,
    IRunExplanationSummaryService runExplanationSummaryService,
    ITenantReviewBoardCoverLogoStore? tenantReviewBoardCoverLogoStore,
    ArchitectureReviewDocxBuilder docxBuilder,
    ArchitectureReviewPdfBuilder pdfBuilder) : IArchitectureReviewExportService
{
    /// <inheritdoc/>
    public async Task<ExportResult> GenerateReportAsync(string runId, ExportFormat format, WhitelabelConfiguration? whitelabel,
        byte[]? logoImageBytes, string? httpCorrelationId, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        ArchitectureReviewBoardCoverLogoValidator.ValidateLogoOptional(logoImageBytes);

        ArchitectureRunDetail? detail = await runDetailQueryService.GetRunDetailAsync(runId.Trim(), cancellationToken);

        if (detail is null)
            throw new RunNotFoundException(runId.Trim());

        if (detail.HasBrokenManifestReference)
            throw new ConflictException(
                "This finalized review references an architecture snapshot that could not be loaded from storage. Resolve the broken manifest reference before exporting.");

        AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow(detail, runId.Trim());

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

        ArchitectureAnalysisReport report = await architectureAnalysisService.BuildAsync(analysisRequest, cancellationToken);

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

        if (resolvedLogoBytes is null && tenantReviewBoardCoverLogoStore is not null)
            resolvedLogoBytes = await tenantReviewBoardCoverLogoStore.TryGetBytesAsync(cancellationToken).ConfigureAwait(false);

        string safeSegment = SanitizeRunIdForFileName(documentModel.RunId);

        switch (format)
        {
            case ExportFormat.Docx:
                return await BuildDocxExportAsync(
                    documentModel,
                    whitelabel,
                    resolvedLogoBytes,
                    activeTrialExportNotice,
                    safeSegment,
                    cancellationToken);

            case ExportFormat.Pdf:
                return await BuildPdfExportAsync(
                    documentModel,
                    whitelabel,
                    resolvedLogoBytes,
                    activeTrialExportNotice,
                    safeSegment,
                    cancellationToken);

            case ExportFormat.Html:
                return BuildHtmlExport(documentModel, activeTrialExportNotice, safeSegment);

            default:
                throw new ArgumentOutOfRangeException(nameof(format), format, "Unsupported export format.");
        }
    }
}
