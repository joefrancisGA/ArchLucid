using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application;

public sealed partial class RunDetailQueryService
{
    private Task<IReadOnlyList<AgentTask>> LoadAgentTasksForRunLookupAsync(
        ScopeContext scope,
        string primaryLookupRunId,
        CancellationToken cancellationToken) =>
        AnalysisRunIdCanonicalization.LoadAgentTasksByRunIdAsync(
            taskRepository,
            scope,
            primaryLookupRunId,
            cancellationToken);

    private Task<IReadOnlyList<AgentResult>> LoadAgentResultsForRunLookupAsync(
        ScopeContext scope,
        string primaryLookupRunId,
        bool useRollupProjection,
        CancellationToken cancellationToken) =>
        AnalysisRunIdCanonicalization.LoadAgentResultsByRunIdAsync(
            resultRepository,
            scope,
            primaryLookupRunId,
            useRollupProjection,
            cancellationToken);

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
