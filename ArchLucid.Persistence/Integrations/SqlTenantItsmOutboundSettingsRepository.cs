using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Integrations;

/// <summary>
///     Tenant-catalog ITSM outbound overrides. Must use <see cref="ISqlConnectionFactory"/> (scoped tenant routing),
///     not <see cref="IBackgroundWorkerSqlConnectionFactory"/> (primary/system catalog) — otherwise
///     <c>SystemWithPerTenantCatalogs</c> hosts return SQL 208 / “Database Query Failed” on ServiceNow/Jira settings + health (TB-867 / PD-002).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL integration; covered via API integration tests.")]
public sealed class SqlTenantItsmOutboundSettingsRepository(
    ISqlConnectionFactory connectionFactory,
    SqlResilientOperationExecutor sqlOperations) : ITenantItsmOutboundSettingsRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly SqlResilientOperationExecutor _sqlOperations =
        sqlOperations ?? throw new ArgumentNullException(nameof(sqlOperations));

    public Task<TenantItsmOutboundSettings?> TryGetAsync(Guid tenantId, CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(cancellationToken => TryGetCoreAsync(tenantId, cancellationToken), ct);

    public Task<TenantItsmOutboundSettings> UpsertAsync(Guid tenantId, TenantItsmOutboundSettings settings, CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(cancellationToken => UpsertCoreAsync(tenantId, settings, cancellationToken), ct);

    private async Task<TenantItsmOutboundSettings> UpsertCoreAsync(
        Guid tenantId,
        TenantItsmOutboundSettings settings,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        ArgumentNullException.ThrowIfNull(settings);

        const string sql = """
                           MERGE dbo.TenantItsmOutboundSettings AS target
                           USING (SELECT @TenantId AS TenantId) AS source
                           ON target.TenantId = source.TenantId
                           WHEN MATCHED THEN
                               UPDATE SET
                                   JiraProjectKeyOverride = @JiraProjectKeyOverride,
                                   JiraSendInfoSeverity = @JiraSendInfoSeverity,
                                   JiraIssueTypeBySeverityJson = @JiraIssueTypeBySeverityJson,
                                   ServiceNowAutoCreateCmdbCi = @ServiceNowAutoCreateCmdbCi
                           WHEN NOT MATCHED THEN
                               INSERT (TenantId, JiraProjectKeyOverride, JiraSendInfoSeverity, JiraIssueTypeBySeverityJson, ServiceNowAutoCreateCmdbCi)
                               VALUES (@TenantId, @JiraProjectKeyOverride, @JiraSendInfoSeverity, @JiraIssueTypeBySeverityJson, @ServiceNowAutoCreateCmdbCi);
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        _ = await connection.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        TenantId = tenantId,
                        JiraProjectKeyOverride = settings.JiraProjectKeyOverride,
                        JiraSendInfoSeverity = settings.JiraSendInfoSeverity,
                        JiraIssueTypeBySeverityJson = settings.JiraIssueTypeBySeverityJson,
                        ServiceNowAutoCreateCmdbCi = settings.ServiceNowAutoCreateCmdbCi,
                    },
                    cancellationToken: ct))
            .ConfigureAwait(false);

        TenantItsmOutboundSettings? saved = await TryGetCoreAsync(tenantId, ct).ConfigureAwait(false);

        return saved ?? settings;
    }

    private async Task<TenantItsmOutboundSettings?> TryGetCoreAsync(Guid tenantId, CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        const string sql = """
                           SELECT TenantId,
                                  JiraProjectKeyOverride,
                                  JiraSendInfoSeverity,
                                  JiraIssueTypeBySeverityJson,
                                  ServiceNowAutoCreateCmdbCi
                           FROM dbo.TenantItsmOutboundSettings
                           WHERE TenantId = @TenantId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        Row? row = await connection.QuerySingleOrDefaultAsync<Row>(
                new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: ct))
            .ConfigureAwait(false);

        if (row is null)
            return null;

        return new TenantItsmOutboundSettings
        {
            JiraProjectKeyOverride = string.IsNullOrWhiteSpace(row.JiraProjectKeyOverride)
                ? null
                : row.JiraProjectKeyOverride.Trim(),
            JiraSendInfoSeverity = row.JiraSendInfoSeverity,
            JiraIssueTypeBySeverityJson = string.IsNullOrWhiteSpace(row.JiraIssueTypeBySeverityJson)
                ? null
                : row.JiraIssueTypeBySeverityJson.Trim(),
            ServiceNowAutoCreateCmdbCi = row.ServiceNowAutoCreateCmdbCi
        };
    }

    private sealed class Row
    {
        public Guid TenantId
        {
            get;
            init;
        }

        public string? JiraProjectKeyOverride
        {
            get;
            init;
        }

        public bool JiraSendInfoSeverity
        {
            get;
            init;
        }

        public string? JiraIssueTypeBySeverityJson
        {
            get;
            init;
        }

        public bool ServiceNowAutoCreateCmdbCi
        {
            get;
            init;
        }
    }
}
