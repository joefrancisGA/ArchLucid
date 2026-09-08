using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArchLucid.Host.Core.Health;

/// <summary>
///     Surfaces <c>ArchLucid:AgentOutput:QualityGate:Mode</c> on readiness probes for Working desk honesty (DR-05).
/// </summary>
public sealed class AgentOutputQualityGateModeHealthCheck(IConfiguration configuration) : IHealthCheck
{
    public const string RegistrationName = "agent_output_quality_gate_mode";

    public const string ModeDataKey = "mode";

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        AgentOutputQualityGateMode mode = ResolveMode(configuration);

        IReadOnlyDictionary<string, object> data = new Dictionary<string, object>
        {
            [ModeDataKey] = mode.ToString(),
        };

        string detail = mode switch
        {
            AgentOutputQualityGateMode.PilotStrict => "Agent output quality gate mode is PilotStrict.",
            _ => "Agent output quality gate mode is WarnOnly.",
        };

        return Task.FromResult(HealthCheckResult.Healthy(detail, data: data));
    }

    internal static AgentOutputQualityGateMode ResolveMode(IConfiguration configuration)
    {
        IConfigurationSection section = configuration.GetSection(AgentOutputQualityGateOptions.SectionPath);

        return section.GetValue<AgentOutputQualityGateMode>(nameof(AgentOutputQualityGateOptions.Mode));
    }
}
