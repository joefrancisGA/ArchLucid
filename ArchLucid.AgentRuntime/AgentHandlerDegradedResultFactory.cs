using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime;

/// <summary>Placeholder agent rows when OpenAI or handler resilience degrades without failing the full batch.</summary>
public static class AgentHandlerDegradedResultFactory
{
    /// <summary>Creates a zero-confidence result explaining the degraded handler outcome.</summary>
    public static AgentResult Create(string runId, AgentTask task, string reason)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(task);
        ArgumentException.ThrowIfNullOrWhiteSpace(reason);

        return new AgentResult
        {
            TaskId = task.TaskId,
            RunId = runId,
            AgentType = task.AgentType,
            Confidence = 0,
            Claims = [reason.Trim()],
            EvidenceRefs = [],
            Findings = [],
        };
    }
}
