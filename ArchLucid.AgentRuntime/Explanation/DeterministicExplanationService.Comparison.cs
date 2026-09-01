using ArchLucid.Core.Comparison;
using ArchLucid.Core.Explanation;
using ArchLucid.Decisioning.Models;

using JetBrains.Annotations;

namespace ArchLucid.AgentRuntime.Explanation;

public sealed partial class DeterministicExplanationService
{
    /// <inheritdoc />
    public ComparisonExplanationResult BuildComparisonExplanation(
        ComparisonResult comparison,
        List<string> majorChanges,
        string? llmJson)
    {
        LlmComparisonJson? parsed = TryDeserialize<LlmComparisonJson>(llmJson);

        return new ComparisonExplanationResult
        {
            HighLevelSummary = !string.IsNullOrWhiteSpace(parsed?.HighLevelSummary)
                ? parsed.HighLevelSummary.Trim()
                : BuildComparisonHeuristicSummary(comparison),
            MajorChanges = majorChanges,
            KeyTradeoffs = parsed?.KeyTradeoffs?.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim())
                .ToList() ?? [],
            Narrative = !string.IsNullOrWhiteSpace(parsed?.Narrative)
                ? parsed.Narrative.Trim()
                : BuildComparisonNarrativeFallback(comparison, majorChanges)
        };
    }

    /// <inheritdoc />
    public List<string> ExtractMajorChanges(ComparisonResult c)
    {
        List<string> list = [];

        foreach (DecisionDelta d in c.DecisionChanges)

            if (d.ChangeType == "Modified")

                list.Add(
                    $"Decision '{d.DecisionKey}' changed from '{d.BaseValue ?? "—"}' to '{d.TargetValue ?? "—"}'.");

            else if (d.ChangeType == "Added")

                list.Add($"Decision '{d.DecisionKey}' added (selected: '{d.TargetValue ?? "—"}').");

            else if (d.ChangeType == "Removed")

                list.Add($"Decision '{d.DecisionKey}' removed (was '{d.BaseValue ?? "—"}').");

        list.AddRange(c.RequirementChanges.Take(30).Select(r => $"Requirement '{r.RequirementName}': {r.ChangeType}."));

        return list;
    }

    /// <inheritdoc />
    public string FormatRequirementChanges(ComparisonResult c)
    {
        return c.RequirementChanges.Count == 0
            ? "(none)"
            : string.Join("\n", c.RequirementChanges.Select(r => $"- {r.RequirementName}: {r.ChangeType}"));
    }

    /// <inheritdoc />
    public string FormatSecurityChanges(ComparisonResult c)
    {
        return c.SecurityChanges.Count == 0
            ? "(none)"
            : string.Join("\n",
                c.SecurityChanges.Select(s =>
                    $"- {s.ControlName}: {s.BaseStatus ?? "—"} → {s.TargetStatus ?? "—"}"));
    }

    /// <inheritdoc />
    public string FormatTopologyChanges(ComparisonResult c)
    {
        return c.TopologyChanges.Count == 0
            ? "(none)"
            : string.Join("\n", c.TopologyChanges.Select(t => $"- {t.Resource} ({t.ChangeType})"));
    }

    /// <inheritdoc />
    public string FormatCostChanges(ComparisonResult c)
    {
        return c.CostChanges.Count == 0
            ? "(none)"
            : string.Join("\n",
                c.CostChanges.Select(x =>
                    $"- Max monthly: {x.BaseCost?.ToString("0.00") ?? "—"} → {x.TargetCost?.ToString("0.00") ?? "—"}"));
    }

    private static string BuildComparisonHeuristicSummary(ComparisonResult c)
    {
        List<string> parts = [];

        if (c.DecisionChanges.Count > 0)
            parts.Add($"{c.DecisionChanges.Count} decision change(s)");

        if (c.RequirementChanges.Count > 0)
            parts.Add($"{c.RequirementChanges.Count} requirement change(s)");

        if (c.SecurityChanges.Count > 0)
            parts.Add($"{c.SecurityChanges.Count} security delta(s)");

        if (c.TopologyChanges.Count > 0)
            parts.Add($"{c.TopologyChanges.Count} topology resource change(s)");

        if (c.CostChanges.Count > 0)
            parts.Add("cost posture changed");

        return parts.Count == 0
            ? "No material differences detected between manifests."
            : "Between runs: " + string.Join("; ", parts) + ".";
    }

    private static string BuildComparisonNarrativeFallback(ComparisonResult c, List<string> majorChanges)
    {
        List<string> lines =
        [
            "The target run differs from the base run in the areas summarized below.",
            string.Join(" ", c.SummaryHighlights)
        ];
        lines.AddRange(majorChanges.Take(15));

        return string.Join("\n\n", lines.Where(x => !string.IsNullOrWhiteSpace(x)));
    }

    [UsedImplicitly]
    private sealed class LlmComparisonJson
    {
        [UsedImplicitly]
        public string? HighLevelSummary
        {
            get;
        }

        [UsedImplicitly]
        public List<string>? KeyTradeoffs
        {
            get;
        }

        [UsedImplicitly]
        public string? Narrative
        {
            get;
        }
    }
}
