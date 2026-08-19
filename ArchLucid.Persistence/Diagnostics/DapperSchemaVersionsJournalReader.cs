using ArchLucid.Core.Diagnostics;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Diagnostics;

/// <summary>Reads DbUp <c>dbo.SchemaVersions</c> latest script for operator deployment-status.</summary>
public sealed class DapperSchemaVersionsJournalReader(ISqlConnectionFactory connectionFactory)
    : ISchemaVersionsJournalReader
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<SchemaVersionsJournalSnapshot> GetSnapshotAsync(CancellationToken cancellationToken)
    {
        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        const string sql = """
                           IF OBJECT_ID(N'dbo.SchemaVersions', N'U') IS NULL
                               SELECT CAST(-1 AS INT) AS AppliedCount, CAST(NULL AS NVARCHAR(512)) AS LatestScriptName;
                           ELSE
                               SELECT COUNT(*) AS AppliedCount,
                                      (SELECT TOP 1 ScriptName FROM dbo.SchemaVersions ORDER BY Applied DESC) AS LatestScriptName
                               FROM dbo.SchemaVersions;
                           """;

        JournalRow? row = await connection.QuerySingleOrDefaultAsync<JournalRow>(
            new CommandDefinition(sql, cancellationToken: cancellationToken)).ConfigureAwait(false);

        if (row is null || row.AppliedCount < 0)
            return new SchemaVersionsJournalSnapshot(TableMissing: true, AppliedCount: 0, LatestScriptName: null);

        return new SchemaVersionsJournalSnapshot(
            TableMissing: false,
            AppliedCount: row.AppliedCount,
            LatestScriptName: string.IsNullOrWhiteSpace(row.LatestScriptName) ? null : row.LatestScriptName.Trim());
    }

    private sealed class JournalRow
    {
        public int AppliedCount
        {
            get;
            init;
        }

        public string? LatestScriptName
        {
            get;
            init;
        }
    }
}
