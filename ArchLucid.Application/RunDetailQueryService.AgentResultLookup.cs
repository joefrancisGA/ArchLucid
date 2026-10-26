using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application;

public sealed partial class RunDetailQueryService
{
    private async Task<IReadOnlyList<AgentTask>> LoadAgentTasksForRunLookupAsync(
        ScopeContext scope,
        string primaryLookupRunId,
        CancellationToken cancellationToken)
    {
        foreach (string lookupKey in AnalysisRunIdCanonicalization.EnumerateRunIdRepositoryLookupKeys(primaryLookupRunId))
        {
            IReadOnlyList<AgentTask> tasks = await taskRepository
                .GetByRunIdAsync(scope, lookupKey, cancellationToken)
                .ConfigureAwait(false);

            if (tasks is { Count: > 0 })
                return tasks;
        }

        return [];
    }

    private async Task<IReadOnlyList<AgentResult>> LoadAgentResultsForRunLookupAsync(
        ScopeContext scope,
        string primaryLookupRunId,
        bool useRollupProjection,
        CancellationToken cancellationToken)
    {
        foreach (string lookupKey in AnalysisRunIdCanonicalization.EnumerateRunIdRepositoryLookupKeys(primaryLookupRunId))
        {
            IReadOnlyList<AgentResult> results = useRollupProjection
                ? await resultRepository
                    .GetRollupProjectionByRunIdAsync(scope, lookupKey, cancellationToken)
                    .ConfigureAwait(false)
                : await resultRepository
                    .GetByRunIdAsync(scope, lookupKey, cancellationToken)
                    .ConfigureAwait(false);

            if (results is { Count: > 0 })
                return results;
        }

        return [];
    }

    private Task<IReadOnlyList<AgentExecutionTraceLlmCostSlice>> LoadLlmCostSlicesForRunLookupAsync(
        ScopeContext scope,
        string primaryLookupRunId,
        CancellationToken cancellationToken) =>
        AnalysisRunIdCanonicalization.LoadLlmCostSlicesByRunIdAsync(
            _agentExecutionTraceRepository,
            scope,
            primaryLookupRunId,
            cancellationToken);
}
