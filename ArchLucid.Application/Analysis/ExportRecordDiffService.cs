using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Compares two <see cref="RunExportRecord" /> instances and produces an <see cref="ExportRecordDiffResult" />
///     describing changes to top-level export fields and the embedded analysis request options.
/// </summary>
public sealed class ExportRecordDiffService : IExportRecordDiffService
{
    /// <summary>
    ///     Compares <paramref name="left" /> (baseline) against <paramref name="right" /> (candidate) and returns
    ///     a diff of top-level export metadata and any changes to the analysis request options.
    /// </summary>
    public ExportRecordDiffResult Compare(
        RunExportRecord left,
        RunExportRecord right)
    {
        ArgumentNullException.ThrowIfNull(left);
        ArgumentNullException.ThrowIfNull(right);

        RunExportRecordScopedReadNormalizer.NormalizeInPlace(left);
        RunExportRecordScopedReadNormalizer.NormalizeInPlace(right);

        ExportRecordDiffResult result = new()
        {
            LeftExportRecordId = RunExportRecordIdNormalizer.NormalizeRequired(left.ExportRecordId),
            RightExportRecordId = RunExportRecordIdNormalizer.NormalizeRequired(right.ExportRecordId),
            LeftRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForPersistence(left.RunId),
            RightRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForPersistence(right.RunId),
        };

        CompareTopLevel(left, right, result);

        PersistedAnalysisExportRequest? leftRequest = AnalysisExportRequestRehydrator.Rehydrate(left);
        PersistedAnalysisExportRequest? rightRequest = AnalysisExportRequestRehydrator.Rehydrate(right);

        result.RequestDiff = CompareRequests(leftRequest, rightRequest);

        if (!RunIdsEquivalent(left.RunId, right.RunId))

            result.Warnings.Add("The compared export records belong to different runs.");

        if (!string.Equals(left.ExportType, right.ExportType, StringComparison.OrdinalIgnoreCase))

            result.Warnings.Add("The compared export records use different export types.");

        if (leftRequest is null || rightRequest is null)

            result.Warnings.Add("One or both export records did not contain a persisted analysis request.");

        ExportRecordDiffResultNormalizer.NormalizeDisplayAnchors(result);

        return result;
    }

    /// <inheritdoc />
    public Task<ExportRecordDiffResult> CompareAsync(
        RunExportRecord left,
        RunExportRecord right,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        ExportRecordDiffResult result = Compare(left, right);

        return Task.FromResult(result);
    }

    private static void CompareTopLevel(
        RunExportRecord left,
        RunExportRecord right,
        ExportRecordDiffResult result)
    {
        AddIfChangedTrimmed(result.ChangedTopLevelFields, "ExportType", left.ExportType, right.ExportType);
        AddIfChangedTrimmed(result.ChangedTopLevelFields, "Format", left.Format, right.Format);
        AddIfChangedTrimmed(result.ChangedTopLevelFields, "FileName", left.FileName, right.FileName);
        AddIfChangedTrimmed(result.ChangedTopLevelFields, "TemplateProfile", left.TemplateProfile, right.TemplateProfile);
        AddIfChangedTrimmed(result.ChangedTopLevelFields, "TemplateProfileDisplayName", left.TemplateProfileDisplayName,
            right.TemplateProfileDisplayName);
        AddIfChanged(result.ChangedTopLevelFields, "WasAutoSelected", left.WasAutoSelected, right.WasAutoSelected);
        AddIfChangedTrimmed(result.ChangedTopLevelFields, "ResolutionReason", left.ResolutionReason, right.ResolutionReason);
        AddIfChangedTrimmed(result.ChangedTopLevelFields, "ManifestVersion", left.ManifestVersion, right.ManifestVersion);
        AddIfChangedTrimmed(result.ChangedTopLevelFields, "Notes", left.Notes, right.Notes);
        AddIncludedFlagIfChanged(result.ChangedTopLevelFields, "IncludedEvidence", left.IncludedEvidence, right.IncludedEvidence);
        AddIncludedFlagIfChanged(result.ChangedTopLevelFields, "IncludedExecutionTraces", left.IncludedExecutionTraces,
            right.IncludedExecutionTraces);
        AddIncludedFlagIfChanged(result.ChangedTopLevelFields, "IncludedManifest", left.IncludedManifest, right.IncludedManifest);
        AddIncludedFlagIfChanged(result.ChangedTopLevelFields, "IncludedDiagram", left.IncludedDiagram, right.IncludedDiagram);
        AddIncludedFlagIfChanged(result.ChangedTopLevelFields, "IncludedSummary", left.IncludedSummary, right.IncludedSummary);
        AddIncludedFlagIfChanged(result.ChangedTopLevelFields, "IncludedDeterminismCheck", left.IncludedDeterminismCheck,
            right.IncludedDeterminismCheck);
        AddIfChanged(
            result.ChangedTopLevelFields,
            "DeterminismIterations",
            PersistedAnalysisExportRequestDeterminismNormalizer.NormalizeDenormalizedIterationsColumn(
                left.DeterminismIterations,
                left.IncludedDeterminismCheck),
            PersistedAnalysisExportRequestDeterminismNormalizer.NormalizeDenormalizedIterationsColumn(
                right.DeterminismIterations,
                right.IncludedDeterminismCheck));
        AddIncludedFlagIfChanged(result.ChangedTopLevelFields, "IncludedManifestCompare", left.IncludedManifestCompare,
            right.IncludedManifestCompare);
        AddIfChangedTrimmed(result.ChangedTopLevelFields, "CompareManifestVersion", left.CompareManifestVersion,
            right.CompareManifestVersion);
        AddIncludedFlagIfChanged(result.ChangedTopLevelFields, "IncludedAgentResultCompare", left.IncludedAgentResultCompare,
            right.IncludedAgentResultCompare);
        AddRunIdIfChanged(result.ChangedTopLevelFields, "CompareRunId", left.CompareRunId, right.CompareRunId);
    }

