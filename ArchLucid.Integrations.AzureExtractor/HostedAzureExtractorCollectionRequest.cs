namespace ArchLucid.Integrations.AzureExtractor;

public sealed class HostedAzureExtractorCollectionRequest
{
    public required string CustomerTenantId { get; init; }

    public required string CustomerAppId { get; init; }

    public required string SubscriptionId { get; init; }

    public bool IncludeCost { get; init; }
}
