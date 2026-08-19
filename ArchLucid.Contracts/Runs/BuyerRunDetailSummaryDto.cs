using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Trust;

namespace ArchLucid.Contracts.Runs;

/// <summary>
///     Whitelisted proof surface for buyer-polished run detail — no embedded persistence snapshots (TB-283).
/// </summary>
public sealed class BuyerRunDetailSummaryDto
{
    public BuyerRunDetailRunDto Run
    {
        get;
        set;
    } = null!;

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

    public IReadOnlyList<string> DegradedExecutionAgents
    {
        get;
        set;
    } = [];

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
    public IReadOnlyList<BuyerFindingSummaryDto> FindingSummaries
    {
        get;
        set;
    } = [];

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
    public IReadOnlyList<AgentExecutionOutcome> AgentExecutionOutcomes
    {
        get;
        set;
    } = [];

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
