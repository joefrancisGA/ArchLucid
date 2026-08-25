using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Configuration;

using Azure.Core;
using Azure.Identity;

using Microsoft.Extensions.Options;

namespace ArchLucid.Integrations.GcpExtractor;

/// <summary>
///     Presents ArchLucid managed identity token to GCP Workload Identity Federation (PQ-CLOUD-01 option a).
/// </summary>
[ExcludeFromCodeCoverage]
public sealed class AzureManagedIdentityGcpSubjectTokenProvider(
    IOptionsMonitor<HostedGcpExtractorOptions> optionsMonitor) : IGcpSubjectTokenProvider
{
    private readonly IOptionsMonitor<HostedGcpExtractorOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    public async Task<string> GetSubjectTokenAsync(CancellationToken cancellationToken)
    {
        HostedGcpExtractorOptions options = _optionsMonitor.CurrentValue;

        ManagedIdentityCredential managedIdentity = string.IsNullOrWhiteSpace(options.ArchLucidManagedIdentityClientId)
            ? new ManagedIdentityCredential(ManagedIdentityId.SystemAssigned)
            : new ManagedIdentityCredential(ManagedIdentityId.FromUserAssignedClientId(options.ArchLucidManagedIdentityClientId));

        string scope = string.IsNullOrWhiteSpace(options.FederatedTokenExchangeScope)
            ? "api://AzureADTokenExchange/.default"
            : options.FederatedTokenExchangeScope.Trim();

        AccessToken token = await managedIdentity
            .GetTokenAsync(new TokenRequestContext([scope]), cancellationToken)
            .ConfigureAwait(false);

        return token.Token;
    }
}
