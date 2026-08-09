using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.Operations;

/// <summary>
///     Infers staged Critic batch progress from agent task rows when phase 1 and Critic are serialised
///     (matches <c>RealAgentExecutor</c> staged path; returns false when agents run in parallel).
/// </summary>
internal static class StagedCriticOperationProgressResolver
{
    internal static bool TryResolveAgentExecutionStepLabel(
        IReadOnlyList<AgentTask> tasks,
        out string stepLabel)
    {
        stepLabel = string.Empty;

        if (tasks.Count == 0)
            return false;

        AgentTask[] nonCriticTasks = tasks.Where(static task => task.AgentType != AgentType.Critic).ToArray();
        AgentTask[] criticTasks = tasks.Where(static task => task.AgentType == AgentType.Critic).ToArray();

        if (nonCriticTasks.Length == 0 || criticTasks.Length == 0)
            return false;

        bool criticInProgress = criticTasks.Any(static task => task.Status == AgentTaskStatus.InProgress);
        bool nonCriticInProgress = nonCriticTasks.Any(static task => task.Status == AgentTaskStatus.InProgress);
        bool allNonCriticTerminal = nonCriticTasks.All(static task => IsTerminal(task.Status));
        bool anyCriticPending = criticTasks.Any(static task => task.Status == AgentTaskStatus.Created);

        if (criticInProgress && nonCriticInProgress)
            return false;

        if (nonCriticInProgress)
        {
            stepLabel = "Phase 1 agents running (before Critic)";
            return true;
        }

        if (allNonCriticTerminal && anyCriticPending && !criticInProgress)
        {
            stepLabel = "Preparing Critic phase";
            return true;
        }

        if (criticInProgress && allNonCriticTerminal)
        {
            stepLabel = "Critic phase running";
            return true;
        }

        return false;
    }

    private static bool IsTerminal(AgentTaskStatus status) =>
        status is AgentTaskStatus.Completed or AgentTaskStatus.Rejected or AgentTaskStatus.Failed;
}
