using System.Globalization;

using Azure;
using Azure.Identity;
using Azure.Security.KeyVault.Secrets;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Api.Health;

/// <summary>
///     Verifies that the application can successfully authenticate and reach the configured Azure Key Vault.
/// </summary>
public sealed class KeyVaultConnectivityHealthCheck(
    IConfiguration configuration,
    ILogger<KeyVaultConnectivityHealthCheck> logger) : IHealthCheck
{
    private static readonly TimeSpan ProbeTimeout = TimeSpan.FromSeconds(15);
    private readonly IConfiguration _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
    private readonly ILogger<KeyVaultConnectivityHealthCheck> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        string? uriRaw = _configuration["ArchLucid:Secrets:KeyVaultUri"]?.Trim();

        if (string.IsNullOrWhiteSpace(uriRaw))
        {
            return HealthCheckResult.Healthy(
                "Key Vault probe skipped — ArchLucid:Secrets:KeyVaultUri is not set.");
        }

        if (!Uri.TryCreate(uriRaw, UriKind.Absolute, out Uri? vaultUri)
            || !string.Equals(vaultUri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
        {
            return HealthCheckResult.Unhealthy(
                string.Format(CultureInfo.InvariantCulture, "Key Vault URI '{0}' must be an absolute https URI.", uriRaw));
        }

        using CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        linked.CancelAfter(ProbeTimeout);

        try
        {
            SecretClient client = new(vaultUri, new DefaultAzureCredential());
            int count = 0;

            await foreach (SecretProperties _ in client.GetPropertiesOfSecretsAsync(linked.Token).ConfigureAwait(false))
            {
                count++;
                if (count >= 1)
                    break;
            }

            return HealthCheckResult.Healthy(
                string.Format(CultureInfo.InvariantCulture, "Key Vault '{0}' reachable.", vaultUri.Host));
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogError("Key Vault '{KeyVault}' probe timed out after {Timeout}s.", vaultUri.Host, ProbeTimeout.TotalSeconds);
            return HealthCheckResult.Unhealthy(
                string.Format(CultureInfo.InvariantCulture, "Key Vault '{0}' probe timed out after {1:0.#}s.", vaultUri.Host, ProbeTimeout.TotalSeconds));
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (RequestFailedException ex) when (ex.Status == 403 || ex.Status == 401)
        {
            _logger.LogError(ex, "Key Vault '{KeyVault}' authentication or permission denied.", vaultUri.Host);
            return HealthCheckResult.Unhealthy(
                string.Format(CultureInfo.InvariantCulture, "Key Vault '{0}' authentication failed or permission denied.", vaultUri.Host),
                ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Key Vault '{KeyVault}' probe failed.", vaultUri.Host);
            return HealthCheckResult.Unhealthy(
                string.Format(CultureInfo.InvariantCulture, "Key Vault '{0}' probe failed.", vaultUri.Host),
                ex);
        }
    }
}
