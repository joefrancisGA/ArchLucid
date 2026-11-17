using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Connections;

internal static class SqlConnectionOpen
{
    // Keep ownership until the connection is open and can be handed to the caller.
    internal static async ValueTask<SqlConnection> OpenAsync(SqlConnection connection, CancellationToken ct)
    {
        try
        {
            await connection.OpenAsync(ct);
            return connection;
        }
        catch
        {
            await connection.DisposeAsync();
            throw;
        }
    }
}
