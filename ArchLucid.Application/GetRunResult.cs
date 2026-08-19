using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application;

public sealed record GetRunResult(ArchitectureRun Run, IReadOnlyList<AgentTask> Tasks, IReadOnlyList<AgentResult> Results)
{
    public ArchitectureRun Run
    {
        get;
        init;
    } = Run ?? throw new ArgumentNullException(nameof(Run));

    public IReadOnlyList<AgentTask> Tasks
    {
        get;
        init;
    } = Tasks ?? throw new ArgumentNullException(nameof(Tasks));

    public IReadOnlyList<AgentResult> Results
    {
        get;
        init;
    } = Results ?? throw new ArgumentNullException(nameof(Results));
}
