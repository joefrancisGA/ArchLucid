using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Replays a persisted <see cref = "RunExportRecord"/> by rehydrating the original analysis request and
///     regenerating the export artifact (consulting or standard analysis DOCX), optionally recording the replay as a new
///     export record.
/// </summary>
public sealed class ExportReplayService(
    IRunExportRecordRepository runExportRecordRepository,
    IArchitectureAnalysisService architectureAnalysisService,
    IArchitectureAnalysisDocxExportService analysisDocxExportService,
    IArchitectureAnalysisConsultingDocxExportService consultingDocxExportService,
    IRunExportAuditService runExportAuditService,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    IScopeContextProvider scopeContextProvider) : IExportReplayService
{
    private readonly IRunExportRecordRepository _runExportRecordRepository =
        runExportRecordRepository ?? throw new ArgumentNullException(nameof(runExportRecordRepository));

    private readonly IArchitectureAnalysisConsultingDocxExportService _consultingDocxExportService =
        consultingDocxExportService ?? throw new ArgumentNullException(nameof(consultingDocxExportService));

    private readonly IRunExportAuditService _runExportAuditService = runExportAuditService ?? throw new ArgumentNullException(nameof(runExportAuditService));

    private readonly IArchitectureAnalysisDocxExportService _analysisDocxExportService =
        analysisDocxExportService ?? throw new ArgumentNullException(nameof(analysisDocxExportService));

    private readonly IArchitectureAnalysisService _architectureAnalysisService =
        architectureAnalysisService ?? throw new ArgumentNullException(nameof(architectureAnalysisService));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private const string ExportTypeConsultingDocx = "analysis-report-consulting-docx";

    /// <summary>
    ///     Standard (non-consulting) analysis DOCX exports; must match the <see cref = "RunExportRecord.ExportType"/>
    ///     stored when those exports are audited.
    /// </summary>
    private const string ExportTypeAnalysisDocx = "analysis-report-docx";

    private const string FallbackReplayFileName = "replayed_export.docx";

    /// <summary>
    ///     Replays the export identified by <see cref = "ReplayExportRequest.ExportRecordId"/>.
    /// </summary>
    /// <exception cref = "InvalidOperationException">
    ///     Thrown when the export record does not exist, its persisted request cannot be rehydrated,
    ///     or the export type is not supported for replay.
    /// </exception>
    public async Task<ReplayExportResult> ReplayAsync(ReplayExportRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.ExportRecordId);
        RunExportRecord? record = await runExportRecordRepository.GetByIdAsync(request.ExportRecordId, cancellationToken);
        if (record is null)
            throw new InvalidOperationException($"Export record '{request.ExportRecordId}' was not found.");

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        await RunExportSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
            record.RunId,
            scope,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);

        if (Guid.TryParse(record.RunId, out Guid runGuid))
        {
            RunDetailDto? runDetail = await _authorityQueryService.GetRunDetailAsync(scope, runGuid, cancellationToken);

            if (runDetail is not null)
            {
                AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow(
                    AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(runDetail.Run),
                    record.RunId);
            }
        }

        PersistedAnalysisExportRequest persistedRequest = AnalysisExportRequestRehydrator.Rehydrate(record) ??
                                                          throw new InvalidOperationException(
                                                              $"Export record '{request.ExportRecordId}' does not contain a persisted analysis request.");
        ArchitectureAnalysisRequest analysisRequest = new()
        {
            RunId = record.RunId,
            IncludeEvidence = persistedRequest.IncludeEvidence,
            IncludeExecutionTraces = persistedRequest.IncludeExecutionTraces,
            IncludeManifest = persistedRequest.IncludeManifest,
            IncludeDiagram = persistedRequest.IncludeDiagram,
            IncludeSummary = persistedRequest.IncludeSummary,
            IncludeDeterminismCheck = persistedRequest.IncludeDeterminismCheck,
            DeterminismIterations = persistedRequest.DeterminismIterations,
            IncludeManifestCompare = persistedRequest.IncludeManifestCompare,
            CompareManifestVersion = persistedRequest.CompareManifestVersion,
            IncludeAgentResultCompare = persistedRequest.IncludeAgentResultCompare,
            CompareRunId = persistedRequest.CompareRunId
        };
        ArchitectureAnalysisReport report = await architectureAnalysisService.BuildAsync(analysisRequest, cancellationToken);
        return record.ExportType switch
        {
            ExportTypeConsultingDocx => await ReplayConsultingDocxAsync(record, persistedRequest, report, request.RecordReplayExport, cancellationToken),
            ExportTypeAnalysisDocx => await ReplayAnalysisDocxAsync(record, persistedRequest, report, request.RecordReplayExport, cancellationToken),
            _ => throw new InvalidOperationException($"Replay is not supported for export type '{record.ExportType}'.")
        };
    }

    private async Task<ReplayExportResult> ReplayConsultingDocxAsync(RunExportRecord record,
        PersistedAnalysisExportRequest persistedRequest,
        ArchitectureAnalysisReport report,
        bool recordReplayExport,
        CancellationToken cancellationToken)
    {
        ConsultingDocxExportBranding? branding = ConsultingDocxExportBrandingMapper.FromPersistedHints(persistedRequest);
        byte[] bytes = await _consultingDocxExportService.GenerateDocxAsync(report, branding, cancellationToken);

        return await FinishReplayDocxAsync(record, persistedRequest, report, recordReplayExport, bytes, cancellationToken);
    }

    private async Task<ReplayExportResult> ReplayAnalysisDocxAsync(RunExportRecord record,
        PersistedAnalysisExportRequest persistedRequest,
        ArchitectureAnalysisReport report,
        bool recordReplayExport,
        CancellationToken cancellationToken)
    {
        byte[] bytes = await _analysisDocxExportService.GenerateDocxAsync(report, cancellationToken);

        return await FinishReplayDocxAsync(record, persistedRequest, report, recordReplayExport, bytes, cancellationToken);
    }

    private async Task<ReplayExportResult> FinishReplayDocxAsync(RunExportRecord record,
        PersistedAnalysisExportRequest persistedRequest,
        ArchitectureAnalysisReport report,
        bool recordReplayExport,
        byte[] bytes,
        CancellationToken cancellationToken)
    {
        string replayFileName = BuildReplayFileName(record.FileName);
        string? recordedReplayExportRecordId = null;
        if (!recordReplayExport)
            return new ReplayExportResult
            {
                ExportRecordId = record.ExportRecordId,
                RecordedReplayExportRecordId = recordedReplayExportRecordId,
                RunId = record.RunId,
                ExportType = record.ExportType,
                Format = record.Format,
                FileName = replayFileName,
                Content = bytes,
                TemplateProfile = record.TemplateProfile,
                TemplateProfileDisplayName = record.TemplateProfileDisplayName,
                WasAutoSelected = record.WasAutoSelected,
                ResolutionReason = record.ResolutionReason
            };
        RunExportRecord persisted = await runExportAuditService.RecordAsync(record.RunId, record.ExportType, record.Format, replayFileName,
            record.TemplateProfile, record.TemplateProfileDisplayName, record.WasAutoSelected, record.ResolutionReason,
            report.Manifest?.Metadata.ManifestVersion, persistedRequest, $"Replay generated from export record {record.ExportRecordId}.",
            emitArchitectureDocxExportGeneratedAudit: false, cancellationToken);
        recordedReplayExportRecordId = persisted.ExportRecordId;
        return new ReplayExportResult
        {
            ExportRecordId = record.ExportRecordId,
            RecordedReplayExportRecordId = recordedReplayExportRecordId,
            RunId = record.RunId,
            ExportType = record.ExportType,
            Format = record.Format,
            FileName = replayFileName,
            Content = bytes,
            TemplateProfile = record.TemplateProfile,
            TemplateProfileDisplayName = record.TemplateProfileDisplayName,
            WasAutoSelected = record.WasAutoSelected,
            ResolutionReason = record.ResolutionReason
        };
    }

    /// <summary>
    ///     Appends <c>_replay</c> to the base file name while preserving the original extension.
    ///     Returns <c>replayed_export.docx</c> when the original name is blank.
    /// </summary>
    private static string BuildReplayFileName(string originalFileName)
    {
        if (string.IsNullOrWhiteSpace(originalFileName))
            return FallbackReplayFileName;
        string extension = Path.GetExtension(originalFileName);
        string baseName = Path.GetFileNameWithoutExtension(originalFileName);
        return $"{baseName}_replay{extension}";
    }
}
