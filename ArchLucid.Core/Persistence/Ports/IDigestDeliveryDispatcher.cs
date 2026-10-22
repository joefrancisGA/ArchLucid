using ArchLucid.Contracts.Advisory.Delivery;
using ArchLucid.Contracts.Advisory.Scheduling;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>Fans out a completed digest to all enabled subscriptions for its scope.</summary>
public interface IDigestDeliveryDispatcher
{
    Task DeliverAsync(ArchitectureDigest digest, CancellationToken ct);
}
