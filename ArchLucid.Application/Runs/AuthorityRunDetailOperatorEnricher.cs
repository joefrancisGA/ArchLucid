using ArchLucid.Application.Agents;
using ArchLucid.Application.Runs.Mapping;
using ArchLucid.Application.Trust;
using ArchLucid.Core.Scoping;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Retrieval;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Persistence.Decisions;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Roi;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Application.Runs;

/// <inheritdoc cref="IAuthorityRunDetailOperatorEnricher" />
public sealed class AuthorityRunDetailOperatorEnricher(
    IRunDetailQueryService runDetailQueryService,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    IAgentResultRepository agentResultRepository,
    ILlmCostEstimator llmCostEstimator,
    IRunTrustEvidenceCardBuilder trustEvidenceCardBuilder,
    IRetrievalGroundingTraceReader retrievalGroundingTraceReader,
    ITenantEstimatedUsdSavingsResolver tenantEstimatedUsdSavingsResolver,
    ITenantCostSettingsRepository tenantCostSettingsRepository,
    IDecisionNodeRepository decisionNodeRepository,
    IConfiguration configuration) : IAuthorityRunDetailOperatorEnricher
{
    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IAgentExecutionTraceRepository _agentExecutionTraceRepository =
        agentExecutionTraceRepository ?? throw new ArgumentNullException(nameof(agentExecutionTraceRepository));

    private readonly IAgentResultRepository _agentResultRepository =
        agentResultRepository ?? throw new ArgumentNullException(nameof(agentResultRepository));

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

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    /// <inheritdoc />
    public async Task EnrichAsync(RunDetailDto detail, string? hostAgentExecutionMode, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(detail);

        detail.EngineProvenance = ReviewRunEngineProvenanceJson.TryDeserialize(detail.Run.EngineProvenanceJson);

        string runHex = detail.Run.RunId.ToString("N");

        detail.LastAgentExecutionFailure =
            AgentExecutionFailureSummaryJson.TryDeserialize(detail.Run.LastFailureReason);

        detail.Run.IsDeadLettered = RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(detail.Run);

        await AppendLlmCostEstimateAsync(detail, runHex, cancellationToken).ConfigureAwait(false);

        detail.EstimatedUsdSavingsSummary = await RunDetailEstimatedUsdSavingsBuilder
            .TryBuildAsync(
                detail.Run,
                _tenantEstimatedUsdSavingsResolver,
                _tenantCostSettingsRepository,
                cancellationToken)
            .ConfigureAwait(false);

        ArchitectureRunDetail? architectureDetail =
            await _runDetailQueryService.GetRunDetailForOperatorEnrichAsync(runHex, cancellationToken).ConfigureAwait(false);

        if (architectureDetail is null)
            return;

        detail.Results = architectureDetail.Results;
        detail.AgentExecutionOutcomes = RequiredAgentExecutionOutcomes.Project(architectureDetail.Results);

        await AppendRetrievalGroundingSummaryAsync(detail, cancellationToken).ConfigureAwait(false);
        await AppendDecisionExplainabilityAsync(detail, cancellationToken).ConfigureAwait(false);

        if (!architectureDetail.IsCommitted)
            return;

        detail.TrustEvidenceCard =
            await _trustEvidenceCardBuilder
                .BuildAsync(architectureDetail, hostAgentExecutionMode, cancellationToken)
                .ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task EnrichBuyerSummaryAsync(
        RunDetailDto detail,
        string? hostAgentExecutionMode,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(detail);

        detail.EngineProvenance = ReviewRunEngineProvenanceJson.TryDeserialize(detail.Run.EngineProvenanceJson);

        string runHex = detail.Run.RunId.ToString("N");

        detail.LastAgentExecutionFailure =
            AgentExecutionFailureSummaryJson.TryDeserialize(detail.Run.LastFailureReason);

        detail.Run.IsDeadLettered = RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(detail.Run);

        try
        {
            await AppendLlmCostEstimateAsync(detail, runHex, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception)
        {
            // Buyer SSR must not 500 on optional cost enrichment faults.
        }

        try
        {
            detail.EstimatedUsdSavingsSummary = await RunDetailEstimatedUsdSavingsBuilder
                .TryBuildAsync(
                    detail.Run,
                    _tenantEstimatedUsdSavingsResolver,
                    _tenantCostSettingsRepository,
                    cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception)
        {
            detail.EstimatedUsdSavingsSummary = null;
        }

        ScopeContext scope = ScopeContextRunChildExtensions.FromRunRecord(detail.Run);
        IReadOnlyList<AgentResult> agentTypeMarkers;

        try
        {
            agentTypeMarkers =
                await _agentResultRepository
                    .GetAgentTypeMarkersByRunIdAsync(scope, runHex, cancellationToken)
                    .ConfigureAwait(false);
        }
        catch (Exception)
        {
            // Buyer SSR must not 500 when marker rows fail to map; coverage carrier can still attach.
            agentTypeMarkers = [];
        }

        // Markers preserve RAG grounding HOLD without loading ResultJson; coverage findings feed TopFinding.
        List<AgentResult> buyerResults = agentTypeMarkers.ToList();
        AgentResult? coverageFindingCarrier = TryBuildCoverageFindingCarrier(runHex, detail.FindingsSnapshot);

        if (coverageFindingCarrier is not null)
            buyerResults.Add(coverageFindingCarrier);

        detail.Results = buyerResults;
        // Markers omit ResultJson; presence vs Missing is enough for buyer finalize honesty (TB-937 / TB-930).
        detail.AgentExecutionOutcomes = RequiredAgentExecutionOutcomes.ProjectPresenceMarkers(agentTypeMarkers);

        try
        {
            await AppendRetrievalGroundingSummaryAsync(detail, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception)
        {
            // Optional grounding summary — omit on fault.
        }

        try
        {
            await AppendDecisionExplainabilityAsync(detail, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception)
        {
            // Optional explainability — omit on fault.
        }

        if (!detail.Run.GoldenManifestId.HasValue || detail.Run.GoldenManifestId.Value == Guid.Empty)
            return;

        try
        {
            ArchitectureRunDetail architectureDetail = new()
            {
                Run = RunRecordToArchitectureRunMapper.ToArchitectureRun(detail.Run, []),
                Results = buyerResults,
                Manifest = BuildTrustManifestFromAuthorityDocument(runHex, detail.Run.ProjectId, detail.GoldenManifest),
            };

            detail.TrustEvidenceCard =
                await _trustEvidenceCardBuilder
                    .BuildAsync(architectureDetail, hostAgentExecutionMode, cancellationToken)
                    .ConfigureAwait(false);
        }
        catch (Exception)
        {
            // Buyer SSR must not 500 when trust-card enrichment or status mapping faults; omit the card.
            detail.TrustEvidenceCard = null;
        }

        // Buyer DTO omits Results; clear so accidental mappers cannot leak marker rows.
        detail.Results = [];
    }

    private static AgentResult? TryBuildCoverageFindingCarrier(string runHex, FindingsSnapshot? snapshot)
    {
        if (snapshot?.Findings is null || snapshot.Findings.Count == 0)
            return null;

        List<ArchitectureFinding> findings = snapshot.Findings
            .Where(static f => !string.IsNullOrWhiteSpace(f.FindingId))
            .Select(static f => new ArchitectureFinding
            {
                FindingId = f.FindingId.Trim(),
                Message = string.IsNullOrWhiteSpace(f.Title) ? f.FindingId : f.Title.Trim(),
                Category = string.IsNullOrWhiteSpace(f.Category) ? string.Empty : f.Category.Trim(),
                Severity = f.Severity,
                PolicyRuleId = string.IsNullOrWhiteSpace(f.PolicyRuleId) ? null : f.PolicyRuleId.Trim(),
            })
            .ToList();

        if (findings.Count == 0)
            return null;

        return new AgentResult
        {
            ResultId = $"buyer-summary-findings-{runHex}",
            TaskId = "buyer-summary-findings",
            RunId = runHex,
            AgentType = AgentType.Compliance,
            Findings = findings,
        };
    }

    private static GoldenManifest BuildTrustManifestFromAuthorityDocument(
        string runHex,
        string? projectId,
        ManifestDocument? authorityManifest)
    {
        GoldenManifest manifest = new()
        {
            RunId = runHex,
            SystemName = projectId ?? string.Empty,
        };

        if (authorityManifest is null)
            return manifest;

        manifest.Metadata = new ManifestMetadata
        {
            ManifestVersion = string.IsNullOrWhiteSpace(authorityManifest.RuleSetVersion)
                ? authorityManifest.ManifestId.ToString("D")
                : authorityManifest.RuleSetVersion.Trim(),
            CreatedUtc = authorityManifest.CreatedUtc,
            ChangeDescription = string.Empty,
        };

        return manifest;
    }

    private async Task AppendLlmCostEstimateAsync(
        RunDetailDto detail,
        string runHex,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = ScopeContextRunChildExtensions.FromRunRecord(detail.Run);
        IReadOnlyList<AgentExecutionTraceLlmCostSlice> slices =
            await _agentExecutionTraceRepository.GetLlmCostSlicesByRunIdAsync(scope, runHex, cancellationToken).ConfigureAwait(false);

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

        detail.RetrievalGroundingSummary = RunRetrievalGroundingSummaryBuilder.Build(
            traces,
            detail.Results,
            GraphRagQualityPosture.ResolveForGroundedRun(
                _configuration,
                traces.Sum(static trace => trace.GraphRagNeighborsAdded ?? 0),
                traces.Sum(static trace => trace.GraphRagSeedHits ?? 0)));
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
