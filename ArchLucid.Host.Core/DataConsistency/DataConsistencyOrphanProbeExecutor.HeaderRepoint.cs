using System.Data.Common;
using System.Globalization;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Persistence;
using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Host.Core.DataConsistency;

public sealed partial class DataConsistencyOrphanProbeExecutor
{
    private async Task RunHeaderRepointProbesAsync(DbConnection connection, CancellationToken ct)
    {
        foreach (CommittedRunHeaderFkRepointRegistration registration in CommittedRunHeaderFkRepointRegistry.All)
        {
            string countSql = CommittedRunHeaderFkRepointProbeRegistry.ResolveCountSql(registration);

            await LogAndCountHeaderRepointsAsync(
                    connection,
                    countSql,
                    registration.PointerColumnName,
                    ct)
                .ConfigureAwait(false);
        }
    }

    private async Task LogAndCountHeaderRepointsAsync(
        DbConnection connection,
        string sql,
        string pointerColumnName,
        CancellationToken ct)
    {
        await using DbCommand command = connection.CreateCommand();
        command.CommandText = sql;
        object? scalar = await command.ExecuteScalarAsync(ct).ConfigureAwait(false);
        long count = scalar is long l ? l : Convert.ToInt64(scalar ?? 0L, CultureInfo.InvariantCulture);

        if (count <= 0)
            return;

        _logger.LogWarning(
            "Data consistency: {Count} committed run(s) have a dangling or cross-run header pointer ({PointerColumn}).",
            count,
            pointerColumnName);

        ArchLucidInstrumentation.DataConsistencyHeaderRepointsDetected.Add(
            count,
            new KeyValuePair<string, object?>("pointer", pointerColumnName));
    }
}
