using ArchLucid.Contracts.Agents;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     AS-058: build trace-id keyed Lane B semantic scores from persisted agent execution traces.
///     Uses existing <see cref="IAgentResultEvidenceFaithfulnessChecker" /> output — no new eval worker.
/// </summary>
public static class FindingSemanticSupportBandLaneBSemanticScoreIndex
{
    public static Dictionary<string, AgentOutputSemanticScore> BuildFromTraces(
        IReadOnlyList<AgentExecutionTrace> traces,
        AgentEvidencePackage? evidence,
        IAgentResultEvidenceFaithfulnessChecker faithfulnessChecker)
    {
        ArgumentNullException.ThrowIfNull(traces);
        ArgumentNullException.ThrowIfNull(faithfulnessChecker);

        Dictionary<string, AgentOutputSemanticScore> semanticScoresByTraceId = new(StringComparer.Ordinal);

        foreach (AgentExecutionTrace trace in traces)
        {
            if (string.IsNullOrWhiteSpace(trace.TraceId))
                continue;

            if (!trace.ParseSucceeded || string.IsNullOrEmpty(trace.ParsedResultJson))
                continue;

            AgentOutputSemanticScore semantic = new()
            {
                TraceId = trace.TraceId.Trim(),
                AgentType = trace.AgentType,
            };

            if (evidence is not null)
            {
                AgentResultEvidenceFaithfulnessReport faithReport =
                    faithfulnessChecker.Evaluate(trace.ParsedResultJson, evidence);

                semantic.AgentResultFaithfulnessSupportRatio = faithReport.SupportRatio;
            }

            if (semantic.AgentResultFaithfulnessSupportRatio is null
                && semantic.FindingCitationCoverageRatio is null)
            {
                continue;
            }

            semanticScoresByTraceId[semantic.TraceId] = semantic;
        }

        return semanticScoresByTraceId;
    }

    public static Dictionary<string, string> BuildTraceIdByTaskId(IReadOnlyList<AgentExecutionTrace> traces)
    {
        ArgumentNullException.ThrowIfNull(traces);

        Dictionary<string, string> traceIdByTaskId = new(StringComparer.OrdinalIgnoreCase);

        foreach (AgentExecutionTrace trace in traces)
        {
            if (string.IsNullOrWhiteSpace(trace.TaskId) || string.IsNullOrWhiteSpace(trace.TraceId))
                continue;

            traceIdByTaskId[trace.TaskId.Trim()] = trace.TraceId.Trim();
        }

        return traceIdByTaskId;
    }
}
