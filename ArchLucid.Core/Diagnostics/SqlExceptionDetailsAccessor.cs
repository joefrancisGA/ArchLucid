using Microsoft.Data.SqlClient;

namespace ArchLucid.Core.Diagnostics;

/// <summary>Extracts SQL Server error metadata without forcing higher layers to reference SqlClient.</summary>
public static class SqlExceptionDetailsAccessor
{
    public static bool TryGet(Exception? exception, out int number, out byte state)
    {
        for (Exception? current = exception; current is not null; current = current.InnerException)
        {
            if (current is not SqlException sqlException)
                continue;

            number = sqlException.Number;
            state = sqlException.State;
            return true;
        }

        number = default;
        state = default;
        return false;
    }
}
