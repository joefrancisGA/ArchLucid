using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
///     Traces and evidence loaded once per run for confidence enrichment adapters.
/// </summary>
public sealed class AgentEvaluationConfidenceRunContext
{
    public required ScopeContext Scope { get; init; }

    public required IReadOnlyList<AgentExecutionTrace> LatestTraces { get; init; }

    public required IReadOnlyDictionary<AgentType, AgentExecutionTrace> TraceByAgentType { get; init; }

    public required IReadOnlyDictionary<string, AgentExecutionTrace> TraceByTaskId { get; init; }

    public AgentEvidencePackage? Evidence { get; init; }
}
