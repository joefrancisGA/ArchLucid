using Microsoft.Data.SqlClient;

namespace ArchLucid.Core.Persistence.ApplicationPorts.Connections;

/// <summary>Extracts SQL Server error metadata from exception chains without pulling SqlClient into Application.</summary>
public static class SqlExceptionInspector
{
    public static bool TryFind(Exception? exception, out SqlExceptionDetails details)
    {
        for (Exception? current = exception; current is not null; current = current.InnerException)
        {
            if (current is SqlException sqlException)
            {
                details = new SqlExceptionDetails(sqlException.Number, sqlException.State);
                return true;
            }
        }

        details = default;
        return false;
    }
}
