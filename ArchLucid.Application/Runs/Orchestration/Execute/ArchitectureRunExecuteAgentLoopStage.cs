using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <inheritdoc cref="IArchitectureRunExecuteAgentLoopStage" />
public sealed class ArchitectureRunExecuteAgentLoopStage(
    IAgentLoopPrepareStage prepareStage,
    IAgentLoopInvokeStage invokeStage,
    IAgentLoopPersistStage persistStage) : IArchitectureRunExecuteAgentLoopStage
{
    private readonly IAgentLoopPrepareStage _prepareStage =
        prepareStage ?? throw new ArgumentNullException(nameof(prepareStage));

    private readonly IAgentLoopInvokeStage _invokeStage =
        invokeStage ?? throw new ArgumentNullException(nameof(invokeStage));

    private readonly IAgentLoopPersistStage _persistStage =
        persistStage ?? throw new ArgumentNullException(nameof(persistStage));

    public async Task<ExecuteRunResult> ExecuteRunAgentBatchAsync(
        ArchitectureRun run,
        string runId,
        string actor,
        CancellationToken cancellationToken)
    {
        AgentLoopPreparedBatch prepared = await _prepareStage
            .PrepareAsync(run, runId, actor, cancellationToken)
            .ConfigureAwait(false);

        using (prepared.GovernanceScope)
        {
            IReadOnlyList<AgentResult> results = await _invokeStage
                .InvokeAsync(prepared, cancellationToken)
                .ConfigureAwait(false);

            return await _persistStage
                .PersistAsync(prepared, results, cancellationToken)
                .ConfigureAwait(false);
        }
    }
}
