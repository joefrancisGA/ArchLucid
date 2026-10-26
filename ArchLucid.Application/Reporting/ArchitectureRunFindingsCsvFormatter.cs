using System.Globalization;
using System.Text;

using ArchLucid.Application.Agents;
using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Reporting;

/// <summary>
/// Flattens <see cref="ArchitectureRunDetail" /> findings across agent results into RFC 4180-style CSV (<c>\n</c> line endings).
/// </summary>
public static class ArchitectureRunFindingsCsvFormatter
{
    internal const string ConfidenceScoreNotStoredLabel = "Confidence score was not stored.";

    internal const string EstimatedSavingsNotStoredLabel = "Estimated savings were not stored.";

    internal const string CategoryNotStoredLabel = "Category was not stored.";

    internal const string FindingMessageNotStoredLabel = "Finding message was not stored.";

    internal const string TrustLabelNotStoredLabel = "Trust label was not stored.";

    internal const string TrustLabelReasonNotStoredLabel = "Trust label reason was not stored.";

    internal const string HumanReviewStatusNotStoredLabel = "Human review status was not stored.";

    internal const string DispositionNotStoredLabel = "Disposition was not stored.";

    internal const string RevisitTimeNotStoredLabel = "Revisit time was not stored.";

    internal const string MuteReasonNotStoredLabel = "Mute reason was not stored.";

    internal const string TrackingProviderNotStoredLabel = "External tracking provider was not stored.";

    internal const string TrackingExternalKeyNotStoredLabel = "External tracking key was not stored.";

    internal const string TrackingExternalUrlNotStoredLabel = "External tracking URL was not stored.";

    internal const string TrackingItsmSummaryNotStoredLabel = "ITSM linked tickets summary was not stored.";

    internal const string LegacyHeaderLine =
        "FindingId,ResultId,TaskId,SourceAgent,Severity,Category,Message,EstimatedUsdSavings,Status,MuteReason,ConfidenceScore";

    internal const string TrustLabelHeaderSuffix = "TrustLabel,TrustLabelReason";

    internal const string ExternalTrackingHeaderSuffix =
        "Provider,ExternalKey,ExternalUrl,HumanReviewStatus,LatestDisposition,RevisitDueUtc,ItsmLinkedTicketsSummary";

    internal const string HeaderLine =
        LegacyHeaderLine + "," + TrustLabelHeaderSuffix + "," + ExternalTrackingHeaderSuffix;

    /// <returns>CSV text including header; empty findings yield header only.</returns>
    public static string BuildCsvContent(
        ArchitectureRunDetail detail,
        IReadOnlyDictionary<string, RunFindingExternalTrackingProjection>? trackingByFindingId = null)
    {
        ArgumentNullException.ThrowIfNull(detail);

        StringBuilder sb = new();

        sb.Append(HeaderLine).Append('\n');

        if (detail.Results is null)
            return sb.ToString();

        foreach (AgentResult result in detail.Results)
        {
            AppendFindingsFromResult(sb, result, trackingByFindingId);
        }

        return sb.ToString();
    }

    /// <summary>Distinct logical finding ids across agent results (null-safe).</summary>
    public static IReadOnlyList<string> CollectFindingIds(ArchitectureRunDetail detail)
    {
        ArgumentNullException.ThrowIfNull(detail);

        if (detail.Results is null || detail.Results.Count == 0)
            return [];

        HashSet<string> ids = new(StringComparer.Ordinal);

        foreach (AgentResult result in detail.Results)
        {
            if (result?.Findings is null || result.Findings.Count == 0)
                continue;

            foreach (ArchitectureFinding finding in result.Findings)
            {
                if (finding is null
                    || string.IsNullOrWhiteSpace(finding.FindingId)
                    || !DecisionGradeFindingExportFilter.IsDecisionGradeForExport(finding))
                    continue;

                ids.Add(finding.FindingId.Trim());
            }
        }

        return ids.ToArray();
    }

    /// <summary>Count of findings under <paramref name="detail" /> (<c>null</c>-safe).</summary>
    public static int CountFindingsInDetail(ArchitectureRunDetail detail)
    {
        ArgumentNullException.ThrowIfNull(detail);

        if (detail.Results is null || detail.Results.Count == 0)
            return 0;

        int n = 0;

        foreach (AgentResult result in detail.Results)
        {
            if (result?.Findings is null || result.Findings.Count == 0)
            {
                continue;
            }

            foreach (ArchitectureFinding finding in result.Findings)
            {
                if (finding is not null && DecisionGradeFindingExportFilter.IsDecisionGradeForExport(finding))
                    n++;
            }
        }

        return n;
    }

