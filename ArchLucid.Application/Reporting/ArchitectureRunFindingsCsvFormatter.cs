using System.Globalization;
using System.Linq;
using System.Text;

using ArchLucid.Application.Agents;
using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Reporting;

/// <summary>
/// Flattens <see cref="ArchitectureRunDetail" /> findings across agent results into RFC 4180-style CSV (<c>\n</c> line endings).
/// </summary>
public static class ArchitectureRunFindingsCsvFormatter
{
    internal const string ConfidenceScoreNotStoredLabel = "Confidence score was not stored.";

    internal const string StoredConfidenceScoreExportPrefix = "Stored confidence score: ";

    internal const string EvaluationConfidenceScoreExportPrefix = "Evaluation confidence score: ";

    internal const string EstimatedUsdSavingsExportPrefix = "Estimated USD savings: ";

    internal const string EstimatedSavingsNotStoredLabel = "Estimated savings were not stored.";

    internal const string CategoryNotStoredLabel = "Category was not stored.";

    internal const string FindingMessageNotStoredLabel = "Finding message was not stored.";

    internal const string TrustLabelNotStoredLabel = "Trust label was not stored.";

    internal const string TrustLabelStoredEmptyLabel = "Trust label was stored empty.";

    internal const string TrustLabelReasonNotStoredLabel = "Trust label reason was not stored.";

    internal const string TrustLabelReasonStoredEmptyLabel = "Trust label reason was stored empty.";

    internal const string FindingsNotStoredReviewerLine = "Findings were not stored.";

    internal const string NoDecisionGradeFindingsReviewerLine = "No decision-grade findings were stored.";

    internal const string AgentResultFindingsListNotStoredReviewerLine =
        "Findings list was not stored on one or more agent results.";

    internal const string FindingNotMutedStatusLabel = "Finding is not muted.";

    internal const string ChecklistCoverageRowsOmittedLinePrefix = "Checklist coverage rows omitted from this file:";

    internal const string NoChecklistCoverageRowsOmittedLine = "No checklist coverage rows were omitted.";

    internal const string HumanReviewStatusNotStoredLabel = "Human review status was not stored.";

    internal const string DispositionNotStoredLabel = "Disposition was not stored.";

    internal const string RevisitTimeNotStoredLabel = "Revisit time was not stored.";

    internal const string FindingIdNotStoredLabel = "Finding id was not stored.";

    internal const string FindingIdStoredEmptyLabel = "Finding id was stored empty.";

    internal const string ResultIdNotStoredLabel = "Result id was not stored.";

    internal const string ResultIdStoredEmptyLabel = "Result id was stored empty.";

    internal const string TaskIdNotStoredLabel = "Task id was not stored.";

    internal const string TaskIdStoredEmptyLabel = "Task id was stored empty.";

    internal const string CategoryStoredEmptyLabel = "Category was stored empty.";

    internal const string FindingMessageStoredEmptyLabel = "Finding message was stored empty.";

    internal const string MuteReasonNotStoredLabel = "Mute reason was not stored.";

    internal const string MuteReasonStoredEmptyLabel = "Mute reason was stored empty.";

    internal const string ExternalProviderNotStoredLabel = "ITSM provider was not stored.";

    internal const string ExternalKeyNotStoredLabel = "ITSM external key was not stored.";

    internal const string ExternalUrlNotStoredLabel = "ITSM external URL was not stored.";

    internal const string LinkedTicketsSummaryNotStoredLabel = "ITSM linked tickets summary was not stored.";

    internal const string NoItsmTrackingRowStoredLabel = "No ITSM tracking row was stored for this finding.";

    internal const string SourceAgentNotStoredLabel = "Source agent was not stored.";

    internal const string MuteReasonNotApplicableLabel =
        "Mute reason was not stored because the finding is not muted.";

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

        if (detail.Results is null)
        {
            sb.Append(FindingsNotStoredReviewerLine).Append('\n');
            sb.Append(HeaderLine).Append('\n');

            return sb.ToString();
        }

        int omittedChecklistCount = CountOmittedChecklistCoverageFindingsInDetail(detail);
        sb.Append(FormatChecklistCoverageOmissionReviewerLine(omittedChecklistCount)).Append('\n');
        sb.Append(HeaderLine).Append('\n');
        int lengthAfterHeader = sb.Length;

        foreach (AgentResult result in detail.Results)
        {
            AppendFindingsFromResult(sb, result, trackingByFindingId);
        }

