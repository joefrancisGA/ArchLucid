using System.Text.Json;

using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

public static class ComparisonRecordPayloadRehydrator
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web) { PropertyNameCaseInsensitive = true };

    public static EndToEndReplayComparisonReport? RehydrateEndToEnd(ComparisonRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);
        if (string.IsNullOrWhiteSpace(record.PayloadJson))
            return null;
        try
        {
            EndToEndReplayComparisonReport? report =
                JsonSerializer.Deserialize<EndToEndReplayComparisonReport>(record.PayloadJson, JsonOptions);

            if (report is null)
                return null;

            bool payloadHadRunIdAnchors =
                !string.IsNullOrEmpty(report.LeftRunId) || !string.IsNullOrEmpty(report.RightRunId);

            EndToEndReplayComparisonReportNormalizer.NormalizePersistedPayload(report);
            EndToEndReplayComparisonReportNormalizer.ApplyComparisonRecordRunIdAnchorsInPlace(report, record);

            return EndToEndReplayComparisonReportNormalizer.IsPersistedImmaterialRehydrateShell(
                    report,
                    ignoreRunIdAnchors: !payloadHadRunIdAnchors)
                ? null
                : report;
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException(
                $"Comparison record '{record.ComparisonRecordId}' PayloadJson could not be deserialized as EndToEndReplayComparisonReport. " +
                "The stored JSON may be corrupt.", ex);
        }
    }

    public static ExportRecordDiffResult? RehydrateExportDiff(ComparisonRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);
        if (string.IsNullOrWhiteSpace(record.PayloadJson))
            return null;
        try
        {
            ExportRecordDiffResult? diff = JsonSerializer.Deserialize<ExportRecordDiffResult>(record.PayloadJson, JsonOptions);

            if (diff is null)
                return null;

            bool payloadHadDisplayAnchors =
                !string.IsNullOrEmpty(diff.LeftExportRecordId)
                || !string.IsNullOrEmpty(diff.RightExportRecordId)
                || !string.IsNullOrEmpty(diff.LeftRunId)
                || !string.IsNullOrEmpty(diff.RightRunId);

            ExportRecordDiffResultNormalizer.NormalizeDisplayAnchors(diff);
            ExportRecordDiffResultNormalizer.ApplyComparisonRecordAnchorsInPlace(diff, record);

            if (!ExportRecordDiffMateriality.HasMaterialChanges(diff) && !payloadHadDisplayAnchors)
                return null;

            return diff;
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException(
                $"Comparison record '{record.ComparisonRecordId}' PayloadJson could not be deserialized as ExportRecordDiffResult. " +
                "The stored JSON may be corrupt.", ex);
        }
    }

}
