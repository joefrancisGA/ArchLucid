namespace ArchLucid.Core.AzureExtractor;

public sealed record TenantCloudConnectionRecord
{
    public Guid ConnectionId { get; init; }

    public Guid TenantId { get; init; }

    public string TenantIdAzure { get; init; } = string.Empty;

    public string ClientId { get; init; } = string.Empty;

    public string SubscriptionIds { get; init; } = string.Empty;

    public DateTimeOffset UpdatedUtc { get; init; }

    public string UpdatedByActorId { get; init; } = string.Empty;
}
