using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Integrations;

[ExcludeFromCodeCoverage(Justification = "SQL integration; covered via API integration tests.")]
public sealed class SqlTenantItsmOutboundSettingsRepository(
    IBackgroundWorkerSqlConnectionFactory connectionFactory,
    SqlResilientOperationExecutor sqlOperations) : ITenantItsmOutboundSettingsRepository
{
    private readonly IBackgroundWorkerSqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly SqlResilientOperationExecutor _sqlOperations =
        sqlOperations ?? throw new ArgumentNullException(nameof(sqlOperations));

    public Task<TenantItsmOutboundSettings?> TryGetAsync(Guid tenantId, CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(cancellationToken => TryGetCoreAsync(tenantId, cancellationToken), ct);

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
