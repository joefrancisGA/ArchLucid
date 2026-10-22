using System.Globalization;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Hosting;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArchLucid.Host.Core.Health;

/// <summary>
///     Lightweight Azure OpenAI reachability probe for Real agent mode. Uses a bounded TCP connect only — no chat or
///     embedding calls, so health polling does not consume model quota.
/// </summary>
public sealed class AzureOpenAiHealthCheck(IConfiguration configuration) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        if (!AzureOpenAiExecutionProbePolicy.ShouldProbeConfiguredEndpoint(configuration))
        {
            string mode = configuration["AgentExecution:Mode"]?.Trim() ?? "Simulator";

            return HealthCheckResult.Healthy(
                "Azure OpenAI probe skipped ("
                + mode
                + " — only Real mode with non-Echo completion client).");
        }

        string? endpoint = configuration["AzureOpenAI:Endpoint"]?.Trim();

        if (string.IsNullOrWhiteSpace(endpoint))

            return HealthCheckResult.Unhealthy(
                "AzureOpenAI:Endpoint is not configured for Real agent mode.");

        if (!Uri.TryCreate(endpoint, UriKind.Absolute, out Uri? resourceUri))

            return HealthCheckResult.Unhealthy("AzureOpenAI:Endpoint must be a valid absolute URL.");

        Uri authority = new(resourceUri.GetLeftPart(UriPartial.Authority));

        using CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        linked.CancelAfter(AzureOpenAiEndpointConnectivityLintLimits.SocketProbeTimeout);

        try
        {
            await AzureOpenAiEndpointConnectivitySocketProbe
                .IsTcpReachableAsync(authority, linked.Token)
                .ConfigureAwait(false);

            return HealthCheckResult.Healthy(
                string.Format(CultureInfo.InvariantCulture, "Azure OpenAI endpoint '{0}' TCP reachable.", authority.Host));
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return HealthCheckResult.Unhealthy(
                string.Format(
                    CultureInfo.InvariantCulture,
                    "Azure OpenAI endpoint '{0}' TCP probe timed out after {1:0.#}s.",
                    authority.Host,
                    AzureOpenAiEndpointConnectivityLintLimits.SocketProbeTimeout.TotalSeconds));
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy(
                string.Format(CultureInfo.InvariantCulture, "Azure OpenAI endpoint '{0}' TCP probe failed.", authority.Host),
                ex);
        }
    }
}
