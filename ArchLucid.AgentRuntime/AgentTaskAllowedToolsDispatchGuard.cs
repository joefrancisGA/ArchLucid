using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Enforces <see cref="AgentTask.AllowedTools" /> at handler dispatch (TB-082). Empty list = unrestricted.
/// </summary>
internal static class AgentTaskAllowedToolsDispatchGuard
{
    internal static void EnsureHandlerAllowed(AgentTask task, string dispatchKey)
    {
        ArgumentNullException.ThrowIfNull(task);

        if (string.IsNullOrWhiteSpace(dispatchKey))
            throw new ArgumentException("Dispatch key is required.", nameof(dispatchKey));

        if (task.AllowedTools is null || task.AllowedTools.Count == 0)
            return;

        foreach (string allowed in task.AllowedTools)
        {
            if (string.Equals(allowed?.Trim(), dispatchKey, StringComparison.OrdinalIgnoreCase))
                return;
        }

        throw new AgentToolNotAllowedException(task.TaskId, dispatchKey, task.AllowedTools);
    }
}
