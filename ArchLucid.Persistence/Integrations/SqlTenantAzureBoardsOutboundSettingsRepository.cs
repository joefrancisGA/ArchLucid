using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Integrations;

/// <summary>
///     Tenant-catalog Azure Boards outbound overrides. Must use <see cref="ISqlConnectionFactory"/> (scoped tenant routing),
///     not <see cref="IBackgroundWorkerSqlConnectionFactory"/> (primary/system catalog) — otherwise
///     <c>SystemWithPerTenantCatalogs</c> hosts return SQL 208 / “Database Query Failed” on settings GET/PUT (TB-1151 / TB-867 / PD-002 class).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL integration; covered via API integration tests.")]
public sealed class SqlTenantAzureBoardsOutboundSettingsRepository(
    ISqlConnectionFactory connectionFactory,
    SqlResilientOperationExecutor sqlOperations) : ITenantAzureBoardsOutboundSettingsRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly SqlResilientOperationExecutor _sqlOperations =
        sqlOperations ?? throw new ArgumentNullException(nameof(sqlOperations));

    public Task<TenantAzureBoardsOutboundSettings?> TryGetAsync(Guid tenantId, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => TryGetCoreAsync(tenantId, ct), cancellationToken);

    public Task<TenantAzureBoardsOutboundSettings> UpsertAsync(
        Guid tenantId,
        TenantAzureBoardsOutboundSettings settings,
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => UpsertCoreAsync(tenantId, settings, ct), cancellationToken);

    public Task UpdateConnectionTestAsync(
        Guid tenantId,
        DateTime testedUtc,
        string summary,
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(
            ct => UpdateConnectionTestCoreAsync(tenantId, testedUtc, summary, ct),
            cancellationToken);

    private async Task<TenantAzureBoardsOutboundSettings> UpsertCoreAsync(
        Guid tenantId,
        TenantAzureBoardsOutboundSettings settings,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        ArgumentNullException.ThrowIfNull(settings);

        const string sql = """
                           MERGE dbo.TenantAzureBoardsOutboundSettings AS target
                           USING (SELECT @TenantId AS TenantId) AS source
                           ON target.TenantId = source.TenantId
                           WHEN MATCHED THEN
                               UPDATE SET
                                   ProjectName = @ProjectName,
                                   DefaultWorkItemType = @DefaultWorkItemType,
                                   AreaPath = @AreaPath,
                                   IterationPath = @IterationPath,
                                   DefaultTags = @DefaultTags
                           WHEN NOT MATCHED THEN
                               INSERT (TenantId, ProjectName, DefaultWorkItemType, AreaPath, IterationPath, DefaultTags)
                               VALUES (@TenantId, @ProjectName, @DefaultWorkItemType, @AreaPath, @IterationPath, @DefaultTags);
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        _ = await connection.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        TenantId = tenantId,
                        ProjectName = settings.ProjectName,
                        DefaultWorkItemType = settings.DefaultWorkItemType,
                        AreaPath = settings.AreaPath,
                        IterationPath = settings.IterationPath,
                        DefaultTags = settings.DefaultTags,
                    },
                    cancellationToken: ct))
            .ConfigureAwait(false);

        TenantAzureBoardsOutboundSettings? saved = await TryGetCoreAsync(tenantId, ct).ConfigureAwait(false);

        return saved ?? settings;
    }

    private async Task UpdateConnectionTestCoreAsync(
        Guid tenantId,
        DateTime testedUtc,
        string summary,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        ArgumentException.ThrowIfNullOrWhiteSpace(summary);

        const string sql = """
                           UPDATE dbo.TenantAzureBoardsOutboundSettings
                           SET LastConnectionTestUtc = @LastConnectionTestUtc,
                               LastConnectionTestSummary = @LastConnectionTestSummary
                           WHERE TenantId = @TenantId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        _ = await connection.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        TenantId = tenantId,
                        LastConnectionTestUtc = testedUtc,
                        LastConnectionTestSummary = summary.Trim(),
                    },
                    cancellationToken: ct))
            .ConfigureAwait(false);
    }

    private async Task<TenantAzureBoardsOutboundSettings?> TryGetCoreAsync(Guid tenantId, CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        const string sql = """
                           SELECT TenantId,
                                  ProjectName,
                                  DefaultWorkItemType,
                                  AreaPath,
                                  IterationPath,
                                  DefaultTags,
                                  LastConnectionTestUtc,
                                  LastConnectionTestSummary
                           FROM dbo.TenantAzureBoardsOutboundSettings
                           WHERE TenantId = @TenantId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        Row? row = await connection.QuerySingleOrDefaultAsync<Row>(
                new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: ct))
            .ConfigureAwait(false);

        if (row is null)
            return null;

        return new TenantAzureBoardsOutboundSettings
        {
            ProjectName = row.ProjectName.Trim(),
            DefaultWorkItemType = row.DefaultWorkItemType.Trim(),
            AreaPath = string.IsNullOrWhiteSpace(row.AreaPath) ? null : row.AreaPath.Trim(),
            IterationPath = string.IsNullOrWhiteSpace(row.IterationPath) ? null : row.IterationPath.Trim(),
            DefaultTags = string.IsNullOrWhiteSpace(row.DefaultTags) ? null : row.DefaultTags.Trim(),
            LastConnectionTestUtc = row.LastConnectionTestUtc,
            LastConnectionTestSummary = string.IsNullOrWhiteSpace(row.LastConnectionTestSummary)
                ? null
                : row.LastConnectionTestSummary.Trim(),
        };
    }

    private sealed class Row
    {
        public Guid TenantId
        {
            get;
            init;
        }

        public string ProjectName
        {
            get;
            init;
        } = "";

        public string DefaultWorkItemType
        {
            get;
            init;
        } = "";

        public string? AreaPath
        {
            get;
            init;
        }

        public string? IterationPath
        {
            get;
            init;
        }

        public string? DefaultTags
        {
            get;
            init;
        }

        public DateTime? LastConnectionTestUtc
        {
            get;
            init;
        }

        public string? LastConnectionTestSummary
        {
            get;
            init;
        }
    }
}