    private static ExportRecordRequestDiff CompareRequests(
        PersistedAnalysisExportRequest? left,
        PersistedAnalysisExportRequest? right)
    {
        ExportRecordRequestDiff diff = new() { LeftRequest = left, RightRequest = right };

        if (left is null || right is null)
            return diff;

        AddIfChangedTrimmed(diff.ChangedValues, "TemplateProfile", left.TemplateProfile, right.TemplateProfile);
        AddIfChangedTrimmed(diff.ChangedValues, "Audience", left.Audience, right.Audience);

        AddIfChanged(diff.ChangedFlags, "ExternalDelivery", left.ExternalDelivery, right.ExternalDelivery);
        AddIfChanged(diff.ChangedFlags, "ExecutiveFriendly", left.ExecutiveFriendly, right.ExecutiveFriendly);
        AddIfChanged(diff.ChangedFlags, "RegulatedEnvironment", left.RegulatedEnvironment, right.RegulatedEnvironment);
        AddIfChanged(diff.ChangedFlags, "NeedDetailedEvidence", left.NeedDetailedEvidence, right.NeedDetailedEvidence);
        AddIfChanged(diff.ChangedFlags, "NeedExecutionTraces", left.NeedExecutionTraces, right.NeedExecutionTraces);
        AddIfChanged(diff.ChangedFlags, "NeedDeterminismOrCompareAppendices", left.NeedDeterminismOrCompareAppendices,
            right.NeedDeterminismOrCompareAppendices);

        AddIfChanged(diff.ChangedFlags, "IncludeEvidence", left.IncludeEvidence, right.IncludeEvidence);
        AddIfChanged(diff.ChangedFlags, "IncludeExecutionTraces", left.IncludeExecutionTraces,
            right.IncludeExecutionTraces);
        AddIfChanged(diff.ChangedFlags, "IncludeManifest", left.IncludeManifest, right.IncludeManifest);
        AddIfChanged(diff.ChangedFlags, "IncludeDiagram", left.IncludeDiagram, right.IncludeDiagram);
        AddIfChanged(diff.ChangedFlags, "IncludeSummary", left.IncludeSummary, right.IncludeSummary);
        AddIfChanged(diff.ChangedFlags, "IncludeDeterminismCheck", left.IncludeDeterminismCheck,
            right.IncludeDeterminismCheck);
        AddIfChanged(diff.ChangedFlags, "IncludeManifestCompare", left.IncludeManifestCompare,
            right.IncludeManifestCompare);
        AddIfChanged(diff.ChangedFlags, "IncludeAgentResultCompare", left.IncludeAgentResultCompare,
            right.IncludeAgentResultCompare);

        AddIfChanged(
            diff.ChangedValues,
            "DeterminismIterations",
            NormalizeRequestDeterminismIterations(left),
            NormalizeRequestDeterminismIterations(right));
        AddIfChangedTrimmed(diff.ChangedValues, "CompareManifestVersion", left.CompareManifestVersion,
            right.CompareManifestVersion);
        AddRunIdIfChanged(diff.ChangedValues, "CompareRunId", left.CompareRunId, right.CompareRunId);

        return diff;
    }

    private static int NormalizeRequestDeterminismIterations(PersistedAnalysisExportRequest request) =>
        request.IncludeDeterminismCheck ? request.DeterminismIterations : 0;

    private static bool NormalizeIncludedFlag(bool? value) => value == true;

    private static void AddIncludedFlagIfChanged(
        List<string> target,
        string fieldName,
        bool? left,
        bool? right)
    {
        if (NormalizeIncludedFlag(left) == NormalizeIncludedFlag(right))
            return;

        target.Add(fieldName);
    }

    private static bool RunIdsEquivalent(string left, string right) =>
        GovernanceRunIdNormalizer.AreEquivalent(left, right);

    private static void AddRunIdIfChanged(List<string> target, string fieldName, string? left, string? right)
    {
        if (left is null && right is null)
            return;

        if (left is null || right is null)
        {
            target.Add(fieldName);
            return;
        }

        if (!RunIdsEquivalent(left, right))
            target.Add(fieldName);
    }

    private static void AddIfChangedTrimmed(
        List<string> target,
        string fieldName,
        string? left,
        string? right) =>
        AddIfChanged(
            target,
            fieldName,
            PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(left),
            PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(right));

    private static void AddIfChanged<T>(
        List<string> target,
        string fieldName,
        T left,
        T right)
    {
        if (!AreEqual(left, right))

            target.Add(fieldName);
    }

    private static bool AreEqual<T>(T left, T right)
    {
        if (left is string ls && right is string rs)
            return string.Equals(ls, rs, StringComparison.OrdinalIgnoreCase);

        return EqualityComparer<T>.Default.Equals(left, right);
    }
}
