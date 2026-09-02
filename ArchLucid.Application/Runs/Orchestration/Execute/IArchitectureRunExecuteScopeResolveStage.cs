using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <summary>
///     Authority-pipeline completeness and execute-scope guards before the agent-task loop.
/// </summary>
public interface IArchitectureRunExecuteScopeResolveStage
{
    Task ThrowIfAuthorityPipelineCompleteAsync(
        ArchitectureRun run,
        string runId,
        CancellationToken cancellationToken);
}
