using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Findings;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Runs.Enrichment;

public sealed class RunDetailArchitectureResultsEnrichmentSlice(IRunDetailQueryService runDetailQueryService) : IRunDetailEnrichmentSlice
{
    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    public async Task EnrichAsync(RunDetailEnrichmentContext context, CancellationToken cancellationToken)
    {
        RunDetailDto detail = context.Detail;
        string runHex = detail.Run.RunId.ToString("N");

        ArchitectureRunDetail? architectureDetail =
            await _runDetailQueryService.GetRunDetailForOperatorEnrichAsync(runHex, cancellationToken)
                .ConfigureAwait(false);

        if (architectureDetail is null)
        {
            context.StopFurtherSlices = true;
            return;
        }

        context.ArchitectureDetail = architectureDetail;
        detail.Results = architectureDetail.Results;
        detail.AgentExecutionOutcomes = RequiredAgentExecutionOutcomes.Project(architectureDetail.Results);
    }
}

public sealed class RunDetailBuyerResultsEnrichmentSlice(IAgentResultRepository agentResultRepository) : IRunDetailEnrichmentSlice
{
    private readonly IAgentResultRepository _agentResultRepository =
        agentResultRepository ?? throw new ArgumentNullException(nameof(agentResultRepository));

    public async Task EnrichAsync(RunDetailEnrichmentContext context, CancellationToken cancellationToken)
    {
        RunDetailDto detail = context.Detail;
        string runHex = detail.Run.RunId.ToString("N");
        ScopeContext scope = ScopeContextRunChildExtensions.FromRunRecord(detail.Run);

        IReadOnlyList<AgentResult> agentTypeMarkers =
            await _agentResultRepository
                .GetAgentTypeMarkersByRunIdAsync(scope, runHex, cancellationToken)
                .ConfigureAwait(false);

        List<AgentResult> buyerResults = agentTypeMarkers.ToList();
        AgentResult? coverageFindingCarrier = TryBuildCoverageFindingCarrier(runHex, detail.FindingsSnapshot);

        if (coverageFindingCarrier is not null)
            buyerResults.Add(coverageFindingCarrier);

        detail.Results = buyerResults;
        detail.AgentExecutionOutcomes = RequiredAgentExecutionOutcomes.ProjectPresenceMarkers(agentTypeMarkers);
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
                ReasoningTrace = ResolveReasoningTraceForOperatorWire(f),
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

    private static string? ResolveReasoningTraceForOperatorWire(Finding finding)
    {
        return FindingCounterfactualNotes.ToPrefixedWireValue(finding.Trace?.Notes)
            ?? (string.IsNullOrWhiteSpace(finding.Rationale) ? null : finding.Rationale.Trim());
    }
}
