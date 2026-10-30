using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Normalizes export-record diff anchors and nested request metadata before export formatting or drift compare.
/// </summary>
internal static class ExportRecordDiffResultNormalizer
{
    private static readonly HashSet<string> KnownTopLevelChangedFields = new(StringComparer.Ordinal)
    {
        "ExportType",
        "Format",
        "FileName",
        "TemplateProfile",
        "TemplateProfileDisplayName",
        "WasAutoSelected",
        "ResolutionReason",
        "ManifestVersion",
        "Notes",
        "IncludedEvidence",
        "IncludedExecutionTraces",
        "IncludedManifest",
        "IncludedDiagram",
        "IncludedSummary",
        "IncludedDeterminismCheck",
        "DeterminismIterations",
        "IncludedManifestCompare",
        "CompareManifestVersion",
        "IncludedAgentResultCompare",
        "CompareRunId",
    };

    private static readonly HashSet<string> KnownRequestChangedFlags = new(StringComparer.Ordinal)
    {
        "ExternalDelivery",
        "ExecutiveFriendly",
        "RegulatedEnvironment",
        "NeedDetailedEvidence",
        "NeedExecutionTraces",
        "NeedDeterminismOrCompareAppendices",
        "IncludeEvidence",
        "IncludeExecutionTraces",
        "IncludeManifest",
        "IncludeDiagram",
        "IncludeSummary",
        "IncludeDeterminismCheck",
        "IncludeManifestCompare",
        "IncludeAgentResultCompare",
    };

    private static readonly HashSet<string> KnownRequestChangedValues = new(StringComparer.Ordinal)
    {
        "TemplateProfile",
        "Audience",
        "DeterminismIterations",
        "CompareManifestVersion",
        "CompareRunId",
        "ReviewBoardWhitelabelFirmDisplayName",
        "ReviewBoardWhitelabelClientEngagementTitle",
        "ReviewBoardWhitelabelLogoBlobReference",
        "ReviewBoardWhitelabelFooterAttribution",
    };

    internal static void NormalizeDisplayAnchors(ExportRecordDiffResult diff)
    {
        ArgumentNullException.ThrowIfNull(diff);

        diff.LeftExportRecordId = NormalizeExportRecordIdAnchor(diff.LeftExportRecordId);
        diff.RightExportRecordId = NormalizeExportRecordIdAnchor(diff.RightExportRecordId);

        diff.LeftRunId = NormalizeRunIdAnchor(diff.LeftRunId);
        diff.RightRunId = NormalizeRunIdAnchor(diff.RightRunId);

        ComparisonPersistedStringListNormalizer.NormalizeInPlace(diff.Warnings);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(diff.ChangedTopLevelFields);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(diff.RequestDiff.ChangedFlags);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(diff.RequestDiff.ChangedValues);
        RemoveUnknownExportDiffFieldNamesInPlace(diff);

        PersistedAnalysisExportRequestMetadata.TrimOptionalStrings(diff.RequestDiff.LeftRequest);
        PersistedAnalysisExportRequestMetadata.TrimOptionalStrings(diff.RequestDiff.RightRequest);
        if (diff.RequestDiff.LeftRequest is not null)
            PersistedAnalysisExportRequestDeterminismNormalizer.ClearIterationsWhenCheckDisabled(diff.RequestDiff.LeftRequest);

        if (diff.RequestDiff.RightRequest is not null)
            PersistedAnalysisExportRequestDeterminismNormalizer.ClearIterationsWhenCheckDisabled(diff.RequestDiff.RightRequest);

        ClearEmptyNestedExportRequestShells(diff.RequestDiff);

        CanonicalizeNestedCompareRunId(diff.RequestDiff.LeftRequest);
        CanonicalizeNestedCompareRunId(diff.RequestDiff.RightRequest);
    }

    internal static void ApplyComparisonRecordAnchorsInPlace(ExportRecordDiffResult diff, ComparisonRecord record)
    {
        ArgumentNullException.ThrowIfNull(diff);
        ArgumentNullException.ThrowIfNull(record);

        if (diff.LeftRunId.Length == 0)
        {
            string? left = AnalysisRunIdCanonicalization.CanonicalRunIdForLookupOrNull(record.LeftRunId);
            if (!string.IsNullOrEmpty(left))
                diff.LeftRunId = left;
        }

        if (diff.RightRunId.Length == 0)
        {
            string? right = AnalysisRunIdCanonicalization.CanonicalRunIdForLookupOrNull(record.RightRunId);
            if (!string.IsNullOrEmpty(right))
                diff.RightRunId = right;
        }

        if (diff.LeftExportRecordId.Length == 0 && !string.IsNullOrWhiteSpace(record.LeftExportRecordId))
            diff.LeftExportRecordId = RunExportRecordIdNormalizer.NormalizeRequired(record.LeftExportRecordId);

        if (diff.RightExportRecordId.Length == 0 && !string.IsNullOrWhiteSpace(record.RightExportRecordId))
            diff.RightExportRecordId = RunExportRecordIdNormalizer.NormalizeRequired(record.RightExportRecordId);
    }

    private static void RemoveUnknownExportDiffFieldNamesInPlace(ExportRecordDiffResult diff)
    {
        RemoveUnknownFieldNamesInPlace(diff.ChangedTopLevelFields, KnownTopLevelChangedFields);
        RemoveUnknownFieldNamesInPlace(diff.RequestDiff.ChangedFlags, KnownRequestChangedFlags);
        RemoveUnknownFieldNamesInPlace(diff.RequestDiff.ChangedValues, KnownRequestChangedValues);
    }

    private static void RemoveUnknownFieldNamesInPlace(List<string> fieldNames, HashSet<string> knownFieldNames)
    {
        for (int i = fieldNames.Count - 1; i >= 0; i--)
        {
            if (!knownFieldNames.Contains(fieldNames[i]))
                fieldNames.RemoveAt(i);
        }
    }

    private static void ClearEmptyNestedExportRequestShells(ExportRecordRequestDiff requestDiff)
    {
        ArgumentNullException.ThrowIfNull(requestDiff);

        if (requestDiff.LeftRequest is not null
            && PersistedAnalysisExportRequestMetadata.IsPersistedEmptyShell(requestDiff.LeftRequest))
        {
            requestDiff.LeftRequest = null;
        }

        if (requestDiff.RightRequest is not null
            && PersistedAnalysisExportRequestMetadata.IsPersistedEmptyShell(requestDiff.RightRequest))
        {
            requestDiff.RightRequest = null;
        }
    }

    private static string NormalizeExportRecordIdAnchor(string? exportRecordId)
    {
        if (string.IsNullOrWhiteSpace(exportRecordId))
            return string.Empty;

        return RunExportRecordIdNormalizer.NormalizeRequired(exportRecordId);
    }

    private static string NormalizeRunIdAnchor(string? runId)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return string.Empty;

        return AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runId);
    }

    private static void CanonicalizeNestedCompareRunId(PersistedAnalysisExportRequest? request)
    {
        if (request is null)
            return;

        string? normalized = PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(request.CompareRunId);
        if (string.IsNullOrEmpty(normalized))
        {
            request.CompareRunId = null;
            return;
        }

        request.CompareRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(normalized);
    }
}
