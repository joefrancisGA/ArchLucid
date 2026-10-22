using ArchLucid.Core.Configuration;

using Azure;
using Azure.AI.ContentSafety;

using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Health;

/// <summary>
///     Optional readiness probe for Azure AI Content Safety when <see cref="ContentSafetyOptions.Enabled" /> is true.
/// </summary>
public sealed class ContentSafetyHealthCheck(IOptionsMonitor<ContentSafetyOptions> optionsMonitor) : IHealthCheck
{
    private readonly IOptionsMonitor<ContentSafetyOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        ContentSafetyOptions options = _optionsMonitor.CurrentValue;

        if (!options.Enabled)
            return HealthCheckResult.Healthy("Azure AI Content Safety is disabled (ArchLucid:ContentSafety:Enabled=false).");

        if (string.IsNullOrWhiteSpace(options.Endpoint) || string.IsNullOrWhiteSpace(options.ApiKey))
        {
            return HealthCheckResult.Unhealthy(
                "Content Safety is enabled but ArchLucid:ContentSafety:Endpoint or ApiKey is not configured.");
        }

        Uri endpoint = new(options.Endpoint.TrimEnd('/'), UriKind.Absolute);

        ContentSafetyClient client = new(endpoint, new AzureKeyCredential(options.ApiKey));
        AnalyzeTextOptions probe = new("ArchLucid readiness probe")
        {
            OutputType = AnalyzeTextOutputType.FourSeverityLevels
        };

        try
        {
            Response<AnalyzeTextResult> response =
                await client.AnalyzeTextAsync(probe, cancellationToken).ConfigureAwait(false);

            _ = response.Value;

            return HealthCheckResult.Healthy("Azure AI Content Safety analyze-text probe succeeded.");
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return HealthCheckResult.Unhealthy("Azure AI Content Safety probe failed.", ex);
        }
    }
}
