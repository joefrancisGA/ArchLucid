using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Serialization;
using ArchLucid.Contracts.Trust;

namespace ArchLucid.Contracts.Runs;

/// <summary>
///     Whitelisted proof surface for buyer-polished run detail — no embedded persistence snapshots (TB-283).
/// </summary>
public sealed class BuyerRunDetailSummaryDto
{
    private BuyerRunDetailRunDto run = new();

    public BuyerRunDetailRunDto Run
    {
        get => run;
        set => run = value ?? new();
    }

    public string? ExecutionFlavorBuyerSummary
    {
        get;
        set;
    }

    public bool RunDegradedExecution
    {
        get;
        set;
    }

    private IReadOnlyList<string> degradedExecutionAgents = [];

    public IReadOnlyList<string> DegradedExecutionAgents
    {
        get => degradedExecutionAgents;
        set => degradedExecutionAgents = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    public bool DegradedFindingCoverage
    {
        get;
        set;
    }

    public RunFindingCoverageSummary? FindingCoverageSummary
    {
        get;
        set;
    }

    /// <summary>Finding id/severity/title rows for first paint without <c>PayloadJson</c> (TB-930).</summary>
    private IReadOnlyList<BuyerFindingSummaryDto> findingSummaries = [];

    public IReadOnlyList<BuyerFindingSummaryDto> FindingSummaries
    {
        get => findingSummaries;
        set => findingSummaries = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    public RunAgentLlmCostEstimateDto? AgentExecutionLlmCostEstimate
    {
        get;
        set;
    }

    public RunTrustEvidenceCard? TrustEvidenceCard
    {
        get;
        set;
    }

    public RunRetrievalGroundingSummaryDto? RetrievalGroundingSummary
    {
        get;
        set;
    }

    public AgentExecutionFailureSummary? LastAgentExecutionFailure
    {
        get;
        set;
    }

    /// <summary>Required-agent outcome matrix for partial-run honesty on buyer summary (TB-937).</summary>
    private IReadOnlyList<AgentExecutionOutcome> agentExecutionOutcomes = [];

    public IReadOnlyList<AgentExecutionOutcome> AgentExecutionOutcomes
    {
        get => agentExecutionOutcomes;
        set => agentExecutionOutcomes = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    public RunEstimatedUsdSavingsDto? EstimatedUsdSavingsSummary
    {
        get;
        set;
    }

    public RunDecisionExplainabilityDto? DecisionExplainability
    {
        get;
        set;
    }
}
