namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Per-tenant hosted Azure extractor pull configuration (Tier 2 — Workload Identity Federation).
/// </summary>
public sealed class TenantHostedExtractorConfigurationRecord
{
    public Guid TenantId { get; init; }

    public string CustomerTenantId { get; init; } = string.Empty;

    public string CustomerAppId { get; init; } = string.Empty;

    public string SubscriptionId { get; init; } = string.Empty;

    public bool IncludeCost { get; init; }

    public DateTimeOffset UpdatedUtc { get; init; }

    public string UpdatedByActorId { get; init; } = string.Empty;
}
