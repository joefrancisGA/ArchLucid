namespace ArchLucid.Core.Configuration;

/// <summary>
///     Host-side settings for Tier 2 hosted Azure extractor (ArchLucid managed identity → customer SP via WIF).
/// </summary>
public sealed class HostedAzureExtractorOptions
{
    public const string SectionName = "HostedAzureExtractor";

    /// <summary>When false, hosted run endpoints return 503 (Tier 2 opt-in gate).</summary>
    public bool Enabled { get; set; }

    /// <summary>ArchLucid user-assigned managed identity client id used as the federation source.</summary>
    public string? ArchLucidManagedIdentityClientId { get; set; }

    /// <summary>Token exchange scope for cross-tenant federated credential assertion (default Azure AD exchange).</summary>
    public string FederatedTokenExchangeScope { get; set; } = "api://AzureADTokenExchange/.default";
}