        if (sb.Length == lengthAfterHeader)
        {
            bool anyNullFindingsList = detail.Results.Any(result => result?.Findings is null);
            string emptyExportLine = anyNullFindingsList
                ? AgentResultFindingsListNotStoredReviewerLine
                : NoDecisionGradeFindingsReviewerLine;

            sb.Insert(0, $"{emptyExportLine}\n");
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

    internal static string FormatChecklistCoverageOmissionReviewerLine(int omittedChecklistCount) =>
        omittedChecklistCount > 0
            ? $"{ChecklistCoverageRowsOmittedLinePrefix} {omittedChecklistCount}"
            : NoChecklistCoverageRowsOmittedLine;

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

    public static string FormatFindingStatus(bool isMuted) => isMuted ? "muted" : FindingNotMutedStatusLabel;

    internal static string FormatSeverityForExport(FindingSeverity severity)
    {
        string stored = severity.ToString();
        string reviewerLabel = MapReviewerSeverityLabel(severity);

        return $"Stored severity: {stored}. Reviewer label: {reviewerLabel}.";
    }

    private static string MapReviewerSeverityLabel(FindingSeverity severity) =>
        severity switch
        {
            FindingSeverity.Critical => "Critical",
            FindingSeverity.Error => "Error",
            FindingSeverity.Warning => "Warning",
            FindingSeverity.Info => "Info",
            _ => "Reviewer label was not stored.",
        };

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

        bool trackingEnrichmentLoaded = trackingByFindingId is not null;

        if (trackingEnrichmentLoaded
            && !string.IsNullOrWhiteSpace(finding.FindingId)
            && trackingByFindingId!.TryGetValue(finding.FindingId.Trim(), out RunFindingExternalTrackingProjection? mapped))
        {
            tracking = mapped;
        }

        sb.AppendJoin(
                ',',
                ExportFormatterService.EscapeCsvField(FormatFindingId(finding.FindingId)),
                ExportFormatterService.EscapeCsvField(FormatResultId(result.ResultId)),
                ExportFormatterService.EscapeCsvField(FormatTaskId(result.TaskId)),
                ExportFormatterService.EscapeCsvField(FormatSourceAgent(result)),
                ExportFormatterService.EscapeCsvField(FormatSeverityForExport(finding.Severity)),
                ExportFormatterService.EscapeCsvField(FormatCategory(finding.Category)),
                ExportFormatterService.EscapeCsvField(FormatMessage(finding.Message)),
                ExportFormatterService.EscapeCsvField(FormatEstimatedUsdSavings(finding)),
                ExportFormatterService.EscapeCsvField(FormatFindingStatus(finding.IsMuted)),
                ExportFormatterService.EscapeCsvField(FormatMuteReason(finding.IsMuted, finding.MuteReason)),
                ExportFormatterService.EscapeCsvField(confidence),
                ExportFormatterService.EscapeCsvField(FormatTrustLabel(finding.TrustLabel)),
                ExportFormatterService.EscapeCsvField(FormatTrustLabelReason(finding.TrustLabelReason)),
                ExportFormatterService.EscapeCsvField(FormatTrackingProvider(tracking, trackingEnrichmentLoaded)),
                ExportFormatterService.EscapeCsvField(FormatTrackingExternalKey(tracking, trackingEnrichmentLoaded)),
                ExportFormatterService.EscapeCsvField(FormatTrackingExternalUrl(tracking, trackingEnrichmentLoaded)),
                ExportFormatterService.EscapeCsvField(FormatHumanReviewStatus(tracking)),
                ExportFormatterService.EscapeCsvField(FormatDisposition(tracking)),
                ExportFormatterService.EscapeCsvField(FormatRevisitDueUtc(tracking)),
                ExportFormatterService.EscapeCsvField(FormatLinkedTicketsSummary(tracking, trackingEnrichmentLoaded)))
            .Append('\n');
    }

    private static string FormatFindingId(string? findingId)
    {
        if (findingId is null)
        {
            return FindingIdNotStoredLabel;
        }

        if (findingId.Length == 0 || string.IsNullOrWhiteSpace(findingId))
        {
            return FindingIdStoredEmptyLabel;
        }

        return findingId.Trim();
    }

    private static string FormatResultId(string? resultId)
    {
        if (resultId is null)
        {
            return ResultIdNotStoredLabel;
        }

        if (resultId.Length == 0 || string.IsNullOrWhiteSpace(resultId))
        {
            return ResultIdStoredEmptyLabel;
        }

        return resultId.Trim();
    }

    private static string FormatTaskId(string? taskId)
    {
        if (taskId is null)
        {
            return TaskIdNotStoredLabel;
        }

        if (taskId.Length == 0 || string.IsNullOrWhiteSpace(taskId))
        {
            return TaskIdStoredEmptyLabel;
        }

        return taskId.Trim();
    }

