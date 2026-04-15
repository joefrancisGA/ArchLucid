using System.Globalization;
using System.Text;

using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
/// Builds a deterministic, human-readable narrative from <see cref="ExplainabilityTrace"/> fields (no LLM).
/// </summary>
public static class FindingExplainabilityNarrativeBuilder
{
    /// <summary>
    /// Composes plain text suitable for UI or API consumers; never returns <see langword="null"/> (empty string when nothing to say).
    /// </summary>
    public static string Build(
        string findingId,
        string title,
        string engineType,
        ExplainabilityTrace trace,
        double traceCompletenessRatio)
    {
        ArgumentNullException.ThrowIfNull(trace);

        StringBuilder sb = new();

        AppendHeader(sb, findingId, title, engineType, traceCompletenessRatio);
        AppendOptionalLine(sb, "Source agent execution trace id", trace.SourceAgentExecutionTraceId);
        AppendBulletSection(sb, "Graph nodes examined", trace.GraphNodeIdsExamined);
        AppendBulletSection(sb, "Rules applied", trace.RulesApplied);
        AppendBulletSection(sb, "Decisions taken", trace.DecisionsTaken);
        AppendBulletSection(sb, "Alternative paths considered", trace.AlternativePathsConsidered);
        AppendBulletSection(sb, "Notes", trace.Notes);

        return sb.Length == 0 ? string.Empty : sb.ToString().TrimEnd();
    }

    private static void AppendHeader(
        StringBuilder sb,
        string findingId,
        string title,
        string engineType,
        double traceCompletenessRatio)
    {
        if (string.IsNullOrWhiteSpace(findingId) && string.IsNullOrWhiteSpace(title))
        {
            return;
        }

        string idPart = string.IsNullOrWhiteSpace(findingId) ? "Finding" : $"Finding {findingId}";
        string titlePart = string.IsNullOrWhiteSpace(title) ? string.Empty : $": {title}";
        string enginePart = string.IsNullOrWhiteSpace(engineType) ? string.Empty : $" (engine: {engineType})";

        sb.Append(idPart);
        sb.Append(titlePart);
        sb.Append(enginePart);
        sb.AppendLine();

        sb.Append("Explainability trace completeness: ");
        sb.Append(traceCompletenessRatio.ToString("P0", CultureInfo.InvariantCulture));
        sb.AppendLine();
        sb.AppendLine();
    }

    private static void AppendOptionalLine(StringBuilder sb, string label, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        sb.Append(label);
        sb.Append(": ");
        sb.Append(value);
        sb.AppendLine();
    }

    private static void AppendBulletSection(StringBuilder sb, string heading, IReadOnlyList<string>? items)
    {
        if (items is null || items.Count == 0)
        {
            return;
        }

        List<string> nonEmpty = items
            .Where(static s => !string.IsNullOrWhiteSpace(s))
            .Select(static s => s.Trim())
            .ToList();

        if (nonEmpty.Count == 0)
        {
            return;
        }

        sb.Append(heading);
        sb.AppendLine();

        foreach (string line in nonEmpty)
        {
            sb.Append("- ");
            sb.Append(line);
            sb.AppendLine();
        }

        sb.AppendLine();
    }
}
