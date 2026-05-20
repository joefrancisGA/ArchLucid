using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArchLucid.Host.Core.Health;

/// <summary>
///     Surfaces <c>AgentExecution:Mode</c> on readiness probes so operators can spot Simulator deployments in production.
/// </summary>
public sealed class AgentExecutionModeHealthCheck(IConfiguration configuration) : IHealthCheck
{
    public const string RegistrationName = "agent_execution_mode";

    public const string ModeDataKey = "mode";

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        string mode = AgentExecutionModeHealthCheckSupport.ResolveReportedMode(configuration);

        IReadOnlyDictionary<string, object> data = new Dictionary<string, object>
        {
            [ModeDataKey] = mode,
        };

        return Task.FromResult(
            HealthCheckResult.Healthy($"AgentExecution mode is {mode}.", data: data));
    }
}

internal static class AgentExecutionModeHealthCheckSupport
{
    internal static string ResolveReportedMode(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        string? raw = configuration["AgentExecution:Mode"]?.Trim();

        if (string.IsNullOrWhiteSpace(raw))
            return "Simulator";

        if (string.Equals(raw, "Real", StringComparison.OrdinalIgnoreCase))
            return "Real";

        if (string.Equals(raw, "Simulator", StringComparison.OrdinalIgnoreCase))
            return "Simulator";

        return raw;
    }
}
