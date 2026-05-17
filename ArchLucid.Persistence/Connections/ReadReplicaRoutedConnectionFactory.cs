using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Polly;

namespace ArchLucid.Persistence.Connections;

/// <summary>
///     Opens either a read-scale-out connection string resolved for this factory's route or the primary resilient scoped path.
/// </summary>
public sealed class ReadReplicaRoutedConnectionFactory : IAuthorityRunListConnectionFactory,
    IGovernanceResolutionReadConnectionFactory, IGoldenManifestLookupReadConnectionFactory
{
    private readonly IOptionsMonitor<SqlServerOptions> _optionsMonitor;
    private readonly ISqlConnectionFactory _primaryResilientFactory;
    private readonly ReadReplicaQueryRoute _route;
    private readonly ResiliencePipeline _replicaOpenRetryPipeline;

    public ReadReplicaRoutedConnectionFactory(
        ISqlConnectionFactory primaryResilientFactory,
        IOptionsMonitor<SqlServerOptions> optionsMonitor,
        ReadReplicaQueryRoute route,
        IOptions<SqlOpenResilienceOptions> sqlOpenResilienceOptions,
        ILogger<ReadReplicaRoutedConnectionFactory> logger)
    {
        _optionsMonitor = optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

        _primaryResilientFactory =
            primaryResilientFactory ?? throw new ArgumentNullException(nameof(primaryResilientFactory));

        _route = route;

        ArgumentNullException.ThrowIfNull(sqlOpenResilienceOptions);
        ArgumentNullException.ThrowIfNull(logger);

        SqlOpenResilienceOptions opts = sqlOpenResilienceOptions.Value;

        _replicaOpenRetryPipeline = SqlOpenResilienceDefaults.BuildSqlOpenRetryPipeline(
            logger,
            opts.MaxRetryAttempts,
            TimeSpan.FromMilliseconds(opts.BaseDelayMilliseconds));
    }

    /// <inheritdoc />
    public async Task<SqlConnection> CreateOpenConnectionAsync(CancellationToken ct)
    {
        SqlServerOptions snapshot = _optionsMonitor.CurrentValue;
        string? replica = SqlReadReplicaConnectionStringResolver.Resolve(_route, snapshot.ReadReplica);

        if (string.IsNullOrEmpty(replica))
            return await _primaryResilientFactory.CreateOpenConnectionAsync(ct);

        return await _replicaOpenRetryPipeline.ExecuteAsync(
            async innerCt =>
            {
                SqlConnection connection = new(replica);
                await connection.OpenAsync(innerCt);

                return connection;
            },
            ct);
    }
}
