using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Manifest;

/// <summary>
///     Derives a coarse risk label from authority <see cref="ManifestDocument" /> unresolved issues (deterministic; no LLM).
/// </summary>
[Obsolete("Use TradeoffDetectionEngine (risk-03). TODO: derive posture from detected tradeoffs instead of unresolved issues.", error: false)]
public static class AuthorityManifestRiskPosture
{
    public const string NotDerivedFromUnresolvedIssuesLabel = "Not derived from unresolved issues.";

    public const string NotDerivedFromIssueSeverityLabel = "Not derived from issue severity.";

    /// <summary>
    ///     Returns <c>Low</c>, <c>Medium</c>, <c>High</c>, <c>Critical</c>, or an honesty label when posture cannot be derived.
    /// </summary>
    public static string Derive(ManifestDocument manifest)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        if (manifest.UnresolvedIssues.Items.Count == 0)
            return NotDerivedFromUnresolvedIssuesLabel;

        int worst = 0;
        bool anyStoredSeverity = false;

        foreach (ManifestIssue issue in manifest.UnresolvedIssues.Items)
        {
            if (!TryMapSeverityRank(issue.Severity, out int rank))
                continue;

            anyStoredSeverity = true;
            worst = Math.Max(worst, rank);
        }

        if (!anyStoredSeverity)
            return NotDerivedFromIssueSeverityLabel;

        return worst switch
        {
            >= 4 => "Critical",
            3 => "High",
            2 => "Medium",
            _ => "Low"
        };
    }

    public static bool IsDerivedTierLabel(string? riskPosture)
    {
        if (string.IsNullOrWhiteSpace(riskPosture))
            return false;

        return riskPosture.Trim() switch
        {
            "Low" or "Medium" or "High" or "Critical" => true,
            _ => false
        };
    }

    private static bool TryMapSeverityRank(string? severity, out int rank)
    {
        rank = 0;

        if (string.IsNullOrWhiteSpace(severity))
            return false;

        string s = severity.Trim();

        if (string.Equals(s, "Critical", StringComparison.OrdinalIgnoreCase))
        {
            rank = 4;
            return true;
        }

        if (string.Equals(s, "High", StringComparison.OrdinalIgnoreCase))
        {
            rank = 3;
            return true;
        }

        if (string.Equals(s, "Medium", StringComparison.OrdinalIgnoreCase)
            || string.Equals(s, "Warning", StringComparison.OrdinalIgnoreCase))
        {
            rank = 2;
            return true;
        }

        if (string.Equals(s, "Low", StringComparison.OrdinalIgnoreCase)
            || string.Equals(s, "Info", StringComparison.OrdinalIgnoreCase))
        {
            rank = 1;
            return true;
        }

        return false;
    }
}
