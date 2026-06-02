using ArchLucid.Application.Agents;
using ArchLucid.Application.Trust;
using ArchLucid.Core.Scoping;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Retrieval;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Persistence.Decisions;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Roi;

namespace ArchLucid.Application.Runs;

/// <inheritdoc cref="IAuthorityRunDetailOperatorEnricher" />
public sealed class AuthorityRunDetailOperatorEnricher(
    IRunDetailQueryService runDetailQueryService,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    ILlmCostEstimator llmCostEstimator,
    IRunTrustEvidenceCardBuilder trustEvidenceCardBuilder,
    IRetrievalGroundingTraceReader retrievalGroundingTraceReader,
    ITenantEstimatedUsdSavingsResolver tenantEstimatedUsdSavingsResolver,
    ITenantCostSettingsRepository tenantCostSettingsRepository,
    IDecisionNodeRepository decisionNodeRepository) : IAuthorityRunDetailOperatorEnricher
{
    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IAgentExecutionTraceRepository _agentExecutionTraceRepository =
        agentExecutionTraceRepository ?? throw new ArgumentNullException(nameof(agentExecutionTraceRepository));

    private readonly ILlmCostEstimator _llmCostEstimator =
        llmCostEstimator ?? throw new ArgumentNullException(nameof(llmCostEstimator));

    private readonly IRunTrustEvidenceCardBuilder _trustEvidenceCardBuilder =
        trustEvidenceCardBuilder ?? throw new ArgumentNullException(nameof(trustEvidenceCardBuilder));

    private readonly IRetrievalGroundingTraceReader _retrievalGroundingTraceReader =
        retrievalGroundingTraceReader ?? throw new ArgumentNullException(nameof(retrievalGroundingTraceReader));

    private readonly ITenantEstimatedUsdSavingsResolver _tenantEstimatedUsdSavingsResolver =
        tenantEstimatedUsdSavingsResolver ?? throw new ArgumentNullException(nameof(tenantEstimatedUsdSavingsResolver));

    private readonly ITenantCostSettingsRepository _tenantCostSettingsRepository =
        tenantCostSettingsRepository ?? throw new ArgumentNullException(nameof(tenantCostSettingsRepository));

    private readonly IDecisionNodeRepository _decisionNodeRepository =
        decisionNodeRepository ?? throw new ArgumentNullException(nameof(decisionNodeRepository));

    /// <inheritdoc />
    public async Task EnrichAsync(RunDetailDto detail, string? hostAgentExecutionMode, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(detail);

        string runHex = detail.Run.RunId.ToString("N");

        detail.LastAgentExecutionFailure =
            AgentExecutionFailureSummaryJson.TryDeserialize(detail.Run.LastFailureReason);

        await AppendLlmCostEstimateAsync(detail, runHex, cancellationToken).ConfigureAwait(false);

        detail.EstimatedUsdSavingsSummary = await RunDetailEstimatedUsdSavingsBuilder
            .TryBuildAsync(
                detail.Run,
                _tenantEstimatedUsdSavingsResolver,
                _tenantCostSettingsRepository,
                cancellationToken)
            .ConfigureAwait(false);

        ArchitectureRunDetail? architectureDetail =
            await _runDetailQueryService.GetRunDetailAsync(runHex, cancellationToken).ConfigureAwait(false);

        if (architectureDetail is null)
            return;

        detail.Results = architectureDetail.Results;

        await AppendRetrievalGroundingSummaryAsync(detail, cancellationToken).ConfigureAwait(false);
        await AppendDecisionExplainabilityAsync(detail, cancellationToken).ConfigureAwait(false);

        if (!architectureDetail.IsCommitted)
            return;

        detail.TrustEvidenceCard =
            await _trustEvidenceCardBuilder
                .BuildAsync(architectureDetail, hostAgentExecutionMode, cancellationToken)
                .ConfigureAwait(false);
    }

    private async Task AppendLlmCostEstimateAsync(
        RunDetailDto detail,
        string runHex,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = ScopeContextRunChildExtensions.FromRunRecord(detail.Run);
        IReadOnlyList<AgentExecutionTrace> traces =
            await _agentExecutionTraceRepository.GetByRunIdAsync(scope, runHex, cancellationToken).ConfigureAwait(false);

        AgentExecutionTraceRunLlmCostSummary summary =
            AgentExecutionTraceRunLlmCostAggregator.Compute(traces, _llmCostEstimator);

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

    private async Task AppendRetrievalGroundingSummaryAsync(
        RunDetailDto detail,
        CancellationToken cancellationToken)
    {
        RunRecord run = detail.Run;

        IReadOnlyList<RetrievalGroundingTraceRecord> traces =
            await _retrievalGroundingTraceReader
                .GetByRunIdAsync(
                    run.TenantId,
                    run.WorkspaceId,
                    run.ScopeProjectId,
                    run.RunId,
                    cancellationToken)
                .ConfigureAwait(false);

        detail.RetrievalGroundingSummary = RunRetrievalGroundingSummaryBuilder.Build(traces, detail.Results);
    }

    private async Task AppendDecisionExplainabilityAsync(RunDetailDto detail, CancellationToken cancellationToken)
    {
        string runHex = detail.Run.RunId.ToString("N");

        IReadOnlyList<DecisionNodeRecord> coordinatorNodes =
            await _decisionNodeRepository.GetByRunIdAsync(runHex, cancellationToken).ConfigureAwait(false);

        RunDecisionExplainabilityDto built = RunDecisionExplainabilityBuilder.Build(detail, coordinatorNodes);

        if (built.AuthorityRuleAudit is null
            && built.ManifestDecisions.Count == 0
            && built.CoordinatorDecisionNodes.Count == 0
            && built.FindingEngineFailures.Count == 0
            && built.ManifestHonestyWarnings.Count == 0)
        {
            return;
        }

        detail.DecisionExplainability = built;
    }
}
