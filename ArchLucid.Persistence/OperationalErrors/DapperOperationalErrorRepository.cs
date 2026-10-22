using System.Text;

using ArchLucid.Core.OperationalErrors;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.OperationalErrors;

public sealed class DapperOperationalErrorRepository(
    ISqlConnectionFactory connectionFactory,
    IReadOnlyDbConnectionFactory readConnectionFactory) : IOperationalErrorRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly IReadOnlyDbConnectionFactory _readConnectionFactory =
        readConnectionFactory ?? throw new ArgumentNullException(nameof(readConnectionFactory));

    public async Task AppendAsync(OperationalErrorRecord record, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                OperationalErrorSql.Append,
                record,
                commandTimeout: 30,
                cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<OperationalErrorRecord>> SearchAsync(
        OperationalErrorSearchCriteria criteria,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(criteria);

        StringBuilder sql = new("""
                                SELECT TOP (@MaxRows)
                                    Id, OccurredUtc, Source, Category,
                                    HttpStatusCode, HttpMethod, RequestPath, ProblemType,
                                    ExceptionType, Message, StackTrace,
                                    SqlErrorNumber, SqlErrorState,
                                    CorrelationId, OtelTraceId,
                                    TenantId, WorkspaceId, ProjectId, ActorUserId,
                                    DetailJson
                                FROM dbo.PlatformOperationalErrors
                                WHERE 1 = 1
                                """);

        DynamicParameters parameters = new();
        parameters.Add("MaxRows", criteria.MaxRows);

        if (criteria.FromUtc is not null)
        {
            sql.Append(" AND OccurredUtc >= @FromUtc");
            parameters.Add("FromUtc", criteria.FromUtc.Value);
        }

        if (criteria.ToUtc is not null)
        {
            sql.Append(" AND OccurredUtc < @ToUtc");
            parameters.Add("ToUtc", criteria.ToUtc.Value);
        }

        if (!string.IsNullOrWhiteSpace(criteria.Category))
        {
            sql.Append(" AND Category = @Category");
            parameters.Add("Category", criteria.Category.Trim());
        }

        if (!string.IsNullOrWhiteSpace(criteria.Source))
        {
            sql.Append(" AND Source = @Source");
            parameters.Add("Source", criteria.Source.Trim());
        }

        if (criteria.MinStatusCode is not null)
        {
            sql.Append(" AND HttpStatusCode >= @MinStatusCode");
            parameters.Add("MinStatusCode", criteria.MinStatusCode.Value);
        }

        if (criteria.TenantId is not null)
        {
            sql.Append(" AND TenantId = @TenantId");
            parameters.Add("TenantId", criteria.TenantId.Value);
        }

        if (!string.IsNullOrWhiteSpace(criteria.CorrelationId))
        {
            sql.Append(" AND CorrelationId = @CorrelationId");
            parameters.Add("CorrelationId", criteria.CorrelationId.Trim());
        }

        if (!string.IsNullOrWhiteSpace(criteria.Search))
        {
            sql.Append(" AND (Message LIKE @Search OR RequestPath LIKE @Search)");
            parameters.Add("Search", $"%{criteria.Search.Trim()}%");
        }

        sql.Append(" ORDER BY OccurredUtc DESC");

        await using SqlConnection connection =
            await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<OperationalErrorRecord> rows = await connection.QueryAsync<OperationalErrorRecord>(
            new CommandDefinition(
                sql.ToString(),
                parameters,
                commandTimeout: 30,
                cancellationToken: cancellationToken));

        return rows.ToList();
    }

    public async Task<OperationalErrorRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        await using SqlConnection connection =
            await _readConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<OperationalErrorRecord>(
            new CommandDefinition(
                OperationalErrorSql.GetById,
                new { Id = id },
                commandTimeout: 30,
                cancellationToken: cancellationToken));
    }

    public async Task<int> DeleteOlderThanAsync(DateTime cutoffUtc, int maxRows, CancellationToken cancellationToken)
    {
        if (maxRows < 1)
            throw new ArgumentOutOfRangeException(nameof(maxRows));

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.ExecuteAsync(
            new CommandDefinition(
                OperationalErrorSql.DeleteOlderThan,
                new { CutoffUtc = cutoffUtc, MaxRows = maxRows },
                commandTimeout: 120,
                cancellationToken: cancellationToken));
    }
}
