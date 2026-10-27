using System.Text;

using ArchLucid.Contracts.Persistence.Explanation;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Findings;

public static partial class FindingExplainabilityNarrativeBuilder
{
    private static string ResolveRuleId(ExplainabilityTrace trace)
    {
        List<string> rules = CollectNonEmptyTrimmed(trace.RulesApplied);

        if (rules.Count == 0)
            return "Rule id was not stored.";

        return rules.Count == 1 ? rules[0] : string.Join(";", rules);
    }

    private static void AppendGraphNodeBulletSection(
        StringBuilder sb,
        IReadOnlyList<string>? nodeIds,
        IReadOnlyDictionary<string, string>? labelsById)
    {
        if (nodeIds is null || nodeIds.Count == 0)
            return;

        List<string> nonEmpty = nodeIds
            .Where(static s => !string.IsNullOrWhiteSpace(s))
            .Select(static s => s.Trim())
            .ToList();

        if (nonEmpty.Count == 0)
            return;

        sb.Append("Graph nodes examined");
        sb.AppendLine();

        foreach (string id in nonEmpty)
        {
            string line = id;

            if (labelsById is not null)
            {
                if (labelsById.TryGetValue(id, out string? label) && !string.IsNullOrWhiteSpace(label))
                {
                    line = $"{label.Trim()} ({id})";
                }
                else
                {
                    line = $"{GraphNodeReviewerLabel.NotStoredCopy} ({id})";
                }
            }

            sb.Append("- ");
            sb.Append(line);
            sb.AppendLine();
        }

        sb.AppendLine();
    }
}
