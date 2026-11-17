using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>Builds <see cref="RunSummaryOnePagerDocumentModel" /> from a finalized run aggregate.</summary>
public static class RunSummaryOnePagerDocumentFactory
{
    public static RunSummaryOnePagerDocumentModel Create(
        ArchitectureRunDetail detail,
        string SponsorReport,
        IReadOnlyList<string> topFindingTitles,
        string? activeTrialExportNotice = null,
        int sealedFindingCount = -1,
        int? findingsSnapshotFindingCount = null,
        string? careerExportHonestyPlainText = null,
        string? sendableExportCoverPlainText = null,
        string? architectRestatementMarkdown = null,
        string? sponsorReportGeneratedDisclaimer = null)

    {
        ArgumentNullException.ThrowIfNull(detail);
        ArgumentNullException.ThrowIfNull(SponsorReport);
        ArgumentNullException.ThrowIfNull(topFindingTitles);

        bool agentFindingsStored = detail.AgentResultsIncludedInDetail;
        (SeverityCounts counts, int mutedFindingCount, int unstoredSeverityCount) = CountBySeverity(detail);
        List<string> severityFootnotes = [];

        if (mutedFindingCount > 0)
        {
            severityFootnotes.Add($"{RunSummaryOnePagerHonestyCopy.MutedFindingsExcludedFromCounts} ({mutedFindingCount} muted).");
        }

        string unstoredSeverityFootnote =
            RunSummaryOnePagerHonestyCopy.FormatUnstoredSeverityOmittedFromCounts(unstoredSeverityCount);

        if (unstoredSeverityFootnote.Length > 0)
        {
            severityFootnotes.Add(unstoredSeverityFootnote);
        }
        string[] topTitles = topFindingTitles
            .Where(static title => !string.IsNullOrWhiteSpace(title))
            .Select(static title => title.Trim())
            .ToArray();
        int totalHighCritical = CountHighCriticalFindings(detail);
        int topHighCriticalRemainder = Math.Max(0, totalHighCritical - topTitles.Length);
        string runId = detail.Run.RunId;
        bool isDemoTenant = ContosoRetailDemoIdentifiers.IsDemoRunId(runId)
            || ContosoRetailDemoIdentifiers.IsDemoRequestId(detail.Run.RequestId);
        bool hasSealedSnapshot = detail.Run.FindingsSnapshotId is Guid snapshotId && snapshotId != Guid.Empty;
        int resolvedSealedFindingCount = RunSummaryOnePagerHonestyCopy.ResolveSealedFindingCount(
            detail.Run.FindingsSnapshotId,
            agentFindingsStored,
            sealedFindingCount,
            findingsSnapshotFindingCount);
        (string? executionModeNoticeTitle, string? executionModeNoticeBody) =
            BoardExportExecutionModeNoticeResolver.TryGetNotice(detail.Run);

        return new RunSummaryOnePagerDocumentModel
        {
            RunId = runId ?? string.Empty,
            SystemName = detail.Manifest?.SystemName,
            SystemNameDisplay = RunSummaryOnePagerHonestyCopy.ResolveSystemName(detail.Manifest?.SystemName),
            RunIdDisplay = RunSummaryOnePagerHonestyCopy.ResolveRunId(runId),
            SealedFindingsSection = RunSummaryOnePagerHonestyCopy.FormatSealedFindingsSection(
                detail.Run.FindingsSnapshotId,
                hasSealedSnapshot ? resolvedSealedFindingCount : 0),
            AgentFindingsCountsStored = agentFindingsStored,
            AgentFindingsNotStoredCopy = RunSummaryOnePagerHonestyCopy.AgentFindingsNotStored,
            CriticalCount = counts.Critical,
            HighCount = counts.High,
            MediumCount = counts.Medium,
            LowCount = counts.Low,
            MutedFindingCount = mutedFindingCount,
            SeverityCountsFootnote = severityFootnotes.Count > 0 ? string.Join(" ", severityFootnotes) : string.Empty,
            SponsorReport = string.IsNullOrWhiteSpace(SponsorReport)
                ? RunSummaryOnePagerHonestyCopy.SponsorReportNotStored
                : SponsorReport.Trim(),
            TopFindingTitles = topTitles,
            TopFindingsEmptyCopy = RunSummaryOnePagerHonestyCopy.ResolveTopFindingsEmptyCopy(
                agentFindingsStored,
                topTitles.Length),
            IsDemoTenant = isDemoTenant,
            ActiveTrialExportNotice = string.IsNullOrWhiteSpace(activeTrialExportNotice)
                ? null
                : activeTrialExportNotice.Trim(),
            IsSimulatorMode = detail.Run.StructuralExecutionMode == StructuralExecutionMode.Simulator,
            HasSealedSnapshot = hasSealedSnapshot,
            FindingsSnapshotId = hasSealedSnapshot
                ? detail.Run.FindingsSnapshotId!.Value.ToString("D")
                : null,
            SealedFindingCount = hasSealedSnapshot ? Math.Max(-1, resolvedSealedFindingCount) : 0,
            SimulatorRehearsalTitle = executionModeNoticeTitle,
            SimulatorRehearsalBody = executionModeNoticeBody,
            CareerExportHonestyPlainText = string.IsNullOrWhiteSpace(careerExportHonestyPlainText)
                ? null
                : careerExportHonestyPlainText.Trim(),
            SendableExportCoverPlainText = string.IsNullOrWhiteSpace(sendableExportCoverPlainText)
                ? null
                : sendableExportCoverPlainText.Trim(),
            ArchitectRestatementMarkdown = string.IsNullOrWhiteSpace(architectRestatementMarkdown)
                ? null
                : architectRestatementMarkdown.Trim(),
            TopHighCriticalRemainderLine = topHighCriticalRemainder > 0
                ? $"{topHighCriticalRemainder} {RunSummaryOnePagerHonestyCopy.TopHighCriticalRemainderLine}"
                : null,
            TopFindingsScopeLine = agentFindingsStored && topTitles.Length > 0
                ? RunSummaryOnePagerHonestyCopy.TopFindingsCriticalErrorScopeLine
                : null,
            TopFindingsMessagePrefixDisclaimer = agentFindingsStored && topTitles.Length > 0
                ? RunSummaryOnePagerHonestyCopy.TopFindingsMessagePrefixDisclaimer
                : null,
            SponsorReportGeneratedDisclaimer = string.IsNullOrWhiteSpace(sponsorReportGeneratedDisclaimer)
                ? null
                : sponsorReportGeneratedDisclaimer.Trim(),

        };
    }

