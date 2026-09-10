using ArchLucid.Contracts.Governance;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArchLucid.Host.Core.Health;

/// <summary>
///     Surfaces <c>ArchLucid:Governance:PreCommitGateEnabled</c> on readiness probes for Working desk honesty (DR-04).
/// </summary>
public sealed class PreCommitGovernanceGateHealthCheck(IConfiguration configuration) : IHealthCheck
{
    public const string RegistrationName = "pre_commit_governance_gate";

    public const string EnabledDataKey = "enabled";

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        bool enabled = ResolveEnabled(configuration);

        IReadOnlyDictionary<string, object> data = new Dictionary<string, object>
        {
            [EnabledDataKey] = enabled,
        };

        string detail = enabled
            ? "Pre-finalize governance gate is enabled."
            : "Pre-finalize governance gate is disabled.";

        return Task.FromResult(HealthCheckResult.Healthy(detail, data: data));
    }

    internal static bool ResolveEnabled(IConfiguration configuration)
    {
        IConfigurationSection section = configuration.GetSection(PreCommitGovernanceGateOptions.SectionPath);

        return section.GetValue<bool>(nameof(PreCommitGovernanceGateOptions.PreCommitGateEnabled));
    }
}
