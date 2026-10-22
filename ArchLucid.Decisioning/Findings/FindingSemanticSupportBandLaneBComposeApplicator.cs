using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>AS-058: overlay Working semantic support bands with optional Lane B async scores at read time.</summary>
public static class FindingSemanticSupportBandLaneBComposeApplicator
{
    public static void ApplyToAgentResults(
        IReadOnlyList<AgentResult> results,
        IReadOnlyDictionary<string, AgentOutputSemanticScore> semanticScoresByTraceId,
        IReadOnlyDictionary<string, string> traceIdByTaskId)
    {
        ArgumentNullException.ThrowIfNull(results);
        ArgumentNullException.ThrowIfNull(semanticScoresByTraceId);
        ArgumentNullException.ThrowIfNull(traceIdByTaskId);

        foreach (AgentResult result in results)
        {
            string? traceId = ResolveTraceIdForResult(result, traceIdByTaskId);

            ApplyToArchitectureFindings(result.Findings, traceId, semanticScoresByTraceId);
            ApplyToArchitectureFindings(result.ChecklistCoverage, traceId, semanticScoresByTraceId);
        }
    }

    public static void ApplyToFindings(
        IReadOnlyList<Finding> findings,
        IReadOnlyDictionary<string, AgentOutputSemanticScore> semanticScoresByTraceId)
    {
        ArgumentNullException.ThrowIfNull(findings);
        ArgumentNullException.ThrowIfNull(semanticScoresByTraceId);

        foreach (Finding finding in findings)
        {
            if (finding.Classification == FindingClassification.ChecklistCoverage)
                continue;

            if (finding.SemanticSupportBand == FindingSemanticSupportBand.NotScored)
                continue;

            FindingSemanticSupportBand heuristicBand =
                finding.SemanticSupportBand ?? FindingSemanticSupportBand.Unchecked;

            string? traceId = finding.AgentExecutionTraceId ?? finding.Trace.SourceAgentExecutionTraceId;

            finding.SemanticSupportBand = FindingSemanticSupportBandComposer.ComposeForWorking(
                heuristicBand,
                traceId,
                semanticScoresByTraceId);
        }
    }

    private static void ApplyToArchitectureFindings(
        IReadOnlyList<ArchitectureFinding> findings,
        string? traceId,
        IReadOnlyDictionary<string, AgentOutputSemanticScore> semanticScoresByTraceId)
    {
        foreach (ArchitectureFinding finding in findings)
        {
            if (finding.Classification == FindingClassification.ChecklistCoverage)
                continue;

            if (finding.SemanticSupportBand == FindingSemanticSupportBand.NotScored)
                continue;

            FindingSemanticSupportBand heuristicBand =
                finding.SemanticSupportBand ?? FindingSemanticSupportBand.Unchecked;

            finding.SemanticSupportBand = FindingSemanticSupportBandComposer.ComposeForWorking(
                heuristicBand,
                traceId,
                semanticScoresByTraceId);
        }
    }

    private static string? ResolveTraceIdForResult(
        AgentResult result,
        IReadOnlyDictionary<string, string> traceIdByTaskId)
    {
        if (string.IsNullOrWhiteSpace(result.TaskId))
            return null;

        return traceIdByTaskId.TryGetValue(result.TaskId.Trim(), out string? traceId)
            ? traceId
            : null;
    }
}
