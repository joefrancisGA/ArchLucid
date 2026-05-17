using ArchLucid.Contracts.Agents;

namespace ArchLucid.Core.Diagnostics;

/// <summary>Formats task id lists for <c>Agent execution state transition</c> structured logs.</summary>
public static class AgentExecutionStateTransitionTaskIds
{
    /// <summary>Sorted, comma-separated task ids; <c>(none)</c> when empty.</summary>
    public static string Format(IReadOnlyList<AgentTask> tasks)
    {
        if (tasks is null || tasks.Count == 0)
            return "(none)";

        IEnumerable<string> sanitized = tasks
            .Select(static t => t.TaskId)
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .Select(LogSanitizer.Sanitize)
            .OrderBy(static id => id, StringComparer.OrdinalIgnoreCase);

        string joined = string.Join(',', sanitized);

        return string.IsNullOrEmpty(joined) ? "(none)" : joined;
    }
}
