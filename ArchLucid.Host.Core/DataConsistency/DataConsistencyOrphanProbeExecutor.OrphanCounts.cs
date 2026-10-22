using System.Data.Common;
using System.Globalization;

using ArchLucid.Core.Diagnostics;

namespace ArchLucid.Host.Core.DataConsistency;

public sealed partial class DataConsistencyOrphanProbeExecutor
{
    private async Task<long> LogAndCountOrphansAsync(
        DbConnection connection,
        string sql,
        string tableMetricLabel,
        string columnLabel,
        CancellationToken ct)
    {
        await using DbCommand command = connection.CreateCommand();
        command.CommandText = sql;
        object? scalar = await command.ExecuteScalarAsync(ct).ConfigureAwait(false);
        long count = scalar is long l ? l : Convert.ToInt64(scalar ?? 0L, CultureInfo.InvariantCulture);

        if (count <= 0)
            return count;

        _logger.LogWarning(
            "Data consistency: {Count} row(s) in {Table} reference a missing authority RunId ({Column}).",
            count,
            tableMetricLabel,
            columnLabel);

        ArchLucidInstrumentation.DataConsistencyOrphansDetected.Add(
            count,
            new KeyValuePair<string, object?>("table", tableMetricLabel),
            new KeyValuePair<string, object?>("column", columnLabel));

        return count;
    }
}
