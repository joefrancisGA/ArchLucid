namespace ArchLucid.Host.Core.Configuration;

/// <summary>Options for <see cref="Health.DatabaseLivenessHealthCheck" />.</summary>
public sealed class DatabaseLivenessHealthCheckOptions
{
    public const string SectionName = "HealthChecks:DatabaseLiveness";

    /// <summary>Maximum time to wait for <c>SELECT 1</c> against the control-plane catalog.</summary>
    public int ProbeTimeoutSeconds
    {
        get;
        set;
    } = 2;
}
