using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Retrieval;

namespace ArchLucid.Application.Runs;

/// <summary>Builds <see cref="RunRetrievalGroundingSummaryDto"/> from persisted traces and agent results.</summary>
public static class RunRetrievalGroundingSummaryBuilder
{
    private const double LowCitationCoverageThreshold = 0.5;

    private static readonly IReadOnlyDictionary<AgentType, string> RagAgentWireNames =
        new Dictionary<AgentType, string>
        {
            [AgentType.Topology] = "Topology",
            [AgentType.Cost] = "Cost",
            [AgentType.Compliance] = "Compliance",
        };

    public static RunRetrievalGroundingSummaryDto Build(
        IReadOnlyList<RetrievalGroundingTraceRecord> traces,
        IReadOnlyList<AgentResult>? agentResults)
    {
        ArgumentNullException.ThrowIfNull(traces);

        List<string> agentsWithTraces = traces
            .Select(static trace => trace.AgentName)
            .Where(static name => !string.IsNullOrWhiteSpace(name))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(static name => name, StringComparer.OrdinalIgnoreCase)
            .ToList();

        int traceCount = traces.Count;
        int totalChunks = traces.Sum(static trace => trace.RetrievedChunkIds.Count);

        double averageCitationCoverage = traceCount == 0
            ? 0d
            : traces.Average(static trace => trace.CitationCoverage);

        List<string> expectedAgentsMissingTraces = ResolveExpectedAgentsMissingTraces(agentResults, agentsWithTraces);

        string disposition = ResolveDisposition(traceCount, totalChunks, averageCitationCoverage, expectedAgentsMissingTraces);

        return new RunRetrievalGroundingSummaryDto
        {
            TraceCount = traceCount,
            AgentsWithTraces = agentsWithTraces,
            ExpectedAgentsMissingTraces = expectedAgentsMissingTraces,
            AverageCitationCoverage = averageCitationCoverage,
            TotalRetrievedChunks = totalChunks,
            Disposition = disposition,
            OperatorDetail = BuildOperatorDetail(disposition, expectedAgentsMissingTraces, traceCount, totalChunks),
        };
    }

    private static List<string> ResolveExpectedAgentsMissingTraces(
        IReadOnlyList<AgentResult>? agentResults,
        IReadOnlyList<string> agentsWithTraces)
    {
        if (agentResults is null || agentResults.Count == 0)
            return [];

        HashSet<string> tracedAgents = agentsWithTraces
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        HashSet<string> missing = [];

        foreach (AgentResult result in agentResults)
        {
            if (!RagAgentWireNames.TryGetValue(result.AgentType, out string? expectedAgentName))
                continue;

            if (!tracedAgents.Contains(expectedAgentName))
                missing.Add(expectedAgentName);
        }

        return missing.OrderBy(static name => name, StringComparer.OrdinalIgnoreCase).ToList();
    }

    private static string ResolveDisposition(
        int traceCount,
        int totalChunks,
        double averageCitationCoverage,
        IReadOnlyList<string> expectedAgentsMissingTraces)
    {
        if (expectedAgentsMissingTraces.Count > 0)
            return "HOLD";

        if (traceCount == 0)
            return "WARN";

        if (totalChunks == 0 || averageCitationCoverage < LowCitationCoverageThreshold)
            return "WARN";

        return "PASS";
    }

    private static string? BuildOperatorDetail(
        string disposition,
        IReadOnlyList<string> expectedAgentsMissingTraces,
        int traceCount,
        int totalChunks)
    {
        if (expectedAgentsMissingTraces.Count > 0)
        {
            return
                $"Missing retrieval grounding traces for: {string.Join(", ", expectedAgentsMissingTraces)}. Open the retrieval-grounding panel before sponsor send.";
        }

        if (traceCount == 0)
            return "No retrieval grounding traces persisted for this run.";

        if (totalChunks == 0)
            return "Grounding traces exist but no retrieved chunks were recorded.";

        return disposition switch
        {
            "PASS" => null,
            "WARN" => "Citation coverage or chunk counts are low — review grounding rows before external send.",
            _ => null,
        };
    }
}
