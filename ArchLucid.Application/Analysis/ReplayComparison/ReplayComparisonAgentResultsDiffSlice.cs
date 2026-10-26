using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Analysis.ReplayComparison;

/// <inheritdoc cref="IReplayComparisonDiffSlice" />
public sealed class ReplayComparisonAgentResultsDiffSlice(
    IAgentResultDiffService agentResultDiffService,
    IAgentResultRepository agentResultRepository,
    IScopeContextProvider scopeContextProvider) : IReplayComparisonDiffSlice
{
    private readonly IAgentResultDiffService _agentResultDiffService =
        agentResultDiffService ?? throw new ArgumentNullException(nameof(agentResultDiffService));

    private readonly IAgentResultRepository _agentResultRepository =
        agentResultRepository ?? throw new ArgumentNullException(nameof(agentResultRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task ApplyAsync(ReplayComparisonBuildContext context, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        List<AgentResult> leftResults = await ResolveAgentResultsAsync(
            context.LeftDetail.Results,
            context.LeftRunId,
            scope,
            cancellationToken).ConfigureAwait(false);
        List<AgentResult> rightResults = await ResolveAgentResultsAsync(
            context.RightDetail.Results,
            context.RightRunId,
            scope,
            cancellationToken).ConfigureAwait(false);

        if (leftResults.Count > 0 || rightResults.Count > 0)
        {
            context.Report.AgentResultDiff = _agentResultDiffService.Compare(
                context.LeftRunId,
                leftResults,
                context.RightRunId,
                rightResults);
        }
        else
        {
            context.Report.Warnings.Add("Neither run contained agent results.");
        }
    }

    private async Task<List<AgentResult>> ResolveAgentResultsAsync(
        List<AgentResult> hydratedResults,
        string runId,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<AgentResult> loaded = await AnalysisRunIdCanonicalization
            .ResolveAgentResultsForCompareReadAsync(
                _agentResultRepository,
                scope,
                hydratedResults,
                runId,
                useRollupProjection: true,
                cancellationToken)
            .ConfigureAwait(false);

        return loaded.ToList();
    }
}
