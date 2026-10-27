using System.Text.Json;

using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Persists comparison results as immutable <see cref = "ComparisonRecord"/> entries for audit and replay.
/// </summary>
public sealed class ComparisonAuditService(IComparisonRecordRepository repository, IAuditService auditService) : IComparisonAuditService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web) { WriteIndented = true };
    private readonly IComparisonRecordRepository _repository = repository ?? throw new ArgumentNullException(nameof(repository));
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    /// <inheritdoc/>
    public async Task<string> RecordEndToEndAsync(EndToEndReplayComparisonReport report, string summaryMarkdown, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(summaryMarkdown);
        ArgumentNullException.ThrowIfNull(report);
        EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);
        string leftRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForPersistence(report.LeftRunId);
        string rightRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForPersistence(report.RightRunId);
        ComparisonRecord record = new()
        {
            ComparisonRecordId = Guid.NewGuid().ToString("N"),
            ComparisonType = ComparisonTypes.EndToEndReplay,
            LeftRunId = leftRunId,
            RightRunId = rightRunId,
            Format = ComparisonTypes.FormatJsonMarkdown,
            SummaryMarkdown = NormalizeOptionalMarkdown(summaryMarkdown),
            PayloadJson = SerializeEndToEndPayload(report, leftRunId, rightRunId),
            Notes = "Persisted end-to-end replay comparison.",
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };
        await _repository.CreateAsync(record, cancellationToken);
        DateTime occurredUtc = TimeProvider.System.UtcNowDateTime();
        await _auditService.LogAsync(
            new AuditEvent
            {
                OccurredUtc = occurredUtc,
                EventType = AuditEventTypes.EndToEndComparisonPersisted,
                RunId = TryParseRunGuid(record.LeftRunId) ?? TryParseRunGuid(record.RightRunId),
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        comparisonRecordId = record.ComparisonRecordId,
                        leftRunId = record.LeftRunId,
                        rightRunId = record.RightRunId,
                        comparisonType = record.ComparisonType
                    }, AuditJsonSerializationOptions.Instance)
            }, cancellationToken);
        return record.ComparisonRecordId;
    }

    /// <inheritdoc/>
    public async Task<string> RecordExportDiffAsync(ExportRecordDiffResult diff, string summaryMarkdown, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(summaryMarkdown);
        ArgumentNullException.ThrowIfNull(diff);
        ExportRecordDiffResultNormalizer.NormalizeDisplayAnchors(diff);
        string? leftRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForPersistenceOrNull(diff.LeftRunId);
        string? rightRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForPersistenceOrNull(diff.RightRunId);
        ComparisonRecord record = new()
        {
            ComparisonRecordId = Guid.NewGuid().ToString("N"),
            ComparisonType = ComparisonTypes.ExportRecordDiff,
            LeftRunId = leftRunId,
            RightRunId = rightRunId,
            LeftExportRecordId = NormalizeExportRecordIdColumnOrNull(diff.LeftExportRecordId),
            RightExportRecordId = NormalizeExportRecordIdColumnOrNull(diff.RightExportRecordId),
            Format = ComparisonTypes.FormatJsonMarkdown,
            SummaryMarkdown = NormalizeOptionalMarkdown(summaryMarkdown),
            PayloadJson = SerializeExportDiffPayload(diff, leftRunId, rightRunId),
            Notes = "Persisted export record diff.",
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };
        await _repository.CreateAsync(record, cancellationToken);
        // Durable `ComparisonSummaryPersisted` is emitted by `ExportsController` after this call; avoid duplicate rows.
        return record.ComparisonRecordId;
    }

    /// <inheritdoc/>
    public async Task<string> RecordReplayOfAsync(ComparisonRecord sourceRecord, string? notes = null, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(sourceRecord);
        string sourceComparisonRecordId = ComparisonRecordIdNormalizer.NormalizeRequired(sourceRecord.ComparisonRecordId);
        ComparisonRecord record = new()
        {
            ComparisonRecordId = Guid.NewGuid().ToString("N"),
            ComparisonType = ComparisonTypeNormalizer.NormalizeForLookup(sourceRecord.ComparisonType),
            LeftRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForPersistenceOrNull(sourceRecord.LeftRunId),
            RightRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForPersistenceOrNull(sourceRecord.RightRunId),
            LeftExportRecordId = NormalizeExportRecordIdColumnOrNull(sourceRecord.LeftExportRecordId),
            RightExportRecordId = NormalizeExportRecordIdColumnOrNull(sourceRecord.RightExportRecordId),
            LeftManifestVersion = PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(sourceRecord.LeftManifestVersion),
            RightManifestVersion = PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(sourceRecord.RightManifestVersion),
            Format = NormalizeFormatColumn(sourceRecord.Format),
            SummaryMarkdown = NormalizeOptionalMarkdown(sourceRecord.SummaryMarkdown),
            PayloadJson = NormalizeReplayPayloadJson(sourceRecord),
            Notes = NormalizeReplayNotes(notes, sourceComparisonRecordId),
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };
        ComparisonRecordScopedReadNormalizer.NormalizeInPlace(record);
        await _repository.CreateAsync(record, cancellationToken);
        DateTime occurredUtc = TimeProvider.System.UtcNowDateTime();
        await _auditService.LogAsync(
            new AuditEvent
            {
                OccurredUtc = occurredUtc,
                EventType = AuditEventTypes.ComparisonReplayPersisted,
                RunId = TryParseRunGuid(record.LeftRunId) ?? TryParseRunGuid(record.RightRunId),
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        comparisonRecordId = record.ComparisonRecordId,
                        sourceComparisonRecordId = sourceComparisonRecordId,
                        leftRunId = record.LeftRunId,
                        rightRunId = record.RightRunId,
                        comparisonType = record.ComparisonType
                    }, AuditJsonSerializationOptions.Instance)
            }, cancellationToken);
        return record.ComparisonRecordId;
    }

    private static Guid? TryParseRunGuid(string? runId)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return null;

        if (Guid.TryParseExact(runId, "N", out Guid guid) || Guid.TryParse(runId, out guid))
            return guid;

        return null;
    }

    private static string SerializeEndToEndPayload(
        EndToEndReplayComparisonReport report,
        string leftRunId,
        string rightRunId)
    {
        string originalLeft = report.LeftRunId;
        string originalRight = report.RightRunId;

        try
        {
            report.LeftRunId = leftRunId;
            report.RightRunId = rightRunId;

            return JsonSerializer.Serialize(report, JsonOptions);
        }
        finally
        {
            report.LeftRunId = originalLeft;
            report.RightRunId = originalRight;
        }
    }

    private static string? NormalizeExportRecordIdColumnOrNull(string? exportRecordId)
    {
        if (string.IsNullOrWhiteSpace(exportRecordId))
            return null;

        return RunExportRecordIdNormalizer.NormalizeRequired(exportRecordId);
    }

    private static string? NormalizeOptionalMarkdown(string? summaryMarkdown) =>
        OptionalExportMetadataStringNormalizer.NormalizeOptionalString(summaryMarkdown);

    private static string NormalizeFormatColumn(string format) =>
        string.IsNullOrWhiteSpace(format) ? string.Empty : format.Trim();

    private static string NormalizeReplayNotes(string? notes, string sourceComparisonRecordId) =>
        string.IsNullOrWhiteSpace(notes)
            ? $"Replay of comparison record {sourceComparisonRecordId}."
            : notes.Trim();

    private static string NormalizeReplayPayloadJson(ComparisonRecord sourceRecord)
    {
        if (string.IsNullOrWhiteSpace(sourceRecord.PayloadJson))
            return string.Empty;

        string? comparisonType =
            ComparisonRecordScopedReadNormalizer.CanonicalizeComparisonTypeSearchFilter(sourceRecord.ComparisonType);

        if (string.Equals(comparisonType, ComparisonTypes.ExportRecordDiff, StringComparison.Ordinal))
        {
            ExportRecordDiffResult? diff = ComparisonRecordPayloadRehydrator.RehydrateExportDiff(sourceRecord);

            return diff is null ? string.Empty : JsonSerializer.Serialize(diff, JsonOptions);
        }

        if (string.Equals(comparisonType, ComparisonTypes.EndToEndReplay, StringComparison.Ordinal))
        {
            EndToEndReplayComparisonReport? report = ComparisonRecordPayloadRehydrator.RehydrateEndToEnd(sourceRecord);

            return report is null ? string.Empty : JsonSerializer.Serialize(report, JsonOptions);
        }

        return sourceRecord.PayloadJson;
    }

    private static string SerializeExportDiffPayload(
        ExportRecordDiffResult diff,
        string? leftRunId,
        string? rightRunId)
    {
        string? originalLeft = diff.LeftRunId;
        string? originalRight = diff.RightRunId;

        try
        {
            diff.LeftRunId = leftRunId ?? string.Empty;
            diff.RightRunId = rightRunId ?? string.Empty;

            return JsonSerializer.Serialize(diff, JsonOptions);
        }
        finally
        {
            diff.LeftRunId = originalLeft;
            diff.RightRunId = originalRight;
        }
    }
}
