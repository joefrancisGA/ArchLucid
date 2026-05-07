using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application;
public sealed record GetRunResult
{
    public ArchitectureRun Run { get; init; }
    public IReadOnlyList<AgentTask> Tasks { get; init; }
    public IReadOnlyList<AgentResult> Results { get; init; }

    public GetRunResult(ArchitectureRun run, IReadOnlyList<AgentTask> tasks, IReadOnlyList<AgentResult> results)
    {
        Run = run ?? throw new ArgumentNullException(nameof(run));
        Tasks = tasks ?? throw new ArgumentNullException(nameof(tasks));
        Results = results ?? throw new ArgumentNullException(nameof(results));
    }
}