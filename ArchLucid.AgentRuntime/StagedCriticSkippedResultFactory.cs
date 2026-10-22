using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime;

/// <summary>Builds placeholder Critic results when the staged Critic phase times out (Improvement #21).</summary>
public static class StagedCriticSkippedResultFactory
{
    /// <summary>Creates zero-confidence Critic rows so the batch can finish without failing the run.</summary>
    public static AgentResult[] CreateSkippedResults(string runId, IReadOnlyList<AgentTask> criticTasks, int timeoutSeconds)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(criticTasks);

        AgentResult[] results = new AgentResult[criticTasks.Count];

        for (int i = 0; i < criticTasks.Count; i++)
        {
            AgentTask task = criticTasks[i];
            results[i] = new AgentResult
            {
                TaskId = task.TaskId,
                RunId = runId,
                AgentType = AgentType.Critic,
                Confidence = 0,
                Claims =
                [
                    $"Critic agent skipped: staged critic phase exceeded {timeoutSeconds}s dedicated timeout.",
                ],
                EvidenceRefs = [],
                Findings = [],
            };
        }

        return results;
    }
}
