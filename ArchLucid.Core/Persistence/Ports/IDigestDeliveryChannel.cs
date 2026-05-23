using ArchLucid.Contracts.Advisory.Delivery;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>Sends one architecture digest to a subscription destination.</summary>
public interface IDigestDeliveryChannel
{
    string ChannelType
    {
        get;
    }

    Task SendAsync(
        DigestDeliveryPayload payload,
        CancellationToken ct);
}
