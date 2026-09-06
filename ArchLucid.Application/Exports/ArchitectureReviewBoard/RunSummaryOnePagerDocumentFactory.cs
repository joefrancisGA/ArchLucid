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
        int sealedFindingCount = 0,
        string? careerExportHonestyPlainText = null)
    {
        ArgumentNullException.ThrowIfNull(detail);
        ArgumentNullException.ThrowIfNull(SponsorReport);
        ArgumentNullException.ThrowIfNull(topFindingTitles);

        SeverityCounts counts = CountBySeverity(detail);
        string runId = detail.Run.RunId ?? string.Empty;
        bool isDemoTenant = ContosoRetailDemoIdentifiers.IsDemoRunId(runId)
            || ContosoRetailDemoIdentifiers.IsDemoRequestId(detail.Run.RequestId);
        bool hasSealedSnapshot = detail.Run.FindingsSnapshotId is Guid snapshotId && snapshotId != Guid.Empty;
        (string? executionModeNoticeTitle, string? executionModeNoticeBody) =
            BoardExportExecutionModeNoticeResolver.TryGetNotice(detail.Run);

        return new RunSummaryOnePagerDocumentModel
        {
            RunId = runId,
            SystemName = detail.Manifest?.SystemName,
            CriticalCount = counts.Critical,
            HighCount = counts.High,
            MediumCount = counts.Medium,
            LowCount = counts.Low,
            SponsorReport = SponsorReport.Trim(),
            TopFindingTitles = topFindingTitles
                .Where(static title => !string.IsNullOrWhiteSpace(title))
                .Select(static title => title.Trim())
                .ToArray(),
            IsDemoTenant = isDemoTenant,
            ActiveTrialExportNotice = string.IsNullOrWhiteSpace(activeTrialExportNotice)
                ? null
                : activeTrialExportNotice.Trim(),
            IsSimulatorMode = detail.Run.StructuralExecutionMode == StructuralExecutionMode.Simulator,
            HasSealedSnapshot = hasSealedSnapshot,
            FindingsSnapshotId = hasSealedSnapshot
                ? detail.Run.FindingsSnapshotId!.Value.ToString("D")
                : null,
            SealedFindingCount = hasSealedSnapshot ? Math.Max(0, sealedFindingCount) : 0,
            SimulatorRehearsalTitle = executionModeNoticeTitle,
            SimulatorRehearsalBody = executionModeNoticeBody,
            CareerExportHonestyPlainText = string.IsNullOrWhiteSpace(careerExportHonestyPlainText)
                ? null
                : careerExportHonestyPlainText.Trim(),
        };
    }

    public static IReadOnlyList<ArchitectureFinding> SelectTopHighCriticalFindings(ArchitectureRunDetail detail, int maxCount)
    {
        ArgumentNullException.ThrowIfNull(detail);

        List<ArchitectureFinding> findings = [];

        foreach (AgentResult result in detail.Results ?? [])
        {
            foreach (ArchitectureFinding finding in result.Findings ?? [])
            {
                if (finding is null || finding.IsMuted)
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

    private static SeverityCounts CountBySeverity(ArchitectureRunDetail detail)
    {
        SeverityCounts counts = new();

        foreach (AgentResult result in detail.Results ?? [])
        {
            foreach (ArchitectureFinding finding in result.Findings ?? [])
            {
                if (finding is null)
                    continue;

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

        return counts;
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
