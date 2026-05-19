namespace ArchLucid.Host.Core.Health;

/// <summary>
///     Health check registration names included on authenticated <c>GET /health/detailed</c> (operational triage only).
/// </summary>
public static class OperationalDetailedHealthChecks
{
    public const string CircuitBreakers = "circuit_breakers";

    public const string Database = "database";

    public const string DistributedCache = "distributed_cache";

    private static readonly string[] IncludedNames =
    [
        CircuitBreakers,
        Database,
        DistributedCache,
    ];

    public static bool IsIncluded(string registrationName) =>
        IncludedNames.Contains(registrationName, StringComparer.Ordinal);
}
