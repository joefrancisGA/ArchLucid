using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Enforces <see cref="AgentTask.AllowedTools" /> at handler dispatch (TB-082 / TB-950).
///     Empty/null allowlists remain unrestricted only on non-production-like hosts; production-like hosts deny unless
///     <see cref="AgentTypeKeys.UnrestrictedDispatch" /> is listed explicitly.
/// </summary>
internal static class AgentTaskAllowedToolsDispatchGuard
{
    internal static void EnsureHandlerAllowed(AgentTask task, string dispatchKey, bool productionLikeHosting)
    {
        ArgumentNullException.ThrowIfNull(task);

        if (string.IsNullOrWhiteSpace(dispatchKey))
            throw new ArgumentException("Dispatch key is required.", nameof(dispatchKey));

        if (task.AllowedTools is null || task.AllowedTools.Count == 0)
        {
            if (productionLikeHosting)
            {
                throw new AgentToolNotAllowedException(
                    task.TaskId,
                    dispatchKey,
                    task.AllowedTools ?? []);
            }

            return;
        }

        foreach (string allowed in task.AllowedTools)
        {
            if (string.IsNullOrWhiteSpace(allowed))
                continue;

            string trimmed = allowed.Trim();

            if (string.Equals(trimmed, AgentTypeKeys.UnrestrictedDispatch, StringComparison.OrdinalIgnoreCase))
                return;

            if (string.Equals(trimmed, dispatchKey, StringComparison.OrdinalIgnoreCase))
                return;
        }

        throw new AgentToolNotAllowedException(task.TaskId, dispatchKey, task.AllowedTools);
    }
}
