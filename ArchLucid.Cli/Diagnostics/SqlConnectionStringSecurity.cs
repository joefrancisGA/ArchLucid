using Microsoft.Data.SqlClient;

namespace ArchLucid.Cli.Diagnostics;

/// <summary>
///     Normalizes SQL client connection strings for in-transit encryption (CWE-311).
///     Local CLI copy — avoids coupling CLI to ArchLucid.Persistence.
/// </summary>
internal static class SqlConnectionStringSecurity
{
    internal static string EnsureSqlClientEncryptMandatory(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("Connection string is required.", nameof(connectionString));

        SqlConnectionStringBuilder builder = new(connectionString.Trim())
        {
            Encrypt = SqlConnectionEncryptOption.Mandatory,
        };

        return builder.ConnectionString;
    }
}
