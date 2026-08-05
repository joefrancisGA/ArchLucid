using System.Globalization;
using System.Text;

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
                if (finding is null || string.IsNullOrWhiteSpace(finding.FindingId))
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
                if (finding is not null)
                    n++;
            }
        }

        return n;
    }

    internal static string FormatFindingStatus(bool isMuted)
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
            if (finding is null)
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
        string confidence =
            finding.ConfidenceScore.HasValue
                ? finding.ConfidenceScore.Value.ToString(CultureInfo.InvariantCulture)
                : string.Empty;

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
                ExportFormatterService.EscapeCsvField(result.AgentType.ToString()),
                ExportFormatterService.EscapeCsvField(finding.Severity.ToString()),
                ExportFormatterService.EscapeCsvField(finding.Category),
                ExportFormatterService.EscapeCsvField(finding.Message),
                ExportFormatterService.EscapeCsvField(FormatEstimatedUsdSavings(finding)),
                ExportFormatterService.EscapeCsvField(FormatFindingStatus(finding.IsMuted)),
                ExportFormatterService.EscapeCsvField(finding.MuteReason),
                ExportFormatterService.EscapeCsvField(confidence),
                ExportFormatterService.EscapeCsvField(finding.TrustLabel),
                ExportFormatterService.EscapeCsvField(finding.TrustLabelReason),
                ExportFormatterService.EscapeCsvField(tracking?.Provider),
                ExportFormatterService.EscapeCsvField(tracking?.ExternalKey),
                ExportFormatterService.EscapeCsvField(tracking?.ExternalUrl),
                ExportFormatterService.EscapeCsvField(FormatHumanReviewStatus(tracking)),
                ExportFormatterService.EscapeCsvField(FormatDisposition(tracking)),
                ExportFormatterService.EscapeCsvField(FormatRevisitDueUtc(tracking)),
                ExportFormatterService.EscapeCsvField(tracking?.ItsmLinkedTicketsSummary))
            .Append('\n');
    }

    private static string FormatEstimatedUsdSavings(ArchitectureFinding finding)
    {
        if (finding.EstimatedUsdSavings.HasValue)
        {
            return finding.EstimatedUsdSavings.Value.ToString(CultureInfo.InvariantCulture);
        }

        return string.Empty;
    }

    private static string FormatHumanReviewStatus(RunFindingExternalTrackingProjection? tracking)
    {
        if (tracking is null)
            return string.Empty;

        return tracking.HumanReviewStatus.ToString();
    }

    private static string FormatDisposition(RunFindingExternalTrackingProjection? tracking)
    {
        if (tracking?.LatestDisposition is null)
            return string.Empty;

        return tracking.LatestDisposition.Value.ToString();
    }

    private static string FormatRevisitDueUtc(RunFindingExternalTrackingProjection? tracking)
    {
        if (tracking?.RevisitDueUtc is null)
            return string.Empty;

        return tracking.RevisitDueUtc.Value.ToString("O", CultureInfo.InvariantCulture);
    }
}
