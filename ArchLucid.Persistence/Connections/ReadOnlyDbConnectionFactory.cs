using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Polly;

namespace ArchLucid.Persistence.Connections;

/// <summary>
///     Resolves optional read-scale-out connections from <see cref="ArchLucidPersistenceOptions.ReadOnlyConnectionStringTemplate" />
///     with the same tenant binding semantics as <see cref="ScopedRoutingSqlConnectionFactory" />.
/// </summary>
public sealed class ReadOnlyDbConnectionFactory : IReadOnlyDbConnectionFactory
{
    private readonly IOptionsMonitor<ArchLucidPersistenceOptions> _persistenceOptions;
    private readonly IOptionsMonitor<SqlTopologyOptions> _topologyOptions;
    private readonly ITenantDatabaseResolver _tenantDatabaseResolver;
    private readonly IScopeContextProvider _scopeContextProvider;
    private readonly ISqlConnectionFactory _primaryFactory;
    private readonly ResiliencePipeline _openRetryPipeline;

    public ReadOnlyDbConnectionFactory(
        ISqlConnectionFactory primaryFactory,
        ITenantDatabaseResolver tenantDatabaseResolver,
        IScopeContextProvider scopeContextProvider,
        IOptionsMonitor<ArchLucidPersistenceOptions> persistenceOptions,
        IOptionsMonitor<SqlTopologyOptions> topologyOptions,
        IOptions<SqlOpenResilienceOptions> sqlOpenResilienceOptions,
        ILogger<ReadOnlyDbConnectionFactory> logger)
    {
        _primaryFactory = primaryFactory ?? throw new ArgumentNullException(nameof(primaryFactory));
        _tenantDatabaseResolver =
            tenantDatabaseResolver ?? throw new ArgumentNullException(nameof(tenantDatabaseResolver));
        _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));
        _persistenceOptions = persistenceOptions ?? throw new ArgumentNullException(nameof(persistenceOptions));
        _topologyOptions = topologyOptions ?? throw new ArgumentNullException(nameof(topologyOptions));

        ArgumentNullException.ThrowIfNull(sqlOpenResilienceOptions);
        ArgumentNullException.ThrowIfNull(logger);

        SqlOpenResilienceOptions opts = sqlOpenResilienceOptions.Value;

        _openRetryPipeline = SqlOpenResilienceDefaults.BuildSqlOpenRetryPipeline(
            logger,
            opts.MaxRetryAttempts,
            TimeSpan.FromMilliseconds(opts.BaseDelayMilliseconds));
    }

    /// <inheritdoc />
    public async Task<SqlConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken)
    {
        string? readOnlyConnectionString = await ResolveReadOnlyConnectionStringAsync(cancellationToken);

        if (string.IsNullOrEmpty(readOnlyConnectionString))
            return await _primaryFactory.CreateOpenConnectionAsync(cancellationToken);

        return await _openRetryPipeline.ExecuteAsync(
            async innerCt =>
            {
                SqlConnection connection = new(readOnlyConnectionString);
                await connection.OpenAsync(innerCt);

                return connection;
            },
            cancellationToken);
    }

    private async Task<string?> ResolveReadOnlyConnectionStringAsync(CancellationToken cancellationToken)
    {
        ArchLucidPersistenceOptions persistence = _persistenceOptions.CurrentValue;
        string? template = persistence.ReadOnlyConnectionStringTemplate?.Trim();

        if (string.IsNullOrEmpty(template))
            return null;

        SqlTopologyOptions topology = _topologyOptions.CurrentValue;

        if (topology.Mode == SqlTopologyMode.SingleCatalog)
            return SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(template);

        Guid tenantId = _scopeContextProvider.GetCurrentScope().TenantId;

        if (tenantId == Guid.Empty)
            return null;

        return await _tenantDatabaseResolver.TryResolveReadOnlyConnectionStringAsync(tenantId, cancellationToken);
    }
}
