namespace ArchLucid.Contracts.Operator;

/// <summary>One persisted operator saved view for the current tenant and user.</summary>
public sealed class OperatorSavedViewResponse
{
    public Guid Id
    {
        get;
        set;
    }

    public string Surface
    {
        get;
        set;
    } = string.Empty;

    public string Name
    {
        get;
        set;
    } = string.Empty;

    public OperatorSavedViewPayload Payload
    {
        get;
        set;
    } = new();

    public DateTimeOffset CreatedUtc
    {
        get;
        set;
    }

    public DateTimeOffset UpdatedUtc
    {
        get;
        set;
    }

    /// <summary>When true, other tenant users can load this preset from the shared views list.</summary>
    public bool IsShared
    {
        get;
        set;
    }

    /// <summary>True when the saved view was created by the requesting user (delete allowed).</summary>
    public bool IsOwnedByCurrentUser
    {
        get;
        set;
    }
}
