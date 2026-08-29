using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Connections;

/// <summary>Walks exception chains for embedded <see cref="SqlException" /> instances.</summary>
public static class SqlExceptionTraversal
{
    public static bool TryFind(Exception? exception, out SqlErrorSnapshot snapshot)
    {
        SqlException? sqlException = Find(exception);

        if (sqlException is null)
        {
            snapshot = default;
            return false;
        }

        snapshot = new SqlErrorSnapshot(sqlException.Number, sqlException.State);
        return true;
    }

    public static SqlException? Find(Exception? exception)
    {
        for (Exception? current = exception; current is not null; current = current.InnerException)
        {
            if (current is SqlException sqlException)
                return sqlException;
        }

        return null;
    }
}
