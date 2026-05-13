using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Tenancy;

/// <summary>
///     Hard-deletes expired soft-deleted <c>dbo.Projects</c> in tenant catalogs (single or per-tenant topology).
/// </summary>
public sealed class SqlArchitectureProjectRetentionPurgeService(
    ISqlConnectionFactory tenantPlaneConnectionFactory,
    ITenantRepository tenantRepository,
    ITenantDatabaseResolver tenantDatabaseResolver,
    IOptionsMonitor<SqlTopologyOptions> topologyOptions,
    ILogger<SqlArchitectureProjectRetentionPurgeService> logger) : IArchitectureProjectRetentionPurgeService
{
    private readonly ISqlConnectionFactory _tenantPlaneConnectionFactory =
        tenantPlaneConnectionFactory ?? throw new ArgumentNullException(nameof(tenantPlaneConnectionFactory));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly ITenantDatabaseResolver _tenantDatabaseResolver =
        tenantDatabaseResolver ?? throw new ArgumentNullException(nameof(tenantDatabaseResolver));

    private readonly IOptionsMonitor<SqlTopologyOptions> _topologyOptions =
        topologyOptions ?? throw new ArgumentNullException(nameof(topologyOptions));

    private readonly ILogger<SqlArchitectureProjectRetentionPurgeService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<IReadOnlyList<ArchitectureProjectPurgeDeletion>> PurgeExpiredAsync(
        DateTimeOffset cutoffUtc,
        CancellationToken ct)
    {
        SqlTopologyOptions snapshot = _topologyOptions.CurrentValue;

        if (snapshot.Mode == SqlTopologyMode.SingleCatalog)
        {
            await using SqlConnection connection =
                (SqlConnection)await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct);

            return await PurgeOnConnectionAsync(connection, cutoffUtc, ct);
        }

        List<ArchitectureProjectPurgeDeletion> all = [];

        IReadOnlyList<TenantRecord> tenants = await _tenantRepository.ListAsync(ct);

        foreach (TenantRecord tenant in tenants)
        {
            string connectionString;

            try
            {
                connectionString = await _tenantDatabaseResolver.ResolveTenantConnectionStringAsync(tenant.Id, ct);
            }
            catch (Exception ex)
            {
                if (_logger.IsEnabled(LogLevel.Warning))
                    _logger.LogWarning(
                        ex,
                        "Architecture project retention: skipped tenant {TenantId} — catalog binding unavailable.",
                        tenant.Id);

                continue;
            }

            string secured = SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(connectionString);
            await using SqlConnection connection = new(secured);
            await connection.OpenAsync(ct);

            IReadOnlyList<ArchitectureProjectPurgeDeletion> chunk = await PurgeOnConnectionAsync(connection, cutoffUtc, ct);

            foreach (ArchitectureProjectPurgeDeletion d in chunk)

                all.Add(d);
        }

        return all;
    }

    private static async Task<IReadOnlyList<ArchitectureProjectPurgeDeletion>> PurgeOnConnectionAsync(
        SqlConnection connection,
        DateTimeOffset cutoffUtc,
        CancellationToken ct)
    {
        const string sql = """
                           DECLARE @Out TABLE (ProjectId UNIQUEIDENTIFIER NOT NULL, TenantId UNIQUEIDENTIFIER NOT NULL, WorkspaceId UNIQUEIDENTIFIER NOT NULL);

                           DELETE FROM p
                           OUTPUT deleted.Id, deleted.TenantId, deleted.WorkspaceId INTO @Out
                           FROM dbo.Projects AS p
                           WHERE p.IsDeleted = 1
                             AND p.DeletedUtc IS NOT NULL
                             AND p.DeletedUtc < @Cutoff
                             AND NOT EXISTS (SELECT 1 FROM dbo.TenantWorkspaces AS tw WHERE tw.DefaultProjectId = p.Id);

                           SELECT ProjectId, TenantId, WorkspaceId FROM @Out;
                           """;

        IEnumerable<SqlArchitectureProjectRetentionPurgeRow> rows = await connection.QueryAsync<SqlArchitectureProjectRetentionPurgeRow>(
            new CommandDefinition(sql, new { Cutoff = cutoffUtc }, cancellationToken: ct));

        List<ArchitectureProjectPurgeDeletion> list = new();

        foreach (SqlArchitectureProjectRetentionPurgeRow row in rows)

            list.Add(new ArchitectureProjectPurgeDeletion(row.ProjectId, row.TenantId, row.WorkspaceId));

        return list;
    }
}
