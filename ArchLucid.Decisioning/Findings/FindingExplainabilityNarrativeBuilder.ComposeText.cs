using System.Text;

using ArchLucid.Contracts.Persistence.Explanation;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Findings;

public static partial class FindingExplainabilityNarrativeBuilder
{
    internal const string FindingIdNotStoredCopy = "Finding id was not stored.";

    internal const string FindingIdStoredEmptyCopy = "Finding id was stored empty.";

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
            AppendTraceListSection(sb, "Graph nodes examined", trace.GraphNodeIdsExamined);
            AppendTraceListSection(sb, "Rules applied", trace.RulesApplied);
            AppendTraceListSection(sb, "Decisions taken", trace.DecisionsTaken);
            AppendTraceListSection(sb, "Alternative paths considered", trace.AlternativePathsConsidered);
            AppendTraceListSection(sb, "Notes", trace.Notes);
        }
        else
        {
            AppendTraceListSection(sb, "Rules applied", trace.RulesApplied);
            AppendTraceListSection(sb, "Decisions taken", trace.DecisionsTaken);
            AppendTraceListSection(sb, "Alternative paths considered", trace.AlternativePathsConsidered);
            AppendTraceListSection(sb, "Notes", trace.Notes);
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
        {
            sb.AppendLine(FindingIdNotStoredCopy);
            sb.AppendLine("Finding title was not stored.");
            string enginePartEmpty = string.IsNullOrWhiteSpace(engineType)
                ? " (engine type was not stored)"
                : $" (engine: {engineType.Trim()})";
            sb.Append(enginePartEmpty.TrimStart());
            sb.AppendLine();
            sb.AppendLine("Trace completeness is not a stored quality score.");
            sb.AppendLine();

            return;
        }

        string idPart = ResolveFindingIdHeaderPart(findingId);
        string titlePart = string.IsNullOrWhiteSpace(title)
            ? title.Length > 0
                ? ": Finding title was stored empty."
                : ": Finding title was not stored."
            : $": {title.Trim()}";
        string enginePart = string.IsNullOrWhiteSpace(engineType)
            ? " (engine type was not stored)"
            : $" (engine: {engineType.Trim()})";

        sb.Append(idPart);
        sb.Append(titlePart);
        sb.Append(enginePart);
        sb.AppendLine();

        sb.AppendLine("Trace completeness is not a stored quality score.");
        sb.AppendLine();
    }

    private static string ResolveFindingIdHeaderPart(string findingId)
    {
        if (findingId.Length == 0)
            return FindingIdNotStoredCopy;

        if (string.IsNullOrWhiteSpace(findingId))
            return FindingIdStoredEmptyCopy;

        return $"Finding {findingId.Trim()}";
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

    private static string? DescribeListOmissionSuffix(IReadOnlyList<string>? items)
    {
        if (items is null)
            return "were not stored.";

        if (items.Count == 0)
            return "were stored empty.";

        if (items.All(static s => string.IsNullOrWhiteSpace(s)))
            return "were stored blank.";

        return null;
    }

    private static void AppendTraceListSection(StringBuilder sb, string heading, IReadOnlyList<string>? items)
    {
        string? omissionSuffix = DescribeListOmissionSuffix(items);

        if (omissionSuffix is not null)
        {
            sb.Append(heading);
            sb.Append(' ');
            sb.Append(omissionSuffix);
            sb.AppendLine();
            sb.AppendLine();

            return;
        }

        AppendBulletSection(sb, heading, items);
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
