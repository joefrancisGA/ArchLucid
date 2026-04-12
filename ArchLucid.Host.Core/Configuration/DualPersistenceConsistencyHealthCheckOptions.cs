namespace ArchLucid.Host.Core.Configuration;

/// <summary>Configuration for <see cref="ArchLucid.Host.Core.Health.DualPersistenceConsistencyHealthCheck"/>.</summary>
public sealed class DualPersistenceConsistencyHealthCheckOptions
{
    public const string SectionName = "HealthChecks:DualPersistenceConsistency";

    /// <summary>Absolute row-count delta above this value yields <see cref="Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Degraded"/>.</summary>
    public int MaxAllowedDelta { get; set; } = 5;

    /// <summary>Only rows with <c>CreatedUtc &gt;= UTC now - this many hours</c> are counted (bounded scan).</summary>
    public int RecentWindowHours { get; set; } = 24;
}
