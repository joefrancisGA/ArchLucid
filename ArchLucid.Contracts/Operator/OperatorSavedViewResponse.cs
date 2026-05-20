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
}
