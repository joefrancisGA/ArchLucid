using ArchLucid.Contracts.Advisory.Scheduling;

namespace ArchLucid.Contracts.Advisory.Delivery;

/// <summary>Input to digest delivery channels: digest body plus the subscription that matched the scope.</summary>
public class DigestDeliveryPayload
{
    public ArchitectureDigest Digest
    {
        get;
        set;
    } = null!;

    public DigestSubscription Subscription
    {
        get;
        set;
    } = null!;
}
