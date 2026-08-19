using ArchLucid.Core.Configuration;

using Azure.Core;
using Azure.Identity;

using Microsoft.Extensions.Options;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Exchanges ArchLucid's user-assigned managed identity token for a customer SP token (cross-tenant WIF).
/// </summary>
public sealed class WorkloadIdentityHostedAzureExtractorCredentialFactory(
    IOptionsMonitor<HostedAzureExtractorOptions> optionsMonitor) : IHostedAzureExtractorCredentialFactory
{
    private readonly IOptionsMonitor<HostedAzureExtractorOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    public TokenCredential CreateCredential(string customerTenantId, string customerAppId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(customerTenantId);
        ArgumentException.ThrowIfNullOrWhiteSpace(customerAppId);

        HostedAzureExtractorOptions options = _optionsMonitor.CurrentValue;

        ManagedIdentityCredential managedIdentity = string.IsNullOrWhiteSpace(options.ArchLucidManagedIdentityClientId)
            ? new ManagedIdentityCredential()
            : new ManagedIdentityCredential(options.ArchLucidManagedIdentityClientId);

        string exchangeScope = string.IsNullOrWhiteSpace(options.FederatedTokenExchangeScope)
            ? "api://AzureADTokenExchange/.default"
            : options.FederatedTokenExchangeScope.Trim();

        return new ClientAssertionCredential(
            customerTenantId.Trim(),
            customerAppId.Trim(),
            async cancellationToken =>
            {
                AccessToken token = await managedIdentity
                    .GetTokenAsync(new TokenRequestContext([exchangeScope]), cancellationToken)
                    .ConfigureAwait(false);

                return token.Token;
            });
    }
}
