using Microsoft.Data.SqlClient;

using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Persistence.Connections;

/// <summary>Applies <see cref="SqlConnectionStringBuilder.CommandTimeout" /> without otherwise mutating the string.</summary>
public static class SqlConnectionStringCommandTimeout
{
    public static string Apply(string connectionString, int timeoutSeconds)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);

        if (timeoutSeconds < 0)
            throw new ArgumentOutOfRangeException(nameof(timeoutSeconds), timeoutSeconds, "Timeout seconds must be zero or positive.");

        // codeql[cs/insecure-sql-connection]: no connection is opened here; the returned string always
        // passes through EnsureSqlClientEncryptMandatory below, which forces Encrypt=True.
        SqlConnectionStringBuilder builder = new(connectionString)
        {
            CommandTimeout = timeoutSeconds
        };

        return SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(builder.ConnectionString);
    }
}
