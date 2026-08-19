namespace ArchLucid.TestSupport;

/// <summary>
///     Non-empty SQL connection string for startup normalization when integration tests configure in-memory persistence
///     and never open SQL Server.
/// </summary>
public static class InMemoryStartupSqlConnectionStringSentinel
{
    /// <summary>Host is never queried when persistence is fully in-memory; this only satisfies normalization at startup.</summary>
    public const string Value =
        "Server=127.0.0.1;Database=inmemory_startup_stub;User Id=inmemory;Password=unused;Encrypt=True;TrustServerCertificate=True;";
}
