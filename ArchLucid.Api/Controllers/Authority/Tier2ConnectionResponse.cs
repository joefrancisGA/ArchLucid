namespace ArchLucid.Api.Controllers.Authority;

public sealed class Tier2ConnectionResponse
{
    public Guid ConnectionId { get; init; }

    public required string TenantId { get; init; }

    public required string ClientId { get; init; }

    public required string SubscriptionIds { get; init; }

    public DateTimeOffset UpdatedUtc { get; init; }
}