    private static string FormatMuteReason(bool isMuted, string? muteReason)
    {
        if (!isMuted)
        {
            return MuteReasonNotApplicableLabel;
        }

        if (muteReason is null)
        {
            return MuteReasonNotStoredLabel;
        }

        if (muteReason.Length == 0 || string.IsNullOrWhiteSpace(muteReason))
        {
            return MuteReasonStoredEmptyLabel;
        }

        return muteReason.Trim();
    }

    private static string FormatSourceAgent(AgentResult result)
    {
        AgentType agentType = AgentResultEnvelopeAgentTypeResolver.ResolveAgentType(result);

        return agentType == default ? SourceAgentNotStoredLabel : agentType.ToString();
    }

    private static string FormatTrackingProvider(
        RunFindingExternalTrackingProjection? tracking,
        bool trackingEnrichmentLoaded)
    {
        if (tracking is null)
        {
            return trackingEnrichmentLoaded
                ? NoItsmTrackingRowStoredLabel
                : ExternalProviderNotStoredLabel;
        }

        return string.IsNullOrWhiteSpace(tracking.Provider)
            ? ExternalProviderNotStoredLabel
            : tracking.Provider.Trim();
    }

    private static string FormatTrackingExternalKey(
        RunFindingExternalTrackingProjection? tracking,
        bool trackingEnrichmentLoaded)
    {
        if (tracking is null)
        {
            return trackingEnrichmentLoaded
                ? NoItsmTrackingRowStoredLabel
                : ExternalKeyNotStoredLabel;
        }

        return string.IsNullOrWhiteSpace(tracking.ExternalKey)
            ? ExternalKeyNotStoredLabel
            : tracking.ExternalKey.Trim();
    }

    private static string FormatTrackingExternalUrl(
        RunFindingExternalTrackingProjection? tracking,
        bool trackingEnrichmentLoaded)
    {
        if (tracking is null)
        {
            return trackingEnrichmentLoaded
                ? NoItsmTrackingRowStoredLabel
                : ExternalUrlNotStoredLabel;
        }

        return string.IsNullOrWhiteSpace(tracking.ExternalUrl)
            ? ExternalUrlNotStoredLabel
            : tracking.ExternalUrl.Trim();
    }

    private static string FormatLinkedTicketsSummary(
        RunFindingExternalTrackingProjection? tracking,
        bool trackingEnrichmentLoaded)
    {
        if (tracking is null)
        {
            return trackingEnrichmentLoaded
                ? NoItsmTrackingRowStoredLabel
                : LinkedTicketsSummaryNotStoredLabel;
        }

        return string.IsNullOrWhiteSpace(tracking.ItsmLinkedTicketsSummary)
            ? LinkedTicketsSummaryNotStoredLabel
            : tracking.ItsmLinkedTicketsSummary.Trim();
    }

    private static string FormatEstimatedUsdSavings(ArchitectureFinding finding)
    {
        if (finding.EstimatedUsdSavings.HasValue)
        {
            return EstimatedUsdSavingsExportPrefix
                + finding.EstimatedUsdSavings.Value.ToString(CultureInfo.InvariantCulture);
        }

        return EstimatedSavingsNotStoredLabel;
    }

    private static string FormatConfidenceScore(ArchitectureFinding finding)
    {
        if (finding.ConfidenceScore.HasValue)
        {
            return StoredConfidenceScoreExportPrefix
                + finding.ConfidenceScore.Value.ToString(CultureInfo.InvariantCulture);
        }

        if (finding.EvaluationConfidenceScore.HasValue)
        {
            return EvaluationConfidenceScoreExportPrefix
                + finding.EvaluationConfidenceScore.Value.ToString(CultureInfo.InvariantCulture);
        }

        return ConfidenceScoreNotStoredLabel;
    }

    private static string FormatCategory(string? category)
    {
        if (category is null)
        {
            return CategoryNotStoredLabel;
        }

        return string.IsNullOrWhiteSpace(category) ? CategoryStoredEmptyLabel : category.Trim();
    }

    private static string FormatMessage(string? message)
    {
        if (message is null)
        {
            return FindingMessageNotStoredLabel;
        }

        return string.IsNullOrWhiteSpace(message) ? FindingMessageStoredEmptyLabel : message.Trim();
    }

    private static string FormatTrustLabel(string? trustLabel)
    {
        if (trustLabel is null)
        {
            return TrustLabelNotStoredLabel;
        }

        return string.IsNullOrWhiteSpace(trustLabel) ? TrustLabelStoredEmptyLabel : trustLabel.Trim();
    }

    private static string FormatTrustLabelReason(string? trustLabelReason)
    {
        if (trustLabelReason is null)
        {
            return TrustLabelReasonNotStoredLabel;
        }

        return string.IsNullOrWhiteSpace(trustLabelReason)
            ? TrustLabelReasonStoredEmptyLabel
            : trustLabelReason.Trim();
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
