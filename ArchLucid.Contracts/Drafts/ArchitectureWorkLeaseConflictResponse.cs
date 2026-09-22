namespace ArchLucid.Contracts.Drafts;

/// <summary>Another architect holds an unexpired work lease on this draft.</summary>
public sealed class ArchitectureWorkLeaseConflictResponse
{
    public Guid DraftId
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

    public DateTimeOffset ExpiresUtc
    {
        get;
        set;
    }
}
