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

        // codeql[cs/insecure-sql-connection]: no connection is opened here; the returned string always
        // passes through EnsureSqlClientEncryptMandatory below, which forces Encrypt=True.
        SqlConnectionStringBuilder builder = new(connectionString)
        {
            InitialCatalog = MasterCatalogName
        };

        return SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(builder.ConnectionString);
    }

    public static string ReadInitialCatalog(string connectionString)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);

        // codeql[cs/insecure-sql-connection]: parses catalog name only; no connection opened; Encrypt applied on builders that return strings.
        SqlConnectionStringBuilder builder = new(connectionString);

        if (string.IsNullOrWhiteSpace(builder.InitialCatalog))
            throw new InvalidOperationException("Connection string must specify Initial Catalog.");

        return builder.InitialCatalog;
    }
}
