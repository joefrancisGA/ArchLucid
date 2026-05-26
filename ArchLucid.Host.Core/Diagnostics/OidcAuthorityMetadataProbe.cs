using System.Net;

using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Http;

using Polly;

namespace ArchLucid.Host.Core.Diagnostics;

/// <summary>Shared OIDC discovery probe for admin health checks and startup warnings (Improvement #7).</summary>
public static class OidcAuthorityMetadataProbe
{
    /// <summary>Result of probing <c>/.well-known/openid-configuration</c>.</summary>
    public sealed record ProbeResult(bool IsApplicable, bool Succeeded, string Detail);

    public static async Task<ProbeResult> ProbeAsync(
        IConfiguration configuration,
        HttpClient httpClient,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(httpClient);

        string mode = ArchLucidConfigurationBridge.ResolveAuthConfigurationValue(configuration, "Mode") ?? string.Empty;

        if (!string.Equals(mode, "JwtBearer", StringComparison.OrdinalIgnoreCase))
        {
            return new ProbeResult(
                IsApplicable: false,
                Succeeded: true,
                Detail: $"Auth mode is '{mode}' — OIDC metadata probe not applicable.");
        }

        string? authority =
            ArchLucidConfigurationBridge.ResolveAuthConfigurationValue(configuration, "Authority");

        if (string.IsNullOrWhiteSpace(authority))
        {
            return new ProbeResult(
                IsApplicable: true,
                Succeeded: false,
                Detail: "JwtBearer mode but ArchLucidAuth:Authority (or legacy equivalent) is empty.");
        }

        string metadataUrl = $"{authority.TrimEnd('/')}/.well-known/openid-configuration";

        ResiliencePipeline<HttpResponseMessage> retryPipeline = OidcAuthorityMetadataProbeHttpResilience.BuildPipeline();

        try
        {
            using HttpResponseMessage response = await retryPipeline
                .ExecuteAsync(
                    async ct => await httpClient.GetAsync(metadataUrl, ct).ConfigureAwait(false),
                    cancellationToken)
                .ConfigureAwait(false);

            if (response.StatusCode != HttpStatusCode.OK)
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
