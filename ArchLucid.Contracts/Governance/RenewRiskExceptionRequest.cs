namespace ArchLucid.Contracts.Governance;

/// <summary>Renews an active risk exception with a new expiration (TB-059).</summary>
public sealed class RenewRiskExceptionRequest
{
    public required DateTimeOffset ExpiresAtUtc
    {
        get;
        init;
    }

    public string? Rationale
    {
        get;
        init;
    }

    public string? EvidenceRef
    {
        get;
        init;
    }
}
