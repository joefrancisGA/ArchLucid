using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     TB-938: resolves which scheduled tasks to clear and force past TB-039 idempotent skip.
/// </summary>
public static class SelectiveAgentExecutePlanner
{
    private static readonly HashSet<AgentType> UpstreamOfCritic =
    [
        AgentType.Topology,
        AgentType.Cost,
        AgentType.Compliance,
    ];

    /// <summary>
    ///     Returns the distinct scheduled tasks that must be cleared and re-executed.
    /// </summary>
    public static IReadOnlyList<AgentTask> ResolveTasksToForce(
        IReadOnlyList<AgentTask> scheduledTasks,
        SelectiveAgentExecuteRequest request)
    {
        ArgumentNullException.ThrowIfNull(scheduledTasks);
        ArgumentNullException.ThrowIfNull(request);

        HashSet<string> selectedTaskIds = new(StringComparer.Ordinal);
        HashSet<AgentType> selectedTypes = [];

        if (request.TaskIds is not null)
        {
            foreach (string? raw in request.TaskIds)
            {
                if (string.IsNullOrWhiteSpace(raw))
                    continue;

                selectedTaskIds.Add(raw.Trim());
            }
        }

        if (request.AgentTypes is not null)
        {
            foreach (string? raw in request.AgentTypes)
            {
                if (string.IsNullOrWhiteSpace(raw))
                    continue;

                if (!TryParseAgentType(raw.Trim(), out AgentType agentType))
                {
                    throw new InvalidOperationException(
                        $"Unknown agent type '{raw.Trim()}' for selective execute.");
                }

                selectedTypes.Add(agentType);
            }
        }

        if (selectedTaskIds.Count == 0 && selectedTypes.Count == 0)
        {
            throw new InvalidOperationException(
                "Selective execute requires at least one taskId or agentType.");
        }

        List<AgentTask> forced = [];

        foreach (AgentTask task in scheduledTasks)
        {
            if (task is null)
                continue;

            if (selectedTaskIds.Contains(task.TaskId) || selectedTypes.Contains(task.AgentType))
                forced.Add(task);
        }

        if (request.IncludeDependents
            && forced.Any(static t => UpstreamOfCritic.Contains(t.AgentType)))
        {
            AgentTask? critic = scheduledTasks.FirstOrDefault(static t => t.AgentType == AgentType.Critic);

            if (critic is not null
                && forced.All(t => !string.Equals(t.TaskId, critic.TaskId, StringComparison.Ordinal)))
            {
                forced.Add(critic);
            }
        }

        if (forced.Count == 0)
        {
            throw new InvalidOperationException(
                "No scheduled tasks matched the selective execute selection.");
        }

        return forced;
    }

    private static bool TryParseAgentType(string value, out AgentType agentType)
    {
        if (Enum.TryParse(value, ignoreCase: true, out agentType)
            && Enum.IsDefined(agentType))
        {
            return true;
        }

        AgentType? fromKey = AgentTypeKeys.TryMapToEnum(value);

        if (fromKey is null)
        {
            agentType = default;

            return false;
        }

        agentType = fromKey.Value;

        return true;
    }
}
