namespace ArchLucid.Api.Controllers.Authority;

public sealed class Tier2ConnectionConfigureBody
{
    public required string TenantId { get; init; }

    public required string ClientId { get; init; }

    public required string SubscriptionIds { get; init; }
}