    /// <summary>Count of checklist-coverage rows excluded from CSV export.</summary>
    public static int CountOmittedChecklistCoverageFindingsInDetail(ArchitectureRunDetail detail)
    {
        ArgumentNullException.ThrowIfNull(detail);

        if (detail.Results is null || detail.Results.Count == 0)
            return 0;

        int n = 0;

        foreach (AgentResult result in detail.Results)
        {
            if (result?.Findings is null || result.Findings.Count == 0)
            {
                continue;
            }

            foreach (ArchitectureFinding finding in result.Findings)
            {
                if (finding is not null
                    && DecisionGradeFindingExportFilter.IsChecklistCoverageForExport(finding.Classification))
                {
                    n++;
                }
            }
        }

        return n;
    }

    public static string FormatFindingStatus(bool isMuted)
    {
        return isMuted ? "muted" : "active";
    }

    private static void AppendFindingsFromResult(
        StringBuilder sb,
        AgentResult? result,
        IReadOnlyDictionary<string, RunFindingExternalTrackingProjection>? trackingByFindingId)
    {
        if (result is null || result.Findings is null || result.Findings.Count == 0)
            return;

        foreach (ArchitectureFinding finding in result.Findings)
        {
            if (finding is null || !DecisionGradeFindingExportFilter.IsDecisionGradeForExport(finding))
                continue;

            AppendFindingRow(sb, result, finding, trackingByFindingId);
        }
    }

    private static void AppendFindingRow(
        StringBuilder sb,
        AgentResult result,
        ArchitectureFinding finding,
        IReadOnlyDictionary<string, RunFindingExternalTrackingProjection>? trackingByFindingId)
    {
        string confidence = FormatConfidenceScore(finding);

        RunFindingExternalTrackingProjection? tracking = null;

        if (trackingByFindingId is not null
            && !string.IsNullOrWhiteSpace(finding.FindingId)
            && trackingByFindingId.TryGetValue(finding.FindingId.Trim(), out RunFindingExternalTrackingProjection? mapped))
        {
            tracking = mapped;
        }

        sb.AppendJoin(
                ',',
                ExportFormatterService.EscapeCsvField(finding.FindingId),
                ExportFormatterService.EscapeCsvField(result.ResultId),
                ExportFormatterService.EscapeCsvField(result.TaskId),
                ExportFormatterService.EscapeCsvField(
                    AgentResultEnvelopeAgentTypeResolver.ResolveAgentType(result).ToString()),
                ExportFormatterService.EscapeCsvField(finding.Severity.ToString()),
                ExportFormatterService.EscapeCsvField(FormatCategory(finding.Category)),
                ExportFormatterService.EscapeCsvField(FormatMessage(finding.Message)),
                ExportFormatterService.EscapeCsvField(FormatEstimatedUsdSavings(finding)),
                ExportFormatterService.EscapeCsvField(FormatFindingStatus(finding.IsMuted)),
                ExportFormatterService.EscapeCsvField(FormatMuteReason(finding.IsMuted, finding.MuteReason)),
                ExportFormatterService.EscapeCsvField(confidence),
                ExportFormatterService.EscapeCsvField(FormatTrustLabel(finding.TrustLabel)),
                ExportFormatterService.EscapeCsvField(FormatTrustLabelReason(finding.TrustLabelReason)),
                ExportFormatterService.EscapeCsvField(FormatTrackingProvider(tracking)),
                ExportFormatterService.EscapeCsvField(FormatTrackingExternalKey(tracking)),
                ExportFormatterService.EscapeCsvField(FormatTrackingExternalUrl(tracking)),
                ExportFormatterService.EscapeCsvField(FormatHumanReviewStatus(tracking)),
                ExportFormatterService.EscapeCsvField(FormatDisposition(tracking)),
                ExportFormatterService.EscapeCsvField(FormatRevisitDueUtc(tracking)),
                ExportFormatterService.EscapeCsvField(FormatTrackingItsmSummary(tracking)))
            .Append('\n');
    }

