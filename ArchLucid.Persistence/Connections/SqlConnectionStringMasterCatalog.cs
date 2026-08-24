using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Connections;

/// <summary>Redirects a tenant/product connection string at the <c>master</c> catalog for DDL that cannot run in-session.</summary>
public static class SqlConnectionStringMasterCatalog
{
    public const string MasterCatalogName = "master";

    public static string RedirectToMaster(string connectionString)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);

        SqlConnectionStringBuilder builder = new(connectionString)
        {
            InitialCatalog = MasterCatalogName
        };

        return builder.ConnectionString;
    }

    public static string ReadInitialCatalog(string connectionString)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);

        SqlConnectionStringBuilder builder = new(connectionString);

        if (string.IsNullOrWhiteSpace(builder.InitialCatalog))
            throw new InvalidOperationException("Connection string must specify Initial Catalog.");

        return builder.InitialCatalog;
    }
}
