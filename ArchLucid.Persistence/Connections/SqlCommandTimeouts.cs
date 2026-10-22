namespace ArchLucid.Persistence.Connections;

/// <summary>Shared SQL command timeout budgets (seconds) for ADO.NET / Dapper / DbUp.</summary>
public static class SqlCommandTimeouts
{
    /// <summary>SqlClient default and <see cref="SqlConnectionFactory" /> connection-string command timeout.</summary>
    public const int StandardSeconds = 30;

    /// <summary>
    ///     Drop/create catalog, DbUp script execution, schema bootstrap, and development catalog reset.
    ///     Local SQL can hold locks while the API still has pooled connections; 30s is too tight.
    /// </summary>
    public const int ExtendedSeconds = 600;
}
