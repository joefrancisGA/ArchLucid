using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Records export operations against a run to the <see cref = "IRunExportRecordRepository"/>.
///     Captures the full export configuration (template profile, included sections, determinism options)
///     so that exports can be audited, replayed, and diffed after the fact.
/// </summary>
public sealed class RunExportAuditService(
    IRunExportRecordRepository repository,
    IAuditService auditService,
    ILogger<RunExportAuditService> logger) : IRunExportAuditService
{
    private static readonly JsonSerializerOptions AnalysisRequestPersistJsonOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };
    private readonly IRunExportRecordRepository _repository = repository ?? throw new ArgumentNullException(nameof(repository));
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));
    private readonly ILogger<RunExportAuditService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<RunExportRecord> RecordAsync(string runId, string exportType, string format, string fileName, string? templateProfile,
        string? templateProfileDisplayName, bool wasAutoSelected, string? resolutionReason, string? manifestVersion,
        PersistedAnalysisExportRequest? analysisRequest = null, string? notes = null, bool emitArchitectureDocxExportGeneratedAudit = true,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(exportType);
        ArgumentNullException.ThrowIfNull(format);
        ArgumentNullException.ThrowIfNull(fileName);
        runId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runId.Trim());
        exportType = exportType.Trim();
        format = format.Trim();
        fileName = fileName.Trim();
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(exportType);
        ArgumentException.ThrowIfNullOrWhiteSpace(format);
        ArgumentException.ThrowIfNullOrWhiteSpace(fileName);
        templateProfile = PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(templateProfile);
        templateProfileDisplayName = PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(templateProfileDisplayName);
        resolutionReason = PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(resolutionReason);
        manifestVersion = PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(manifestVersion);
        notes = PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(notes);
        PersistedAnalysisExportRequestMetadata.TrimOptionalStrings(analysisRequest);
        if (analysisRequest is not null)
        {
            PersistedAnalysisExportRequestDeterminismNormalizer.ClearIterationsWhenCheckDisabled(analysisRequest);

            if (!string.IsNullOrWhiteSpace(analysisRequest.CompareRunId))
                analysisRequest.CompareRunId =
                    AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(analysisRequest.CompareRunId);
        }

        RunExportRecord record = new()
        {
            ExportRecordId = Guid.NewGuid().ToString("N"),
            RunId = runId,
            ExportType = exportType,
            Format = format,
            FileName = fileName,
            TemplateProfile = templateProfile,
            TemplateProfileDisplayName = templateProfileDisplayName,
            WasAutoSelected = wasAutoSelected,
            ResolutionReason = resolutionReason,
            ManifestVersion = manifestVersion,
            Notes = notes,
            AnalysisRequestJson = SerializeAnalysisRequestForPersist(analysisRequest),
            IncludedEvidence = analysisRequest?.IncludeEvidence,
            IncludedExecutionTraces = analysisRequest?.IncludeExecutionTraces,
            IncludedManifest = analysisRequest?.IncludeManifest,
            IncludedDiagram = analysisRequest?.IncludeDiagram,
            IncludedSummary = analysisRequest?.IncludeSummary,
            IncludedDeterminismCheck = analysisRequest?.IncludeDeterminismCheck,
            DeterminismIterations = PersistedAnalysisExportRequestDeterminismNormalizer.ToAuditDenormalizedColumn(analysisRequest),
            IncludedManifestCompare = analysisRequest?.IncludeManifestCompare,
            CompareManifestVersion = analysisRequest?.CompareManifestVersion,
            IncludedAgentResultCompare = analysisRequest?.IncludeAgentResultCompare,
            CompareRunId = analysisRequest?.CompareRunId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };
        await _repository.CreateAsync(record, cancellationToken);
        RunExportRecordScopedReadNormalizer.NormalizeInPlace(record);
        if (!emitArchitectureDocxExportGeneratedAudit)
            return record;
        Guid? auditRunId = TryParseRunGuid(runId);
        DateTime occurredUtc = TimeProvider.System.UtcNowDateTime();
        AuditEvent exportGeneratedAudit = new()
        {
            OccurredUtc = occurredUtc,
            EventType = AuditEventTypes.ArchitectureDocxExportGenerated,
            RunId = auditRunId,
            DataJson = JsonSerializer.Serialize(
                new
                {
                    runId,
                    exportRecordId = record.ExportRecordId,
                    exportType = record.ExportType,
                    fileName = record.FileName,
                    templateProfile = record.TemplateProfile,
                    manifestVersion = record.ManifestVersion,
                    compareWithRunId = analysisRequest?.CompareRunId
                }, AuditJsonSerializationOptions.Instance)
        };

        await DurableAuditLogRetry.LogOrThrowAsync(
            ct => _auditService.LogAsync(exportGeneratedAudit, ct),
            _logger,
            $"ArchitectureDocxExportGenerated:{runId}",
            cancellationToken,
            auditEventTypeForMetrics: AuditEventTypes.ArchitectureDocxExportGenerated);

        return record;
    }

    public async Task RecordFailureAsync(string runId, string exportType, string format, string errorMessage, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(exportType);
        ArgumentNullException.ThrowIfNull(format);
        ArgumentNullException.ThrowIfNull(errorMessage);
        runId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runId.Trim());
        exportType = exportType.Trim();
        format = format.Trim();
        errorMessage = errorMessage.Trim();
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(exportType);
        ArgumentException.ThrowIfNullOrWhiteSpace(format);
        ArgumentException.ThrowIfNullOrWhiteSpace(errorMessage);

        Guid? auditRunId = TryParseRunGuid(runId);
        DateTime occurredUtc = TimeProvider.System.UtcNowDateTime();
        await _auditService.LogAsync(
            new AuditEvent
            {
                OccurredUtc = occurredUtc,
                EventType = AuditEventTypes.RunExportFailed,
                RunId = auditRunId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        runId,
                        exportType,
                        format,
                        errorMessage
                    }, AuditJsonSerializationOptions.Instance)
            }, cancellationToken);
    }

    private static string? SerializeAnalysisRequestForPersist(PersistedAnalysisExportRequest? analysisRequest)
    {
        if (analysisRequest is null)
            return null;

        JsonObject node = JsonSerializer.SerializeToNode(analysisRequest, AnalysisRequestPersistJsonOptions)!.AsObject();

        if (!analysisRequest.IncludeDeterminismCheck || analysisRequest.DeterminismIterations == 0)
            node.Remove("determinismIterations");

        return node.ToJsonString(AnalysisRequestPersistJsonOptions);
    }

    private static Guid? TryParseRunGuid(string runId)
    {
        if (Guid.TryParseExact(runId, "N", out Guid guid) || Guid.TryParse(runId, out guid))
            return guid;

        return null;
    }

}
