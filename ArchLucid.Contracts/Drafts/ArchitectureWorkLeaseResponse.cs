namespace ArchLucid.Contracts.Drafts;

/// <summary>Active or caller-held work lease on an architecture draft (ADR 0090).</summary>
public sealed class ArchitectureWorkLeaseResponse
{
    public Guid DraftId
    {
        get;
        set;
    }

    public Guid ArchitectureId
    {
        get;
        set;
    }

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

    public DateTimeOffset AcquiredUtc
    {
        get;
        set;
    }

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
