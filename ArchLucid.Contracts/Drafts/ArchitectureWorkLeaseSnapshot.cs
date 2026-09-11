namespace ArchLucid.Contracts.Drafts;

/// <summary>Active work lease on a draft returned with GET draft (ADR 0090 / LW-091).</summary>
public sealed class ArchitectureWorkLeaseSnapshot
{
    public Guid HolderUserId
    {
        get;
        set;
    }

    public string HolderActorOid
    {
        get;
        set;
    } = string.Empty;

    public DateTimeOffset ExpiresUtc
    {
        get;
        set;
    }

    public bool HeldByCaller
    {
        get;
        set;
    }
}
