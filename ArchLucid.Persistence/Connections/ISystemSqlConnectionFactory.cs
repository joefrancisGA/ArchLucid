namespace ArchLucid.Persistence.Connections;

/// <summary>Factory for the system / control-plane SQL catalog (tenant directory, bindings, provisioning).</summary>
public interface ISystemSqlConnectionFactory
{
    /// <summary>Normalized connection string for the control-plane catalog (used by tenant isolation guards).</summary>
    string SystemConnectionString { get; }

    Task<Microsoft.Data.SqlClient.SqlConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken);
}
