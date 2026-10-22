namespace ArchLucid.Contracts.Governance;

/// <summary>Creates a time-bounded risk exception (TB-059).</summary>
public sealed class CreateRiskExceptionRequest
{
    public required string FindingId
    {
        get;
        init;
    }

    public Guid? RunId
    {
        get;
        init;
    }

    public Guid? ManifestId
    {
        get;
        init;
    }

    public required string OwnerUserId
    {
        get;
        init;
    }

    public required string Rationale
    {
        get;
        init;
    }

    public string? EvidenceRef
    {
        get;
        init;
    }

    public required DateTimeOffset ExpiresAtUtc
    {
        get;
        init;
    }
}
