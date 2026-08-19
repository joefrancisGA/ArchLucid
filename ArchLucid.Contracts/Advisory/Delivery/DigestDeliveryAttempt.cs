namespace ArchLucid.Contracts.Advisory.Delivery;

/// <summary>Audit row for one digest delivery try to a specific subscription.</summary>
public class DigestDeliveryAttempt
{
    public Guid AttemptId
    {
        get;
        set;
    } = Guid.NewGuid();

    public Guid DigestId
    {
        get;
        set;
    }

    public Guid SubscriptionId
    {
        get;
        set;
    }

    public Guid TenantId
    {
        get;
        set;
    }

    public Guid WorkspaceId
    {
        get;
        set;
    }

    public Guid ProjectId
    {
        get;
        set;
    }

    public DateTime AttemptedUtc
    {
        get;
        set;
    } = TimeProvider.System.GetUtcNow().UtcDateTime;

    public string Status
    {
        get;
        set;
    } = DigestDeliveryStatus.Started;

    public string? ErrorMessage
    {
        get;
        set;
    }

    public string ChannelType
    {
        get;
        set;
    } = null!;

    public string Destination
    {
        get;
        set;
    } = null!;
}
