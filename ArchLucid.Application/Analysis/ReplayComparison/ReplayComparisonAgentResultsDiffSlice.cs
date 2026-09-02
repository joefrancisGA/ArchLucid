using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Agents;

namespace ArchLucid.Application.Analysis.ReplayComparison;

/// <inheritdoc cref="IReplayComparisonDiffSlice" />
public sealed class ReplayComparisonAgentResultsDiffSlice(IAgentResultDiffService agentResultDiffService) : IReplayComparisonDiffSlice
{
    private readonly IAgentResultDiffService _agentResultDiffService =
        agentResultDiffService ?? throw new ArgumentNullException(nameof(agentResultDiffService));

    public Task ApplyAsync(ReplayComparisonBuildContext context, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        List<AgentResult> leftResults = context.LeftDetail.Results;
        List<AgentResult> rightResults = context.RightDetail.Results;

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

        return Task.CompletedTask;
    }
}
