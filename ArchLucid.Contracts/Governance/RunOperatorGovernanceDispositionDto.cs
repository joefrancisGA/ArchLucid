namespace ArchLucid.Contracts.Governance;

/// <summary>Recorded run-level governance disposition returned to operators (TB-112).</summary>
public sealed class RunOperatorGovernanceDispositionDto
{
    public Guid RunId
    {
        get;
        init;
    }

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

    public DateTimeOffset OccurredAtUtc
    {
        get;
        init;
    }

    public string RecordedByUserId
    {
        get;
        init;
    } = string.Empty;
}
