using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>Builds <see cref="RunSummaryOnePagerDocumentModel" /> from a finalized run aggregate.</summary>
public static class RunSummaryOnePagerDocumentFactory
{
    public static RunSummaryOnePagerDocumentModel Create(
        ArchitectureRunDetail detail,
        string executiveSummary,
        IReadOnlyList<string> topFindingTitles)
    {
        ArgumentNullException.ThrowIfNull(detail);
        ArgumentNullException.ThrowIfNull(executiveSummary);
        ArgumentNullException.ThrowIfNull(topFindingTitles);

        SeverityCounts counts = CountBySeverity(detail);

        return new RunSummaryOnePagerDocumentModel
        {
            RunId = detail.Run.RunId ?? string.Empty,
            SystemName = detail.Manifest?.SystemName,
            CriticalCount = counts.Critical,
            HighCount = counts.High,
            MediumCount = counts.Medium,
            LowCount = counts.Low,
            ExecutiveSummary = executiveSummary.Trim(),
            TopFindingTitles = topFindingTitles
                .Where(static title => !string.IsNullOrWhiteSpace(title))
                .Select(static title => title.Trim())
                .Take(3)
                .ToArray()
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
                if (finding is null)
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
