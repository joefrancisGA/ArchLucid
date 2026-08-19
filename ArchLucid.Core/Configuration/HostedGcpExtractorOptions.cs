namespace ArchLucid.Core.Configuration;

/// <summary>
///     Host-side settings for Tier 2 hosted GCP extractor (Azure MI token → Workload Identity Federation).
/// </summary>
public sealed class HostedGcpExtractorOptions
{
    public const string SectionName = "HostedGcpExtractor";

    /// <summary>When false, hosted run endpoints return 503 (Tier 2 opt-in gate).</summary>
    public bool Enabled { get; set; }

    /// <summary>ArchLucid user-assigned managed identity client id used as the OIDC federation source.</summary>
    public string? ArchLucidManagedIdentityClientId { get; set; }

    /// <summary>Azure AD token audience presented to GCP Workload Identity Federation (default Azure AD exchange).</summary>
    public string FederatedTokenExchangeScope { get; set; } = "api://AzureADTokenExchange/.default";
}
