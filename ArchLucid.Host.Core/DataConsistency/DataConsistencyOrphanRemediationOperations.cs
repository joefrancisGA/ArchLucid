using System.Data.Common;
using System.Globalization;

using ArchLucid.Core.Audit;

namespace ArchLucid.Host.Core.DataConsistency;

/// <summary>Transactional delete strategies for orphan remediation definitions.</summary>
internal static class DataConsistencyOrphanRemediationOperations
{
    internal static async Task<List<string>> DeleteOrphanComparisonRecordsAsync(
        DbConnection connection,
        DbTransaction transaction,
        int capped,
        IReadOnlyList<string> candidateIds,
        CancellationToken cancellationToken)
    {
        _ = candidateIds;

        List<string> deletedIds = [];

        await using DbCommand deleteCommand = connection.CreateCommand();
        deleteCommand.Transaction = transaction;
        deleteCommand.CommandText = DataConsistencyOrphanRemediationSql.DeleteOrphanComparisonRecordsWithOutput;
        DataConsistencyRemediationSqlCommandHelpers.AddMaxRowsParameter(deleteCommand, capped);

        await using DbDataReader reader =
            await deleteCommand.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);

        while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            deletedIds.Add(reader.GetString(0));

        return deletedIds;
    }

    internal static async Task<List<string>> DeleteOrphanGoldenManifestsAsync(
        DbConnection connection,
        DbTransaction transaction,
        int capped,
        IReadOnlyList<string> candidateIds,
        CancellationToken cancellationToken)
    {
        _ = capped;

        List<string> deletedIds = [];

        foreach (string manifestId in candidateIds)
        {
            Guid manifestGuid = Guid.Parse(manifestId, CultureInfo.InvariantCulture);

            await using (DbCommand bundleDelete = connection.CreateCommand())
            {
                bundleDelete.Transaction = transaction;
                bundleDelete.CommandText = DataConsistencyOrphanRemediationSql.DeleteArtifactBundlesByManifestId;
                AddGuidParameter(bundleDelete, "@ManifestId", manifestGuid);
                await bundleDelete.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
            }

            string? deletedId = await DeleteSingleRowWithGuidOutputAsync(
                connection,
                transaction,
                DataConsistencyOrphanRemediationSql.DeleteGoldenManifestByManifestIdWithOutput,
                "@ManifestId",
                manifestGuid,
                cancellationToken).ConfigureAwait(false);

            if (deletedId is not null)
                deletedIds.Add(deletedId);
        }

        return deletedIds;
    }

    internal static async Task<List<string>> DeleteOrphanFindingsSnapshotsAsync(
        DbConnection connection,
        DbTransaction transaction,
        int capped,
        IReadOnlyList<string> candidateIds,
        CancellationToken cancellationToken)
    {
        _ = capped;

        List<string> deletedIds = [];

        foreach (string snapshotId in candidateIds)
        {
            Guid snapshotGuid = Guid.Parse(snapshotId, CultureInfo.InvariantCulture);

            string? deletedId = await DeleteSingleRowWithGuidOutputAsync(
                connection,
                transaction,
                DataConsistencyOrphanRemediationSql.DeleteFindingsSnapshotByIdWithOutput,
                "@FindingsSnapshotId",
                snapshotGuid,
                cancellationToken).ConfigureAwait(false);

            if (deletedId is not null)
                deletedIds.Add(deletedId);
        }

        return deletedIds;
    }

    private static async Task<string?> DeleteSingleRowWithGuidOutputAsync(
        DbConnection connection,
        DbTransaction transaction,
        string sql,
        string parameterName,
        Guid id,
        CancellationToken cancellationToken)
    {
        await using DbCommand command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = sql;
        AddGuidParameter(command, parameterName, id);

        await using DbDataReader reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);

        if (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            return reader.GetGuid(0).ToString("D", CultureInfo.InvariantCulture);

        return null;
    }

    private static void AddGuidParameter(DbCommand command, string parameterName, Guid value)
    {
        DbParameter parameter = command.CreateParameter();
        parameter.ParameterName = parameterName;
        parameter.Value = value;
        command.Parameters.Add(parameter);
    }
}
