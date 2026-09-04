using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Explanation;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Findings;

public static partial class FindingExplainabilityNarrativeBuilder
{
    /// <summary>
    ///     Builds the structured factual explainability record from persisted <see cref="Finding" /> +
    ///     <see cref="ExplainabilityTrace" /> (no LLM).
    /// </summary>
    public static FindingExplainabilityEvidenceRecord BuildEvidence(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        ExplainabilityTrace trace = finding.Trace;

        List<string> evidenceRefs = CollectEvidenceRefs(finding, trace);
        List<string> alternativePaths = CollectNonEmptyTrimmed(trace.AlternativePathsConsidered);
        string ruleId = ResolveRuleId(trace);
        string conclusion = finding.Rationale;

        return new FindingExplainabilityEvidenceRecord(evidenceRefs, conclusion, alternativePaths, ruleId);
    }

    private static List<string> CollectEvidenceRefs(Finding finding, ExplainabilityTrace trace)
    {
        List<string> refs = [];

        AppendDistinctNonEmpty(refs, trace.GraphNodeIdsExamined);
        AppendDistinctNonEmpty(refs, finding.RelatedNodeIds);

        string? agentTraceId = trace.SourceAgentExecutionTraceId;

        if (string.IsNullOrWhiteSpace(agentTraceId))
            return refs;

        string agentRef = $"agentExecutionTrace:{agentTraceId.Trim()}";

        if (!refs.Contains(agentRef, StringComparer.Ordinal))
            refs.Add(agentRef);

        return refs;
    }

    private static void AppendDistinctNonEmpty(List<string> refs, IEnumerable<string>? candidates)
    {
        if (candidates is null)
            return;

        foreach (string raw in candidates)
        {

            if (string.IsNullOrWhiteSpace(raw))
                continue;

            string trimmed = raw.Trim();

            if (refs.Contains(trimmed, StringComparer.Ordinal))
                continue;

            refs.Add(trimmed);
        }
    }

    private static List<string> CollectNonEmptyTrimmed(IEnumerable<string>? items)
    {
        if (items is null)
            return [];

        return items
            .Where(static s => !string.IsNullOrWhiteSpace(s))
            .Select(static s => s.Trim())
            .ToList();
    }
}
