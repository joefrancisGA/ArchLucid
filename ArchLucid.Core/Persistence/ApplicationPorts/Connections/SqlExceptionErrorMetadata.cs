using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Connections;

/// <summary>
///     Extracts SQL Server error metadata from exception chains without forcing Application to reference SqlClient.
/// </summary>
public readonly record struct SqlExceptionErrorMetadata(int Number, byte State)
{
    public static bool TryRead(Exception? exception, out SqlExceptionErrorMetadata metadata)
    {
        for (Exception? current = exception; current is not null; current = current.InnerException)
        {
            if (current is not SqlException sqlException)
                continue;

            metadata = new SqlExceptionErrorMetadata(sqlException.Number, sqlException.State);
            return true;
        }

        metadata = default;
        return false;
    }
}
