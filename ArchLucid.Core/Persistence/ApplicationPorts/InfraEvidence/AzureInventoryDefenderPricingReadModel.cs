namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventoryDefenderPricingReadModel
{
    public string SubscriptionId { get; init; } = string.Empty;

    public string PricingName { get; init; } = string.Empty;

    public string Tier { get; init; } = string.Empty;

    public string Extensions { get; init; } = string.Empty;

    public string? SourceEvidenceReference { get; init; }
}
