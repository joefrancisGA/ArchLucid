namespace ArchLucid.Contracts.Governance;

/// <summary>POST body for <c>/v1/authority/runs/{runId}/disposition</c> (TB-112).</summary>
public sealed class RecordRunOperatorGovernanceDispositionRequest
{
    public RunOperatorGovernanceDecision Decision
    {
        get;
        init;
    }

    public string? Rationale
    {
        get;
        init;
    }
}
