namespace ArchLucid.Contracts.Advisory.Delivery;

/// <summary>Outbound route for architecture digests: channel type, destination, and enablement for a scope.</summary>
public class DigestSubscription
{
    public Guid SubscriptionId
    {
        get;
        set;
    } = Guid.NewGuid();

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

    public string Name
    {
        get;
        set;
    } = "Digest Subscription";

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

    public bool IsEnabled
    {
        get;
        set;
    } = true;

    public DateTime CreatedUtc
    {
        get;
        set;
    } = TimeProvider.System.GetUtcNow().UtcDateTime;

    public DateTime? LastDeliveredUtc
    {
        get;
        set;
    }

    public string MetadataJson
    {
        get;
        set;
    } = "{}";
}