    public static int CountHighCriticalFindings(ArchitectureRunDetail detail)
    {
        ArgumentNullException.ThrowIfNull(detail);

        if (!detail.AgentResultsIncludedInDetail)
            return 0;

        int count = 0;

        foreach (AgentResult result in detail.Results)
        {
            foreach (ArchitectureFinding finding in result.Findings ?? [])
            {
                if (finding is null || finding.IsMuted)
                    continue;

                if (!finding.SeverityStored)
                    continue;

                if (finding.Severity is FindingSeverity.Critical or FindingSeverity.Error)
                    count++;
            }
        }

        return count;
    }

    public static IReadOnlyList<ArchitectureFinding> SelectTopHighCriticalFindings(ArchitectureRunDetail detail, int maxCount)
    {
        ArgumentNullException.ThrowIfNull(detail);

        if (!detail.AgentResultsIncludedInDetail)
        {
            return [];
        }

        List<ArchitectureFinding> findings = [];

        foreach (AgentResult result in detail.Results)
        {
            foreach (ArchitectureFinding finding in result.Findings ?? [])
            {
                if (finding is null || finding.IsMuted)
                    continue;

                if (!finding.SeverityStored)
                    continue;

                if (finding.Severity is FindingSeverity.Critical or FindingSeverity.Error)
                    findings.Add(finding);
            }
        }

        return findings
            .OrderByDescending(static f => f.Severity == FindingSeverity.Critical)
            .ThenBy(static f => f.Message)
            .Take(maxCount)
            .ToArray();
    }

    private static (SeverityCounts counts, int mutedFindingCount, int unstoredSeverityCount) CountBySeverity(
        ArchitectureRunDetail detail)
    {
        SeverityCounts counts = new();
        int mutedFindingCount = 0;
        int unstoredSeverityCount = 0;

        if (!detail.AgentResultsIncludedInDetail)
        {
            return (counts, mutedFindingCount, unstoredSeverityCount);
        }

        foreach (AgentResult result in detail.Results)
        {
            foreach (ArchitectureFinding finding in result.Findings ?? [])
            {
                if (finding is null)
                    continue;

                if (finding.IsMuted)
                {
                    mutedFindingCount++;
                    continue;
                }

                if (!finding.SeverityStored)
                {
                    unstoredSeverityCount++;
                    continue;
                }

                switch (finding.Severity)
                {
                    case FindingSeverity.Critical:
                        counts.Critical++;
                        break;
                    case FindingSeverity.Error:
                        counts.High++;
                        break;
                    case FindingSeverity.Warning:
                        counts.Medium++;
                        break;
                    case FindingSeverity.Info:
                        counts.Low++;
                        break;
                }
            }
        }

        return (counts, mutedFindingCount, unstoredSeverityCount);
    }

    private sealed class SeverityCounts
    {
        public int Critical
        {
            get;
            set;
        }

        public int High
        {
            get;
            set;
        }

        public int Medium
        {
            get;
            set;
        }

        public int Low
        {
            get;
            set;
        }
    }
}
