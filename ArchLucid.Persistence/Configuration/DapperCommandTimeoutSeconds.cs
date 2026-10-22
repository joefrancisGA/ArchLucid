namespace ArchLucid.Persistence.Configuration;

/// <summary>
///     Explicit Dapper <see cref="Dapper.CommandDefinition" /> timeouts (seconds). Prefer these over <c>null</c> so
///     repositories do not rely on implicit SqlClient defaults when global bootstrap is absent.
/// </summary>
public static class DapperCommandTimeoutSeconds
{
    /// <summary>Standard CRUD and governance workflow queries.</summary>
    public const int Standard = 30;

    /// <summary>
    ///     Interactive UI reads that must fail faster than the UI proxy budget (typically 60s).
    /// </summary>
    public const int Interactive = 5;

    /// <summary>Heavy reporting or export aggregation queries.</summary>
    public const int Report = 120;
}
