using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Application.Tenancy;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Application.Jobs;

/// <summary>
///     Loads run detail from persistence and runs DOCX export pipelines for queued work units.
/// </summary>
public sealed class BackgroundJobWorkUnitExecutor(
    IRunDetailQueryService runDetailQuery,
    IArchitectureAnalysisService architectureAnalysisService,
    IArchitectureAnalysisDocxExportService docxExportService,
    IArchitectureAnalysisConsultingDocxExportService consultingDocxExportService,
    IAuditService auditService,
    ITenantDeletionService tenantDeletionService,
    IItsmOutboundIssueCreationService itsmOutboundIssueCreationService,
    IBackgroundJobWorkUnitScopeResolver workUnitScopeResolver) : IBackgroundJobWorkUnitExecutor
{
    private readonly IRunDetailQueryService _runDetailQuery = runDetailQuery ?? throw new ArgumentNullException(nameof(runDetailQuery));

    private readonly IArchitectureAnalysisService _architectureAnalysisService =
        architectureAnalysisService ?? throw new ArgumentNullException(nameof(architectureAnalysisService));

    private readonly IArchitectureAnalysisDocxExportService
        _docxExportService = docxExportService ?? throw new ArgumentNullException(nameof(docxExportService));

    private readonly IArchitectureAnalysisConsultingDocxExportService _consultingDocxExportService =
        consultingDocxExportService ?? throw new ArgumentNullException(nameof(consultingDocxExportService));

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ITenantDeletionService _tenantDeletionService =
        tenantDeletionService ?? throw new ArgumentNullException(nameof(tenantDeletionService));

    private readonly IItsmOutboundIssueCreationService _itsmOutboundIssueCreationService =
        itsmOutboundIssueCreationService ?? throw new ArgumentNullException(nameof(itsmOutboundIssueCreationService));

    private readonly IBackgroundJobWorkUnitScopeResolver _workUnitScopeResolver =
        workUnitScopeResolver ?? throw new ArgumentNullException(nameof(workUnitScopeResolver));

    public async Task<BackgroundJobFile> ExecuteAsync(BackgroundJobWorkUnit workUnit, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(workUnit);
        ScopeContext jobScope = await _workUnitScopeResolver.ResolveAsync(workUnit, cancellationToken).ConfigureAwait(false);

        using (AmbientScopeContext.Push(jobScope))
        {
            return workUnit switch
            {
                AnalysisReportDocxWorkUnit w => await ExecuteAnalysisReportDocxAsync(w, cancellationToken),
                ConsultingDocxWorkUnit w => await ExecuteConsultingDocxAsync(w, cancellationToken),
                TenantDeletionWorkUnit w => await ExecuteTenantDeletionAsync(w, cancellationToken),
                ItsmOutboundCreateWorkUnit w => await ExecuteItsmOutboundCreateAsync(w, cancellationToken),
                _ => throw new InvalidOperationException($"Unsupported background job work unit: {workUnit.GetType().Name}.")
            };
        }
    }

    private async Task<BackgroundJobFile> ExecuteTenantDeletionAsync(TenantDeletionWorkUnit unit, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(unit.Payload);
        TenantDeletionResult result = await _tenantDeletionService.DeleteTenantAsync(
                unit.Payload.TenantId,
                new TenantDeletionInvocation
                {
                    ActorUserId = unit.Payload.RequestedByUserId,
                    ActorUserName = unit.Payload.RequestedByUserName,
                    CorrelationId = unit.Payload.CorrelationId
                },
                cancellationToken)
            .ConfigureAwait(false);

        byte[] bytes = JsonSerializer.SerializeToUtf8Bytes(result);

        return new BackgroundJobFile("tenant-deletion-result.json", "application/json", bytes);
    }

    private async Task<BackgroundJobFile> ExecuteItsmOutboundCreateAsync(
        ItsmOutboundCreateWorkUnit unit,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(unit.Payload);

        ItsmOutboundCreateJobPayload payload = unit.Payload;
        ScopeContext scope = ItsmOutboundCreateJobProcessor.ToScopeContext(payload);

        ItsmOutboundIssueCreationResult result = await _itsmOutboundIssueCreationService
            .TryCreateForFindingAsync(payload.Provider, scope, payload.FindingId, cancellationToken)
            .ConfigureAwait(false);

        foreach (AuditEvent auditEvent in result.AuditEvents)
            await _auditService.LogAsync(auditEvent, cancellationToken).ConfigureAwait(false);

        ItsmOutboundCreateJobResult jobResult = ItsmOutboundCreateJobProcessor.ToJobResult(result, payload.Provider);

        if (ItsmOutboundCreateJobProcessor.ShouldRetryWorker(result))
            throw ItsmOutboundCreateJobProcessor.BuildRetryException(jobResult);

        return ItsmOutboundCreateJobProcessor.ToResultFile(jobResult);
    }

    private async Task<BackgroundJobFile> ExecuteAnalysisReportDocxAsync(AnalysisReportDocxWorkUnit unit, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(unit.Payload);
        ArchitectureAnalysisRequest request = unit.Payload.ToAnalysisRequest();
        ArchitectureRunDetail? detail = await _runDetailQuery.GetRunDetailAsync(unit.Payload.RunId, cancellationToken);
        if (detail is null)
            throw new InvalidOperationException($"Run '{unit.Payload.RunId}' was not found.");
        request.PreloadedRunDetail = detail;
        byte[] bytes = await _docxExportService.GenerateDocxAsync(await _architectureAnalysisService.BuildAsync(request, cancellationToken), cancellationToken);
        await LogArchitectureDocxExportGeneratedAsync(unit.Payload.RunId, "analysis-report-docx-async", bytes.Length, unit.FileName, cancellationToken);
        return new BackgroundJobFile(unit.FileName, unit.ContentType, bytes);
    }

    private async Task<BackgroundJobFile> ExecuteConsultingDocxAsync(ConsultingDocxWorkUnit unit, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(unit.Payload);
        ConsultingDocxJobPayload p = unit.Payload;
        ArchitectureAnalysisRequest analysisRequest = new()
        {
            RunId = p.RunId,
            IncludeEvidence = p.IncludeEvidence,
            IncludeExecutionTraces = p.IncludeExecutionTraces,
            IncludeManifest = p.IncludeManifest,
            IncludeDiagram = p.IncludeDiagram,
            IncludeSummary = true,
            IncludeDeterminismCheck = p.IncludeDeterminismCheck,
            DeterminismIterations = p.DeterminismIterations,
            IncludeManifestCompare = p.IncludeManifestCompare,
            CompareManifestVersion = p.CompareManifestVersion,
            IncludeAgentResultCompare = p.IncludeAgentResultCompare,
            CompareRunId = p.CompareRunId
        };
        ArchitectureRunDetail? detail = await _runDetailQuery.GetRunDetailAsync(p.RunId, cancellationToken);
        if (detail is null)
            throw new InvalidOperationException($"Run '{p.RunId}' was not found.");
        analysisRequest.PreloadedRunDetail = detail;
        ArchitectureAnalysisReport report = await _architectureAnalysisService.BuildAsync(analysisRequest, cancellationToken);

        ConsultingDocxExportBranding? branding = ConsultingDocxExportBrandingMapper.TryCreate(
            p.ReviewBoardWhitelabelFirmDisplayName,
            p.ReviewBoardWhitelabelClientEngagementTitle,
            p.ReviewBoardWhitelabelLogoBase64,
            out string? brandingError);

        if (brandingError is not null)
            throw new InvalidOperationException(brandingError);

        byte[] bytes = await _consultingDocxExportService.GenerateDocxAsync(report, branding, cancellationToken);
        await LogArchitectureDocxExportGeneratedAsync(p.RunId, "analysis-report-consulting-docx-async", bytes.Length, unit.FileName, cancellationToken);
        return new BackgroundJobFile(unit.FileName, unit.ContentType, bytes);
    }

    private async Task LogArchitectureDocxExportGeneratedAsync(string runId, string exportChannel, int byteCount, string fileName,
        CancellationToken cancellationToken)
    {
        Guid correlationSuffix = Guid.NewGuid();
        DateTime occurredUtc = TimeProvider.System.UtcNowDateTime();
        Guid? auditRunId = TryParseRunGuid(runId);
        await _auditService.LogAsync(
            new AuditEvent
            {
                OccurredUtc = occurredUtc,
                EventType = AuditEventTypes.ArchitectureDocxExportGenerated,
                CorrelationId = $"{exportChannel}:{runId}:{correlationSuffix:N}",
                RunId = auditRunId,
                DataJson = JsonSerializer.Serialize(new { runId, exportChannel, byteCount, fileName }, AuditJsonSerializationOptions.Instance)
            }, cancellationToken);
    }

    private static Guid? TryParseRunGuid(string runId)
    {
        if (Guid.TryParseExact(runId, "N", out Guid guid) || Guid.TryParse(runId, out guid))
            return guid;

        return null;
    }
}
