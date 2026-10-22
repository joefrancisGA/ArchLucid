using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Connections;

/// <summary>
///     Opens tenant-scoped read-scale-out SQL connections for analytical repositories when
///     <c>ArchLucid:Persistence:ReadOnlyConnectionStringTemplate</c> is configured; otherwise transparently delegates to
///     the primary <see cref="ISqlConnectionFactory" />.
/// </summary>
public interface IReadOnlyDbConnectionFactory
{
    Task<SqlConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken);
}
