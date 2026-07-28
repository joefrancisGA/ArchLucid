using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Findings;

/// <summary>
///     Probes <c>dbo.FindingRecords</c> for TB-382 insight-density columns (migration 255). Reads avoid
///     selecting columns that are not present so partially migrated databases do not throw SQL 207.
/// </summary>
internal static class FindingRecordsSchemaCapabilities
{
    private static int _insightDensityColumnsPresent = -1;

    internal static async Task<bool> HasInsightDensityColumnsAsync(SqlConnection connection, CancellationToken ct)
    {
        if (_insightDensityColumnsPresent >= 0)
            return _insightDensityColumnsPresent == 1;

        const string sql = """
                           SELECT CASE
                               WHEN COL_LENGTH(N'dbo.FindingRecords', N'InsightDensityScore') IS NOT NULL THEN 1
                               ELSE 0
                           END;
                           """;

        int flag = await connection.ExecuteScalarAsync<int>(new CommandDefinition(sql, cancellationToken: ct));
        _insightDensityColumnsPresent = flag;

        return flag == 1;
    }
}
