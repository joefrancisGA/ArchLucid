using System.Text;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.AgentRuntime.Tests.DriftDetection;

internal static class GoldenCohortDriftSignalExtractor
{
    internal static GoldenCohortDriftFindingSummary Extract(IReadOnlyList<AgentResult> results)
    {
        GoldenCohortDriftFindingSummary summary = new();

        foreach (AgentResult result in results)
        {
            foreach (ArchitectureFinding finding in result.Findings)
            {
                summary.FindingCount++;

                string sev = finding.Severity.ToString();
                summary.SeverityCounts.TryGetValue(sev, out int prev);
                summary.SeverityCounts[sev] = prev + 1;

                string titleFp = NormalizeFingerprint($"{finding.Category} {finding.Message}");

                if (titleFp.Length > 0)
                    summary.NormalizedTitles.Add(titleFp);
            }

            foreach (string fp in (result.Claims).Select(NormalizeFingerprint).Where(fp => fp.Length > 0))
            {
                summary.NormalizedRecommendations.Add(fp);
            }
        }

        summary.NormalizedTitles.Sort(StringComparer.Ordinal);
        summary.NormalizedRecommendations.Sort(StringComparer.Ordinal);

        return summary;
    }

    internal static string NormalizeFingerprint(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return string.Empty;

        string trimmed = raw.Trim().ToLowerInvariant();
        StringBuilder sb = new(trimmed.Length);

        bool space = false;

        foreach (char ch in trimmed)
        {
            if (char.IsWhiteSpace(ch))
            {
                space = true;
                continue;
            }

            if (space && sb.Length > 0)
            {
                sb.Append(' ');
                space = false;
            }

            sb.Append(ch);
        }

        return sb.ToString();
    }
}
