using Microsoft.Data.SqlClient;

using Microsoft.Extensions.Options;

namespace ArchiForge.Persistence.Connections;

/// <summary>
/// Opens either the read-replica connection string or the primary <see cref="ResilientSqlConnectionFactory"/> path,
/// then applies the same RLS <see cref="IRlsSessionContextApplicator"/> as scoped repositories.
/// </summary>
public sealed class AuthorityRunListConnectionFactory(
    ResilientSqlConnectionFactory resilientFactory,
    IOptionsMonitor<SqlServerOptions> optionsMonitor,
    IRlsSessionContextApplicator sessionContextApplicator) : IAuthorityRunListConnectionFactory
{
    private readonly ResilientSqlConnectionFactory _resilientFactory =
        resilientFactory ?? throw new ArgumentNullException(nameof(resilientFactory));

    private readonly IOptionsMonitor<SqlServerOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly IRlsSessionContextApplicator _sessionContextApplicator =
        sessionContextApplicator ?? throw new ArgumentNullException(nameof(sessionContextApplicator));

    /// <inheritdoc />
    public async Task<SqlConnection> CreateOpenConnectionAsync(CancellationToken ct)
    {
        SqlServerOptions snapshot = _optionsMonitor.CurrentValue;
        string? replica = snapshot.ReadReplica.AuthorityRunListReadsConnectionString?.Trim();

        SqlConnection connection;
        if (string.IsNullOrEmpty(replica))
            connection = await _resilientFactory.CreateOpenConnectionAsync(ct);
        else
        {
            connection = new SqlConnection(replica);
            await connection.OpenAsync(ct);
        }

        await _sessionContextApplicator.ApplyAsync(connection, ct);
        return connection;
    }
}
