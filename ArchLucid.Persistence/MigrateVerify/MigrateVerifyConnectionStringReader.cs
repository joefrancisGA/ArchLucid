using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.MigrateVerify;

/// <summary>Resolves DbUp connection strings for CI and local migrate-verify runs.</summary>
public static class MigrateVerifyConnectionStringReader
{
    /// <summary>Env var consumed by Tier 1.5 CI (must include Initial Catalog).</summary>
    public const string ConnectionStringEnvironmentVariableName = "ARCHLUCID_CI_DBUP_CONNECTION_STRING";

    /// <summary>Resolves connection string from env (CI) or first CLI arg (local).</summary>
    public static bool TryReadConnectionString(
        IReadOnlyList<string>? args,
        out string connectionString,
        out string usageError)
    {
        string? raw = Environment.GetEnvironmentVariable(ConnectionStringEnvironmentVariableName);

        if (string.IsNullOrWhiteSpace(raw) && args is { Count: > 0 })
            raw = args[0];

        if (string.IsNullOrWhiteSpace(raw))
        {
            connectionString = string.Empty;

            usageError =
                $"{ConnectionStringEnvironmentVariableName} is unset and no connection string argument was provided. "
                + "Set env or pass SQL connection string as the first argument.";

            return false;
        }

        SqlConnectionStringBuilder builder = new(raw.Trim());

        // Treat empty/null catalog as programmer error early (DatabaseMigrator would target master otherwise).
        if (string.IsNullOrWhiteSpace(builder.InitialCatalog))
        {
            connectionString = string.Empty;

            usageError = "Initial Catalog is required.";

            return false;
        }

        connectionString = raw.Trim();
        usageError = string.Empty;

        return true;
    }
}
