namespace ArchLucid.Core.Configuration;

/// <summary>Approved model pricing row for anonymous Quick Scan pre-execution cost reservation (TB-893).</summary>
public sealed class QuickScanModelPricingCatalogEntry
{
    public string ModelId { get; set; } = string.Empty;

    public string Provider { get; set; } = string.Empty;

    public string ProviderModelId { get; set; } = string.Empty;

    public decimal InputUsdPerMillionTokens { get; set; }

    public decimal OutputUsdPerMillionTokens { get; set; }

    public decimal CachedInputUsdPerMillionTokens { get; set; }

    public DateTimeOffset EffectiveFromUtc { get; set; } = DateTimeOffset.UnixEpoch;

    public string Currency { get; set; } = "USD";

    public bool IsActive { get; set; } = true;

    public bool ApprovedForAnonymousQuickScan { get; set; }

    public int MaxContextTokens { get; set; } = 128_000;

    public int MaxOutputTokens { get; set; } = 4_096;

    public string SourceMetadata { get; set; } = string.Empty;

    public DateTimeOffset LastVerifiedUtc { get; set; } = DateTimeOffset.UnixEpoch;

    /// <summary>Optional deployment label passed to <see cref="ILlmCostEstimator" /> when rates match global catalog.</summary>
    public string? LlmCostEstimatorDeploymentLabel { get; set; }
}
