using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Commands;

internal static class AuthSsoPreflightOidcProbe
{
    internal sealed record ProbeResult(bool IsApplicable, bool Succeeded, string Detail);

    internal static async Task<ProbeResult> ProbeAsync(
        IConfiguration configuration,
        HttpClient httpClient,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(httpClient);

        string mode = AuthSsoPreflightConfigurationReader.ResolveAuthValue(configuration, "Mode") ?? string.Empty;

        if (!string.Equals(mode, "JwtBearer", StringComparison.OrdinalIgnoreCase))
        {
            return new ProbeResult(
                IsApplicable: false,
                Succeeded: true,
                Detail: $"Auth mode is '{mode}' — OIDC metadata probe not applicable.");
        }

        string? authority = AuthSsoPreflightConfigurationReader.ResolveAuthValue(configuration, "Authority");

        if (string.IsNullOrWhiteSpace(authority))
        {
            return new ProbeResult(
                IsApplicable: true,
                Succeeded: false,
                Detail: "JwtBearer mode but ArchLucidAuth:Authority is empty.");
        }

        string metadataUrl = $"{authority.TrimEnd('/')}/.well-known/openid-configuration";

        try
        {
            using HttpResponseMessage response = await httpClient
                .GetAsync(metadataUrl, cancellationToken)
                .ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                return new ProbeResult(
                    IsApplicable: true,
                    Succeeded: false,
                    Detail: $"GET {metadataUrl} returned {(int)response.StatusCode} {response.ReasonPhrase}.");
            }

            return new ProbeResult(
                IsApplicable: true,
                Succeeded: true,
                Detail: $"OIDC discovery document reachable ({metadataUrl}).");
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return new ProbeResult(
                IsApplicable: true,
                Succeeded: false,
                Detail: $"{ex.GetType().Name}: {ex.Message}");
        }
    }
}
