using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Connections;

public interface ISqlConnectionFactory
{
    Task<SqlConnection> CreateOpenConnectionAsync(CancellationToken ct);
}
