using Microsoft.Data.SqlClient;

using Microsoft.Extensions.Options;

namespace ArchiForge.Persistence.Connections;

/// <summary>
/// Delegates to <see cref="ReadReplicaOptions.AuthorityRunListReadsConnectionString"/> when configured; otherwise uses the primary <see cref="ISqlConnectionFactory"/>.
/// </summary>
public sealed class AuthorityRunListConnectionFactory(
    ISqlConnectionFactory primaryFactory,
    IOptionsMonitor<ReadReplicaOptions> optionsMonitor) : IAuthorityRunListConnectionFactory
{
    private readonly ISqlConnectionFactory _primaryFactory =
        primaryFactory ?? throw new ArgumentNullException(nameof(primaryFactory));

    private readonly IOptionsMonitor<ReadReplicaOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    /// <inheritdoc />
    public async Task<SqlConnection> CreateOpenConnectionAsync(CancellationToken ct)
    {
        ReadReplicaOptions snapshot = _optionsMonitor.CurrentValue;
        string? replica = snapshot.AuthorityRunListReadsConnectionString?.Trim();

        if (string.IsNullOrEmpty(replica))
            return await _primaryFactory.CreateOpenConnectionAsync(ct);

        SqlConnection connection = new(replica);
        await connection.OpenAsync(ct);
        return connection;
    }
}
