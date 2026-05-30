using ArchLucid.Api.Models;
using ArchLucid.Application.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Api.Support;

internal static class RunAgentExecutionLlmCostEstimateAppender
{
    internal static async Task AppendAsync(
        RunDetailsResponse response,
        string runId,
        IAgentExecutionTraceRepository traceRepository,
        ILlmCostEstimator costEstimator,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(response);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(traceRepository);
        ArgumentNullException.ThrowIfNull(costEstimator);

        IReadOnlyList<AgentExecutionTrace> traces =
            await traceRepository.GetByRunIdAsync(runId, cancellationToken);

        AgentExecutionTraceRunLlmCostSummary summary =
            AgentExecutionTraceRunLlmCostAggregator.Compute(traces, costEstimator);

        response.AgentExecutionLlmCostEstimate = new RunAgentLlmCostEstimateResponse
        {
            EstimatedCostUsd = summary.EstimatedCostUsd,
            TokenCounts = new RunLlmTokenCountsResponse
            {
                Prompt = summary.PromptTokens,
                Completion = summary.CompletionTokens,
            },
            Model = summary.ModelLabel,
            CostEstimationBasis = summary.CostEstimationBasis,
        };
    }
}
