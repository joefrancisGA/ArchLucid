namespace ArchLucid.Persistence.Connections;

/// <summary>Per-tenant product catalog connections when topology uses database-per-tenant.</summary>
public interface ITenantSqlConnectionFactory
{
    Task<Microsoft.Data.SqlClient.SqlConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken);
}
