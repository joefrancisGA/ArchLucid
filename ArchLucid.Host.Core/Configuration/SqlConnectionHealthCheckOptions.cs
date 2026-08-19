namespace ArchLucid.Host.Core.Configuration;

/// <summary>Latency threshold for <see cref="Health.SqlConnectionHealthCheck"/> brownout detection.</summary>
public sealed class SqlConnectionHealthCheckOptions
{
    public const string SectionName = "HealthChecks:SqlConnection";

    /// <summary>Responses slower than this many milliseconds are reported as Degraded.</summary>
    public int DegradedThresholdMs { get; set; } = 500;
}
