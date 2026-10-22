using ArchLucid.Contracts.Agents;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
/// Selects the result that belongs to the latest persisted attempt for a task.
/// </summary>
internal static class AgentResultLatestForTaskSelector
{
    internal static AgentResult? Select(
        IReadOnlyList<AgentResult> agentResults,
        string taskId)
    {
        ArgumentNullException.ThrowIfNull(agentResults);
        ArgumentException.ThrowIfNullOrWhiteSpace(taskId);

        return agentResults
            .Where(result => string.Equals(result.TaskId, taskId, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(static result => result.CreatedUtc)
            .ThenByDescending(static result => result.ResultId, StringComparer.Ordinal)
            .FirstOrDefault();
    }
}
