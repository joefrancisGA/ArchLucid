using System.Globalization;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal static partial class PilotProofPacketGovernanceArtifacts
{
    /// <summary>
    ///     Extracts a buyer-safe governed-finding coverage summary sub-object from the
    ///     <c>governedFindingCoverage</c> element of the pilot-run-deltas JSON.
    ///     Returns a "not available" placeholder when the element is absent or the run has no findings.
    /// </summary>
    private static Dictionary<string, object?> BuildGovernedCoverageSummary(JsonElement? coverage)
    {
        if (coverage is null)
        {
            return new Dictionary<string, object?>(StringComparer.Ordinal)
            {
                ["isAvailable"] = false,
                ["note"] = "Governed finding coverage not included in this run's pilot-run-deltas response.",
            };
        }

        JsonElement el = coverage.Value;
        bool isAvailable = el.TryGetProperty("isAvailable", out JsonElement avEl) && avEl.ValueKind == JsonValueKind.True;

        if (!isAvailable)
        {
            return new Dictionary<string, object?>(StringComparer.Ordinal)
            {
                ["isAvailable"] = false,
                ["note"] = "Not available — run has no decision-grade findings.",
            };
        }

        el.TryGetProperty("totalDecisionGradeCount", out JsonElement totalEl);
        el.TryGetProperty("totalChecklistCoverageCount", out JsonElement checklistEl);
        el.TryGetProperty("governedCount", out JsonElement govEl);
        el.TryGetProperty("advisoryCount", out JsonElement advEl);
        el.TryGetProperty("withPolicyRuleCount", out JsonElement ruleEl);
        el.TryGetProperty("withEvidenceRefsCount", out JsonElement evidEl);
        el.TryGetProperty("governedPercentage", out JsonElement pctEl);

        int total = totalEl.TryGetInt32(out int t) ? t : 0;
        int checklist = checklistEl.TryGetInt32(out int c) ? c : 0;
        int governed = govEl.TryGetInt32(out int g) ? g : 0;
        int advisory = advEl.TryGetInt32(out int a) ? a : 0;
        int withPolicyRule = ruleEl.TryGetInt32(out int r) ? r : 0;
        int withEvidenceRefs = evidEl.TryGetInt32(out int e) ? e : 0;
        double? pct = pctEl.TryGetDouble(out double p) ? p : null;

        string pctLabel = pct.HasValue
            ? FormattableString.Invariant($"{pct.Value:F1}%")
            : "n/a";

        return new Dictionary<string, object?>(StringComparer.Ordinal)
        {
            ["isAvailable"] = true,
            ["totalDecisionGradeCount"] = total,
            ["totalChecklistCoverageCount"] = checklist,
            ["governedCount"] = governed,
            ["advisoryCount"] = advisory,
            ["withPolicyRuleCount"] = withPolicyRule,
            ["withEvidenceRefsCount"] = withEvidenceRefs,
            ["governedPercentage"] = pct,
            ["governedPercentageLabel"] = pctLabel,
            ["explanation"] =
                $"Decision-grade: {total}; checklist coverage: {checklist}. " +
                $"{governed} of {total} decision-grade findings ({pctLabel}) are governance-blocking " +
                $"(PolicyViolation tier). {advisory} are advisory-only and excluded from the pre-commit gate. " +
                $"{withPolicyRule} carry a policy-rule trace; {withEvidenceRefs} have evidence references.",
        };
    }
}
