using Azure.Core;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Builds a <see cref="TokenCredential" /> for the customer-provisioned service principal via WIF.
/// </summary>
public interface IHostedAzureExtractorCredentialFactory
{
    TokenCredential CreateCredential(string customerTenantId, string customerAppId);
}
