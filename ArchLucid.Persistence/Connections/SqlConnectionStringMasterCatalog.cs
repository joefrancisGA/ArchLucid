using Microsoft.Data.SqlClient;

using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Persistence.Connections;

/// <summary>Redirects a tenant/product connection string at the <c>master</c> catalog for DDL that cannot run in-session.</summary>
public static class SqlConnectionStringMasterCatalog
{
    public const string MasterCatalogName = "master";

    public static string RedirectToMaster(string connectionString)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);

        // No connection is opened here. Encrypt is mandatory on the builder before returning a connection string.
        SqlConnectionStringBuilder builder = new(connectionString)
        {
            Encrypt = SqlConnectionEncryptOption.Mandatory,
            InitialCatalog = MasterCatalogName
        };

        return SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(builder.ConnectionString);
    }

    public static string ReadInitialCatalog(string connectionString)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);

        // Parses Initial Catalog only; no connection is opened.
        SqlConnectionStringBuilder builder = new(connectionString)
        {
            Encrypt = SqlConnectionEncryptOption.Mandatory
        };

        if (string.IsNullOrWhiteSpace(builder.InitialCatalog))
            throw new InvalidOperationException("Connection string must specify Initial Catalog.");

        return builder.InitialCatalog;
    }
}
