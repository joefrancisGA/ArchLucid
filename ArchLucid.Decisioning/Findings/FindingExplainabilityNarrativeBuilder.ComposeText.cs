using System.Text;

using ArchLucid.Contracts.Persistence.Explanation;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Findings;

public static partial class FindingExplainabilityNarrativeBuilder
{
    /// <summary>
    ///     Composes plain text suitable for UI or API consumers; never returns <see langword="null" /> (empty string when
    ///     nothing to say).
    /// </summary>
    public static string Build(
        string findingId,
        string title,
        string engineType,
        ExplainabilityTrace trace,
        double traceCompletenessRatio)
    {
        return Build(findingId, title, engineType, trace, traceCompletenessRatio, null);
    }

    /// <summary>
    ///     Same as <see cref="Build(string,string,string,ExplainabilityTrace,double)" />, but resolves graph node ids to
    ///     <c>Label (id)</c> when <paramref name="graphNodeLabels" /> contains a non-empty entry for the id.
    /// </summary>
    public static string Build(
        string findingId,
        string title,
        string engineType,
        ExplainabilityTrace trace,
        double traceCompletenessRatio,
        IReadOnlyDictionary<string, string>? graphNodeLabels)
    {
        ArgumentNullException.ThrowIfNull(trace);

        StringBuilder sb = new();

        AppendHeader(sb, findingId, title, engineType);
        AppendOptionalLine(sb, "Source agent execution trace id", trace.SourceAgentExecutionTraceId);
        AppendGraphNodeBulletSection(sb, trace.GraphNodeIdsExamined, graphNodeLabels);

        bool includeOmittedSections =
            !string.IsNullOrWhiteSpace(findingId) || !string.IsNullOrWhiteSpace(title);

        if (includeOmittedSections)
        {
            AppendOmittedSectionLine(sb, "Graph nodes examined", trace.GraphNodeIdsExamined);
            AppendBulletSection(sb, "Rules applied", trace.RulesApplied);
            AppendOmittedSectionLine(sb, "Rules applied", trace.RulesApplied);
            AppendBulletSection(sb, "Decisions taken", trace.DecisionsTaken);
            AppendOmittedSectionLine(sb, "Decisions taken", trace.DecisionsTaken);
            AppendBulletSection(sb, "Alternative paths considered", trace.AlternativePathsConsidered);
            AppendOmittedSectionLine(sb, "Alternative paths considered", trace.AlternativePathsConsidered);
            AppendBulletSection(sb, "Notes", trace.Notes);
            AppendOmittedSectionLine(sb, "Notes", trace.Notes);
        }
        else
        {
            AppendBulletSection(sb, "Rules applied", trace.RulesApplied);
            AppendBulletSection(sb, "Decisions taken", trace.DecisionsTaken);
            AppendBulletSection(sb, "Alternative paths considered", trace.AlternativePathsConsidered);
            AppendBulletSection(sb, "Notes", trace.Notes);
        }

        return sb.Length == 0 ? string.Empty : sb.ToString().TrimEnd();
    }

    private static void AppendHeader(
        StringBuilder sb,
        string findingId,
        string title,
        string engineType)
    {
        if (string.IsNullOrWhiteSpace(findingId) && string.IsNullOrWhiteSpace(title))
            return;

        string idPart = string.IsNullOrWhiteSpace(findingId) ? "Finding" : $"Finding {findingId}";
        string titlePart = string.IsNullOrWhiteSpace(title)
            ? ": Finding title was not stored"
            : $": {title}";
        string enginePart = string.IsNullOrWhiteSpace(engineType)
            ? " (engine type was not stored)"
            : $" (engine: {engineType})";

        sb.Append(idPart);
        sb.Append(titlePart);
        sb.Append(enginePart);
        sb.AppendLine();

        sb.AppendLine("Trace completeness is not a stored quality score.");
        sb.AppendLine();
    }

    private static void AppendOptionalLine(StringBuilder sb, string label, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return;

        sb.Append(label);
        sb.Append(": ");
        sb.Append(value);
        sb.AppendLine();
    }

    private static void AppendOmittedSectionLine(StringBuilder sb, string heading, IReadOnlyList<string>? items)
    {
        if (items is null || items.Count == 0)
        {
            sb.Append(heading);
            sb.Append(" were not stored.");
            sb.AppendLine();
            sb.AppendLine();
        }
    }

    private static void AppendBulletSection(StringBuilder sb, string heading, IReadOnlyList<string>? items)
    {
        if (items is null || items.Count == 0)
            return;

        List<string> nonEmpty = items
            .Where(static s => !string.IsNullOrWhiteSpace(s))
            .Select(static s => s.Trim())
            .ToList();

        if (nonEmpty.Count == 0)
            return;

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
