using ArchLucid.Application.Agents;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Runs.Enrichment;

public sealed class RunDetailLlmCostEnrichmentSlice(
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    ILlmCostEstimator llmCostEstimator) : IRunDetailEnrichmentSlice
{
    private readonly IAgentExecutionTraceRepository _agentExecutionTraceRepository =
        agentExecutionTraceRepository ?? throw new ArgumentNullException(nameof(agentExecutionTraceRepository));

    private readonly ILlmCostEstimator _llmCostEstimator =
        llmCostEstimator ?? throw new ArgumentNullException(nameof(llmCostEstimator));

    public async Task EnrichAsync(RunDetailEnrichmentContext context, CancellationToken cancellationToken)
    {
        RunDetailDto detail = context.Detail;
        string runHex = detail.Run.RunId.ToString("N");
        ScopeContext scope = ScopeContextRunChildExtensions.FromRunRecord(detail.Run);

        IReadOnlyList<AgentExecutionTraceLlmCostSlice> slices =
            await _agentExecutionTraceRepository
                .GetLlmCostSlicesByRunIdAsync(scope, runHex, cancellationToken)
                .ConfigureAwait(false);

        AgentExecutionTraceRunLlmCostSummary summary =
            AgentExecutionTraceRunLlmCostAggregator.Compute(slices, _llmCostEstimator);

        detail.AgentExecutionLlmCostEstimate = new RunAgentLlmCostEstimateDto
        {
            EstimatedCostUsd = summary.EstimatedCostUsd,
            Model = summary.ModelLabel,
            CostEstimationBasis = summary.CostEstimationBasis,
            TokenCounts = new RunLlmTokenCountsDto
            {
                Prompt = summary.PromptTokens,
                Completion = summary.CompletionTokens,
            },
        };
    }
}
