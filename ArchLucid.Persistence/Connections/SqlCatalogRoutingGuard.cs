using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Connections;

/// <summary>Compares SQL connection strings by logical catalog (<c>Initial Catalog</c>) for tenant isolation guards.</summary>
internal static class SqlCatalogRoutingGuard
{
    internal static bool TargetsSameCatalog(string leftConnectionString, string rightConnectionString)
    {
        if (string.IsNullOrWhiteSpace(leftConnectionString) || string.IsNullOrWhiteSpace(rightConnectionString))
            return false;

        if (!TryGetInitialCatalog(leftConnectionString, out string leftCatalog))
            return false;

        if (!TryGetInitialCatalog(rightConnectionString, out string rightCatalog))
            return false;

        return string.Equals(leftCatalog, rightCatalog, StringComparison.OrdinalIgnoreCase);
    }

    private static bool TryGetInitialCatalog(string connectionString, out string initialCatalog)
    {
        initialCatalog = string.Empty;

        try
        {
            SqlConnectionStringBuilder builder = new(connectionString);
            string? catalog = builder.InitialCatalog?.Trim();

            if (string.IsNullOrWhiteSpace(catalog))
                return false;

            initialCatalog = catalog;
            return true;
        }
        catch (ArgumentException)
        {
            return false;
        }
    }
}
