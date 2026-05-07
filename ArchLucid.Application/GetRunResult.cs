using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application;
public sealed record GetRunResult(ArchitectureRun Run, IReadOnlyList<AgentTask> Tasks, IReadOnlyList<AgentResult> Results)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(Run, Tasks, Results);
    private static byte __ValidatePrimaryConstructorArguments(ArchLucid.Contracts.Metadata.ArchitectureRun run, System.Collections.Generic.IReadOnlyList<ArchLucid.Contracts.Agents.AgentTask> tasks, System.Collections.Generic.IReadOnlyList<ArchLucid.Contracts.Agents.AgentResult> results)
    {
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(tasks);
        ArgumentNullException.ThrowIfNull(results);
        return (byte)0;
    }
}