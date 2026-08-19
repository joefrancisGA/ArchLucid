using ArchLucid.Contracts.Common;

namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Stable correlation key linking <see cref="AgentExecutionTrace" /> rows to provenance graph nodes (TB-036).
/// </summary>
public static class AgentProvenanceCorrelationId
{
    /// <summary>Builds the canonical per-task correlation id: <c>{runId}:{taskId}:{agentType}</c>.</summary>
    public static string Format(string runId, string taskId, AgentType agentType)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(taskId);

        return $"{runId}:{taskId}:{agentType}";
    }
}
