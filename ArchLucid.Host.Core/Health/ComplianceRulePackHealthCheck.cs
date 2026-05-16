using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArchLucid.Host.Core.Health;

/// <summary>Verifies the default compliance rule pack file exists next to the running API (same path as FileComplianceRulePackLoader).</summary>
public sealed class ComplianceRulePackHealthCheck : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        string defaultPath = Path.Combine(AppContext.BaseDirectory, EmbeddedContentPaths.ComplianceRulePackRelativePath);
        string gaPath = Path.Combine(AppContext.BaseDirectory, EmbeddedContentPaths.GaStarterComplianceRulePackRelativePath);

        if (!File.Exists(defaultPath))

            return Task.FromResult(
                HealthCheckResult.Unhealthy(
                    $"Compliance rule pack not found at '{defaultPath}'. Expected bundled content from ArchLucid.Decisioning (CopyToOutputDirectory)."));

        if (!File.Exists(gaPath))

            return Task.FromResult(
                HealthCheckResult.Unhealthy(
                    $"GA starter compliance rule pack not found at '{gaPath}'. Expected bundled content from ArchLucid.Decisioning (CopyToOutputDirectory)."));

        return Task.FromResult(
            HealthCheckResult.Healthy(
                $"Compliance rule packs present: {EmbeddedContentPaths.ComplianceRulePackRelativePath} + {EmbeddedContentPaths.GaStarterComplianceRulePackRelativePath}."));
    }
}
