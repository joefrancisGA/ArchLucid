using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.ExecutionMode;

/// <summary>
///     Stamps durable per-task execution-mode fields on <see cref="AgentResult" /> (TB-970).
/// </summary>
public static class TaskExecutionModeOutcomeApplicator
{
    public static void Apply(AgentResult result, StructuralExecutionMode mode, bool cacheServed = false)
    {
        ArgumentNullException.ThrowIfNull(result);

        result.TaskStructuralExecutionMode = mode;
        result.CacheServed = cacheServed;
    }
}
