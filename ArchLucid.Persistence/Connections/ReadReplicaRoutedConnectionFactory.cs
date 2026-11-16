using ArchLucid.Core.Configuration;

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
    private readonly IOptionsMonitor<SqlTopologyOptions> _topologyOptions;
    private readonly ISqlConnectionFactory _primaryResilientFactory;
    private readonly ReadReplicaQueryRoute _route;
    private readonly ResiliencePipeline _replicaOpenRetryPipeline;

    public ReadReplicaRoutedConnectionFactory(
        ISqlConnectionFactory primaryResilientFactory,
        IOptionsMonitor<SqlServerOptions> optionsMonitor,
        IOptionsMonitor<SqlTopologyOptions> topologyOptions,
        ReadReplicaQueryRoute route,
        IOptions<SqlOpenResilienceOptions> sqlOpenResilienceOptions,
        ILogger<ReadReplicaRoutedConnectionFactory> logger)
    {
        _optionsMonitor = optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));
        _topologyOptions = topologyOptions ?? throw new ArgumentNullException(nameof(topologyOptions));

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
        // The legacy replica connection string points to one catalog shared by all routes.
        if (_topologyOptions.CurrentValue.Mode != SqlTopologyMode.SingleCatalog)
            return await _primaryResilientFactory.CreateOpenConnectionAsync(ct);

        SqlServerOptions snapshot = _optionsMonitor.CurrentValue;
        string? replica = SqlReadReplicaConnectionStringResolver.Resolve(_route, snapshot.ReadReplica);

        try
        {
            return await _primaryResilientFactory.CreateOpenConnectionAsync(ct);
        }
        catch (Exception ex) when (replica is not null && SqlConnectionFailoverClassifier.IsFailoverEligible(ex))
        {
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
}