    private static string FormatEstimatedUsdSavings(ArchitectureFinding finding)
    {
        if (finding.EstimatedUsdSavings.HasValue)
        {
            return finding.EstimatedUsdSavings.Value.ToString(CultureInfo.InvariantCulture);
        }

        return EstimatedSavingsNotStoredLabel;
    }

    private static string FormatConfidenceScore(ArchitectureFinding finding)
    {
        if (!finding.ConfidenceScore.HasValue)
        {
            return ConfidenceScoreNotStoredLabel;
        }

        return finding.ConfidenceScore.Value.ToString(CultureInfo.InvariantCulture);
    }

    private static string FormatCategory(string? category)
    {
        if (category is null)
            return CategoryNotStoredLabel;

        return category.Trim().Length > 0 ? category : "Category was stored empty.";
    }

    private static string FormatMessage(string? message)
    {
        if (message is null)
            return FindingMessageNotStoredLabel;

        return message.Trim().Length > 0 ? message : "Finding message was stored empty.";
    }

    private static string FormatTrustLabel(string? trustLabel)
    {
        if (trustLabel is null)
            return TrustLabelNotStoredLabel;

        return trustLabel.Trim().Length > 0 ? trustLabel : "Trust label was stored empty.";
    }

    private static string FormatTrustLabelReason(string? trustLabelReason)
    {
        if (trustLabelReason is null)
            return TrustLabelReasonNotStoredLabel;

        return trustLabelReason.Trim().Length > 0 ? trustLabelReason : "Trust label reason was stored empty.";
    }

    private static string FormatMuteReason(bool isMuted, string? muteReason)
    {
        if (muteReason is null)
            return isMuted ? MuteReasonNotStoredLabel : string.Empty;

        return muteReason.Trim().Length > 0 ? muteReason : "Mute reason was stored empty.";
    }

    private static string FormatTrackingProvider(RunFindingExternalTrackingProjection? tracking)
    {
        if (tracking is null || tracking.Provider is null)
            return TrackingProviderNotStoredLabel;

        return tracking.Provider.Trim().Length > 0
            ? tracking.Provider
            : "External tracking provider was stored empty.";
    }

    private static string FormatTrackingExternalKey(RunFindingExternalTrackingProjection? tracking)
    {
        if (tracking is null || tracking.ExternalKey is null)
            return TrackingExternalKeyNotStoredLabel;

        return tracking.ExternalKey.Trim().Length > 0
            ? tracking.ExternalKey
            : "External tracking key was stored empty.";
    }

    private static string FormatTrackingExternalUrl(RunFindingExternalTrackingProjection? tracking)
    {
        if (tracking is null || tracking.ExternalUrl is null)
            return TrackingExternalUrlNotStoredLabel;

        return tracking.ExternalUrl.Trim().Length > 0
            ? tracking.ExternalUrl
            : "External tracking URL was stored empty.";
    }

    private static string FormatTrackingItsmSummary(RunFindingExternalTrackingProjection? tracking)
    {
        if (tracking is null || tracking.ItsmLinkedTicketsSummary is null)
            return TrackingItsmSummaryNotStoredLabel;

        return tracking.ItsmLinkedTicketsSummary.Trim().Length > 0
            ? tracking.ItsmLinkedTicketsSummary
            : "ITSM linked tickets summary was stored empty.";
    }

    private static string FormatHumanReviewStatus(RunFindingExternalTrackingProjection? tracking)
    {
        if (tracking is null)
            return HumanReviewStatusNotStoredLabel;

        return FindingHumanReviewDispositionDivergence.FormatHumanReviewStatusForExport(
            tracking.HumanReviewStatus,
            tracking.LatestDisposition);
    }

    private static string FormatDisposition(RunFindingExternalTrackingProjection? tracking)
    {
        if (tracking is null || tracking.LatestDisposition is null)
            return DispositionNotStoredLabel;

        return tracking.LatestDisposition.Value.ToString();
    }

    private static string FormatRevisitDueUtc(RunFindingExternalTrackingProjection? tracking)
    {
        if (tracking is null || tracking.RevisitDueUtc is null)
            return RevisitTimeNotStoredLabel;

        return tracking.RevisitDueUtc.Value.ToString("O", CultureInfo.InvariantCulture);
    }
}
