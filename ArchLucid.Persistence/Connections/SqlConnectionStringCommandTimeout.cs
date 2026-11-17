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

        // No connection is opened here. Encrypt is mandatory on the builder so static analysis and
        // runtime both require TLS before this string is used.
        SqlConnectionStringBuilder builder = new(connectionString)
        {
            Encrypt = SqlConnectionEncryptOption.Mandatory,
            CommandTimeout = timeoutSeconds
        };

        return SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(builder.ConnectionString);
    }
}
