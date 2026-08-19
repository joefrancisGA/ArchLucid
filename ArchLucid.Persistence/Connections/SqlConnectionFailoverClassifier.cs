using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Connections;

/// <summary>Detects Azure SQL errors that warrant read failover to a secondary replica.</summary>
public static class SqlConnectionFailoverClassifier
{
    private static readonly HashSet<int> FailoverErrorNumbers = new()
    {
        -2,
        40613,
        40197,
        40501,
        49918,
        49919,
        49920,
    };

    /// <summary>Returns true when the exception indicates a transient primary outage suitable for secondary retry.</summary>
    public static bool IsFailoverEligible(Exception exception)
    {
        if (exception is TimeoutException)
            return true;

        if (exception is not SqlException sqlException)
            return false;

        foreach (SqlError error in sqlException.Errors)
        {
            if (FailoverErrorNumbers.Contains(error.Number))
                return true;
        }

        return false;
    }
}
