using ArchLucid.Core.IntegrationSecrets;
using ArchLucid.Core.Secrets;

using Azure.Identity;
using Azure.Security.KeyVault.Secrets;

using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Configuration.IntegrationSecrets;

public sealed class KeyVaultIntegrationSecretWriter : IIntegrationSecretWriter
{
    private readonly SecretClient _client;
    private readonly IMemoryCache _cache;

    public KeyVaultIntegrationSecretWriter(IOptions<ArchLucidSecretOptions> options, IMemoryCache cache)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(cache);

        ArchLucidSecretOptions o = options.Value;
        string? uri = o.KeyVaultUri?.Trim();

        if (string.IsNullOrWhiteSpace(uri))
            throw new InvalidOperationException("ArchLucid:Secrets:KeyVaultUri is required when Provider is KeyVault.");

        _client = new SecretClient(new Uri(uri, UriKind.Absolute), new DefaultAzureCredential());
        _cache = cache;
    }

    public async Task<bool> TryUpsertSecretAsync(string secretName, string secretValue, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(secretName);
        ArgumentException.ThrowIfNullOrWhiteSpace(secretValue);

        try
        {
            await _client.SetSecretAsync(secretName.Trim(), secretValue, cancellationToken).ConfigureAwait(false);
            _cache.Remove("kv:" + secretName.Trim());

            return true;
        }
        catch
        {
            return false;
        }
    }
}
