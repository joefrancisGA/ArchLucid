using System.Data.Common;
using System.Globalization;

using ArchLucid.Core.Audit;
using ArchLucid.Host.Core.DataConsistency;

namespace ArchLucid.Api.Services.Admin;

/// <summary>
///     Static remediation definitions for orphan data-consistency repair endpoints.
/// </summary>
internal static class DataConsistencyRemediationDefinitions
{
    public static readonly DataConsistencyRemediationDefinition OrphanComparisonRecords = new(
        DataConsistencyOrphanRemediationSql.SelectOrphanComparisonRecordIds,
        AuditEventTypes.ComparisonRecordOrphansRemediated,
        "comparisonRecordIds",
        static reader => reader.GetString(0),
        DeleteOrphanComparisonRecordsAsync);

    public static readonly DataConsistencyRemediationDefinition OrphanGoldenManifests = new(
        DataConsistencyOrphanRemediationSql.SelectOrphanGoldenManifestIds,
        AuditEventTypes.GoldenManifestOrphansRemediated,
        "manifestIds",
        static reader => reader.GetGuid(0).ToString("D", CultureInfo.InvariantCulture),
        DeleteOrphanGoldenManifestsAsync);

    public static readonly DataConsistencyRemediationDefinition OrphanFindingsSnapshots = new(
        DataConsistencyOrphanRemediationSql.SelectOrphanFindingsSnapshotIds,
        AuditEventTypes.FindingsSnapshotOrphansRemediated,
        "findingsSnapshotIds",
        static reader => reader.GetGuid(0).ToString("D", CultureInfo.InvariantCulture),
        DeleteOrphanFindingsSnapshotsAsync);

    private static async Task<List<string>> DeleteOrphanComparisonRecordsAsync(
        DbConnection connection,
        DbTransaction transaction,
        IReadOnlyList<string> candidateIds,
        int cappedMaxRows,
        CancellationToken cancellationToken)
    {
        List<string> deletedIds = [];

        await using DbCommand deleteCommand = connection.CreateCommand();
        deleteCommand.Transaction = transaction;
        deleteCommand.CommandText = DataConsistencyOrphanRemediationSql.DeleteOrphanComparisonRecordsWithOutput;
        DataConsistencyRemediationSqlHelpers.AddMaxRowsParameter(deleteCommand, cappedMaxRows);

        await using DbDataReader reader = await deleteCommand.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))

            deletedIds.Add(reader.GetString(0));

        return deletedIds;
    }

    private static async Task<List<string>> DeleteOrphanGoldenManifestsAsync(
        DbConnection connection,
        DbTransaction transaction,
        IReadOnlyList<string> candidateIds,
        int _,
        CancellationToken cancellationToken)
    {
        List<string> deletedIds = [];

        foreach (string manifestId in candidateIds)
        {
            await using DbCommand bundleDelete = connection.CreateCommand();
            bundleDelete.Transaction = transaction;
            bundleDelete.CommandText = "DELETE FROM dbo.ArtifactBundles WHERE ManifestId = @ManifestId;";
            DbParameter manifestIdParameter = bundleDelete.CreateParameter();
            manifestIdParameter.ParameterName = "@ManifestId";
            manifestIdParameter.Value = Guid.Parse(manifestId, CultureInfo.InvariantCulture);
            bundleDelete.Parameters.Add(manifestIdParameter);
            await bundleDelete.ExecuteNonQueryAsync(cancellationToken);
        }

        foreach (string manifestId in candidateIds)
        {
            await using DbCommand deleteManifest = connection.CreateCommand();
            deleteManifest.Transaction = transaction;
            deleteManifest.CommandText = """
                                         DELETE FROM dbo.GoldenManifests
                                         OUTPUT deleted.ManifestId
                                         WHERE ManifestId = @ManifestId;
                                         """;
            DbParameter manifestIdParameter = deleteManifest.CreateParameter();
            manifestIdParameter.ParameterName = "@ManifestId";
            manifestIdParameter.Value = Guid.Parse(manifestId, CultureInfo.InvariantCulture);
            deleteManifest.Parameters.Add(manifestIdParameter);

            await using DbDataReader reader = await deleteManifest.ExecuteReaderAsync(cancellationToken);

            if (await reader.ReadAsync(cancellationToken))

                deletedIds.Add(reader.GetGuid(0).ToString("D", CultureInfo.InvariantCulture));
        }

        return deletedIds;
    }

    private static async Task<List<string>> DeleteOrphanFindingsSnapshotsAsync(
        DbConnection connection,
        DbTransaction transaction,
        IReadOnlyList<string> candidateIds,
        int _,
        CancellationToken cancellationToken)
    {
        List<string> deletedIds = [];

        foreach (string snapshotId in candidateIds)
        {
            await using DbCommand deleteSnapshot = connection.CreateCommand();
            deleteSnapshot.Transaction = transaction;
            deleteSnapshot.CommandText = """
                                           DELETE FROM dbo.FindingsSnapshots
                                           OUTPUT deleted.FindingsSnapshotId
                                           WHERE FindingsSnapshotId = @FindingsSnapshotId;
                                           """;
            DbParameter snapshotIdParameter = deleteSnapshot.CreateParameter();
            snapshotIdParameter.ParameterName = "@FindingsSnapshotId";
            snapshotIdParameter.Value = Guid.Parse(snapshotId, CultureInfo.InvariantCulture);
            deleteSnapshot.Parameters.Add(snapshotIdParameter);

            await using DbDataReader reader = await deleteSnapshot.ExecuteReaderAsync(cancellationToken);

            if (await reader.ReadAsync(cancellationToken))

                deletedIds.Add(reader.GetGuid(0).ToString("D", CultureInfo.InvariantCulture));
        }

        return deletedIds;
    }
}
