namespace ArchLucid.Core.Configuration;

/// <summary>
///     Host-side settings for Tier 2 hosted AWS extractor (Azure MI OIDC token → customer IAM role via web identity).
/// </summary>
public sealed class HostedAwsExtractorOptions
{
    public const string SectionName = "HostedAwsExtractor";

    /// <summary>When false, hosted run endpoints return 503 (Tier 2 opt-in gate).</summary>
    public bool Enabled { get; set; }

    /// <summary>Whole hosted collection deadline in seconds, excluding ingest. Defaults to 30 minutes.</summary>
    public int CollectionTimeoutSeconds { get; set; } = HostedExtractorCollectionTimeout.DefaultSeconds;

    public TimeSpan GetEffectiveCollectionTimeout() =>
        HostedExtractorCollectionTimeout.Resolve(CollectionTimeoutSeconds);

    /// <summary>ArchLucid user-assigned managed identity client id used as the OIDC federation source.</summary>
    public string? ArchLucidManagedIdentityClientId { get; set; }

    /// <summary>Azure AD token audience presented to AWS IAM OIDC trust (default Azure AD exchange).</summary>
    public string FederatedTokenExchangeScope { get; set; } = "api://AzureADTokenExchange/.default";
}
