using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Exports;
using ArchLucid.Core.Explanation;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Application.Exports;

/// <summary>
///     Orchestrates finalized-review exports (DOCX/PDF) using hydrated run detail + analysis projection.
/// </summary>
public sealed partial class ArchitectureReviewExportService(
    IRunDetailQueryService runDetailQueryService,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    IGraphSnapshotRepository graphSnapshotRepository,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    IArchitectureAnalysisService architectureAnalysisService,
    IScopeContextProvider scopeContextProvider,
    ITenantRepository tenantRepository,
    IRunExplanationSummaryService runExplanationSummaryService,
    ITenantReviewBoardCoverLogoStore? tenantReviewBoardCoverLogoStore,
    IConfiguration configuration,
    ArchitectureReviewDocxBuilder docxBuilder,
    ArchitectureReviewPdfBuilder pdfBuilder) : IArchitectureReviewExportService
{
    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly IGraphSnapshotRepository _graphSnapshotRepository =
        graphSnapshotRepository ?? throw new ArgumentNullException(nameof(graphSnapshotRepository));
    private readonly IAgentExecutionTraceRepository _agentExecutionTraceRepository =
        agentExecutionTraceRepository ?? throw new ArgumentNullException(nameof(agentExecutionTraceRepository));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

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

        if (detail.Manifest is null)
        {
            throw new ConflictException(
                "Export requires a finalized review with a committed architecture snapshot.");
        }

        AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow(detail, runId.Trim());

        await EnsureSealedDecisionReceiptVerifiedOrThrowAsync(runId.Trim(), cancellationToken);

        await RunExportSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
            runId.Trim(),
            scopeContextProvider.GetCurrentScope(),
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);

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
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        CareerExportCoverageHonestyInput careerExportHonesty = await CareerExportCoverageHonestyMaterialLoader.LoadAsync(
            detail,
            _authorityQueryService,
            _graphSnapshotRepository,
            _agentExecutionTraceRepository,
            scope,
            workingDesk: true,
            _configuration,
            cancellationToken);

        ArchitectureReviewBoardExportDocumentModel documentModel =
            ArchitectureReviewBoardExportDocumentFactory.Create(
                detail,
                report,
                httpCorrelationId,
                extractorTimestampUtcLabel: null,
                tenantDisplayName: tenantDisplayName,
                explanationConfidenceCallout: explanationCallout,
                careerExportHonestyPlainText: CareerExportCoverageHonestyComposer.FormatPlainText(careerExportHonesty));

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
