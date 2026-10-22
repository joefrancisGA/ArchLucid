using System.Diagnostics.CodeAnalysis;
using System.Net;

using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Connections;

using Azure.Identity;
using Azure.Security.KeyVault.Secrets;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Host.Core.Diagnostics;

/// <summary>
///     Lightweight connectivity probes for pilot setup — Admin-only HTTP surface.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "Live IO; exercised via API integration tests.")]
public sealed class ConfigurationHealthProbe(
    IConfiguration configuration,
    ISqlConnectionFactory? sqlConnectionFactory,
    IHttpClientFactory httpClientFactory) : IConfigurationHealthProbe
{
    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly IHttpClientFactory _httpClientFactory =
        httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));

    public async Task<ConfigurationHealthReport> ProbeAsync(CancellationToken cancellationToken = default)
    {
        List<ConfigurationHealthCheckResult> rows =
        [
            await ProbeSqlAsync(cancellationToken).ConfigureAwait(false),
            await ProbeOidcAuthorityAsync(cancellationToken).ConfigureAwait(false),
            await ProbeKeyVaultListAsync(cancellationToken).ConfigureAwait(false)
        ];

        return new ConfigurationHealthReport { Checks = rows };
    }

    private async Task<ConfigurationHealthCheckResult> ProbeSqlAsync(CancellationToken cancellationToken)
    {
        if (sqlConnectionFactory is null)
            return new ConfigurationHealthCheckResult
            {
                Name = "sql_server",
                Status = "skipped",
                Detail =
                    "SQL storage provider is not active (InMemory or connection factory not registered); skipped."
            };

        try
        {
            await using SqlConnection connection =
                await sqlConnectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

            await using SqlCommand cmd = new("SELECT 1;", connection);
            _ = await cmd.ExecuteScalarAsync(cancellationToken).ConfigureAwait(false);

            bool viewServerState;

            try
            {
                await using SqlCommand perm =
                    new(
                        "SELECT CAST(CASE WHEN HAS_PERMS_BY_NAME(NULL, NULL, 'VIEW SERVER STATE') = 1 THEN 1 ELSE 0 END AS bit);",
                        connection);
                object? scalar = await perm.ExecuteScalarAsync(cancellationToken).ConfigureAwait(false);
                viewServerState = scalar is true or 1;
            }
            catch (SqlException)
            {
                viewServerState = false;
            }

            return new ConfigurationHealthCheckResult
            {
                Name = "sql_server",
                Status = "ok",
                Detail = viewServerState
                    ? "Connected; principal has VIEW SERVER STATE (server diagnostics available)."
                    : "Connected; VIEW SERVER STATE not granted (optional for runtime — limited server diagnostics)."
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return new ConfigurationHealthCheckResult
            {
                Name = "sql_server",
                Status = "failed",
                Detail = $"{ex.GetType().Name}: {ex.Message}"
            };
        }
    }

    private async Task<ConfigurationHealthCheckResult> ProbeOidcAuthorityAsync(CancellationToken cancellationToken)
    {
        HttpClient client = _httpClientFactory.CreateClient(nameof(ConfigurationHealthProbe));
        OidcAuthorityMetadataProbe.ProbeResult result =
            await OidcAuthorityMetadataProbe.ProbeAsync(_configuration, client, cancellationToken).ConfigureAwait(false);

        if (!result.IsApplicable)
        {
            return new ConfigurationHealthCheckResult
            {
                Name = "oidc_authority",
                Status = "skipped",
                Detail = result.Detail,
            };
        }

        return new ConfigurationHealthCheckResult
        {
            Name = "oidc_authority",
            Status = result.Succeeded ? "ok" : "failed",
            Detail = result.Detail,
        };
    }

    private async Task<ConfigurationHealthCheckResult> ProbeKeyVaultListAsync(CancellationToken cancellationToken)
    {
        string provider = (_configuration["ArchLucid:Secrets:Provider"] ?? string.Empty).Trim();

        string? vaultUriRaw = _configuration["ArchLucid:Secrets:KeyVaultUri"];

        if (!string.Equals(provider, "KeyVault", StringComparison.OrdinalIgnoreCase)
            || string.IsNullOrWhiteSpace(vaultUriRaw))
        {
            return new ConfigurationHealthCheckResult
            {
                Name = "azure_key_vault",
                Status = "skipped",
                Detail =
                    "Key Vault secret provider not configured (ArchLucid:Secrets:Provider != KeyVault or KeyVaultUri empty)."
            };
        }

        if (!Uri.TryCreate(vaultUriRaw.Trim(), UriKind.Absolute, out Uri? vaultUri))
            return new ConfigurationHealthCheckResult
            {
                Name = "azure_key_vault",
                Status = "failed",
                Detail = "ArchLucid:Secrets:KeyVaultUri is not a valid absolute URI."
            };

        try
        {
            SecretClient client = new(vaultUri, new DefaultAzureCredential());
            int count = 0;

            await foreach (SecretProperties _ in client.GetPropertiesOfSecretsAsync(cancellationToken)
                               .ConfigureAwait(false))
            {
                count++;

                if (count >= 1)

                    break;
            }

            return new ConfigurationHealthCheckResult
            {
                Name = "azure_key_vault",
                Status = "ok",
                Detail =
                    $"List secrets succeeded against vault host '{vaultUri.Host}' (probe read first page only; names not returned)."
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return new ConfigurationHealthCheckResult
            {
                Name = "azure_key_vault",
                Status = "failed",
                Detail = $"{ex.GetType().Name}: {ex.Message}"
            };
        }
    }
}
