using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Telemetry;

[ExcludeFromCodeCoverage(Justification = "SQL integration; archival exercised operationally.")]
public sealed class SqlFirstTenantFunnelArchivalBatchStore(SqlConnectionFactory connectionFactory)
    : IFirstTenantFunnelArchivalBatchStore
{
    private readonly SqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<IReadOnlyList<FirstTenantFunnelArchiveRow>> TakeRowsOlderThanAsync(
        int retentionDays,
        int maxRows,
        CancellationToken ct)
    {
        if (retentionDays <= 0)

            throw new ArgumentOutOfRangeException(nameof(retentionDays));

        if (maxRows <= 0)

            throw new ArgumentOutOfRangeException(nameof(maxRows));

        const string sql = """
                           SELECT TOP (@Take) EventId, TenantId, EventName, OccurredUtc
                           FROM dbo.FirstTenantFunnelEvents
                           WHERE OccurredUtc < DATEADD(day, -@RetentionDays, SYSUTCDATETIME())
                           ORDER BY EventId ASC;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition cmd = new(
            sql,
            new { Take = maxRows, RetentionDays = retentionDays },
            cancellationToken: ct);

        IReadOnlyList<FirstTenantFunnelArchiveRow> rows =
            (await connection.QueryAsync<FirstTenantFunnelArchiveRow>(cmd).ConfigureAwait(false)).AsList();

        return rows;
    }

    /// <inheritdoc />
    public async Task DeleteByEventIdsAsync(IReadOnlyList<long> eventIds, CancellationToken ct)
    {
        if (eventIds is null) throw new ArgumentNullException(nameof(eventIds));

        if (eventIds.Count == 0)

            return;

        const string sql = """
                           DELETE FROM dbo.FirstTenantFunnelEvents
                           WHERE EventId IN @Ids;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition cmd = new(sql, new { Ids = eventIds }, cancellationToken: ct);

        await connection.ExecuteAsync(cmd).ConfigureAwait(false);
    }
}
