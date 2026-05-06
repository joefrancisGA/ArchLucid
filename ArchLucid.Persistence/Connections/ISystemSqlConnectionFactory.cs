namespace ArchLucid.Persistence.Connections;

/// <summary>Factory for the system / control-plane SQL catalog (tenant directory, bindings, provisioning).</summary>
public interface ISystemSqlConnectionFactory
{
    Task<Microsoft.Data.SqlClient.SqlConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken);
}
