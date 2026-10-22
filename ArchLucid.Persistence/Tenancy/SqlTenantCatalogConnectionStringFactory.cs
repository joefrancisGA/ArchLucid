using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tenancy;

public static class SqlTenantCatalogConnectionStringFactory
{
    /// <summary>Applies <paramref name="logicalDatabaseName" /> as <see cref="SqlConnectionStringBuilder.InitialCatalog" />.</summary>
    public static string FromTemplate(string templateConnectionString, string logicalDatabaseName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(templateConnectionString);
        ArgumentException.ThrowIfNullOrWhiteSpace(logicalDatabaseName);

        SqlConnectionStringBuilder builder =
            new(SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(templateConnectionString.Trim()))
            {
                InitialCatalog = logicalDatabaseName.Trim(),
                ConnectRetryCount = 3,
                ConnectRetryInterval = 10
            };

        return builder.ConnectionString;
    }
}
