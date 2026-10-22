using System.Globalization;

using ArchLucid.Core.Audit;

namespace ArchLucid.Host.Core.DataConsistency;

/// <summary>
///     Operator-initiated orphan remediation definitions for <see cref="IDataConsistencyRemediationExecutor" />.
/// </summary>
public static class DataConsistencyOrphanRemediationRegistry
{
    /// <summary>Orphan <c>dbo.ComparisonRecords</c> (historical no-op select/delete retained for stable admin shapes).</summary>
    public static DataConsistencyRemediationDefinition ComparisonRecords { get; } = new()
    {
        SelectCandidateIdsSql = DataConsistencyOrphanRemediationSql.SelectOrphanComparisonRecordIds,
        ReadCandidateId = static reader => reader.GetString(0),
        ExecuteTransactionalDeletes = DataConsistencyOrphanRemediationOperations.DeleteOrphanComparisonRecordsAsync,
        AuditEventType = AuditEventTypes.ComparisonRecordOrphansRemediated,
        BuildAuditPayload = static deletedIds => new
        {
            dryRun = false,
            deletedCount = deletedIds.Count,
            comparisonRecordIds = deletedIds
        }
    };

    /// <summary>Orphan <c>dbo.GoldenManifests</c> (deletes <c>dbo.ArtifactBundles</c> first).</summary>
    public static DataConsistencyRemediationDefinition GoldenManifests { get; } = new()
    {
        SelectCandidateIdsSql = DataConsistencyOrphanRemediationSql.SelectOrphanGoldenManifestIds,
        ReadCandidateId = static reader => reader.GetGuid(0).ToString("D", CultureInfo.InvariantCulture),
        ExecuteTransactionalDeletes = DataConsistencyOrphanRemediationOperations.DeleteOrphanGoldenManifestsAsync,
        AuditEventType = AuditEventTypes.GoldenManifestOrphansRemediated,
        BuildAuditPayload = static deletedIds => new
        {
            dryRun = false,
            deletedCount = deletedIds.Count,
            manifestIds = deletedIds
        }
    };

    /// <summary>Orphan <c>dbo.FindingsSnapshots</c> not referenced by golden manifests.</summary>
    public static DataConsistencyRemediationDefinition FindingsSnapshots { get; } = new()
    {
        SelectCandidateIdsSql = DataConsistencyOrphanRemediationSql.SelectOrphanFindingsSnapshotIds,
        ReadCandidateId = static reader => reader.GetGuid(0).ToString("D", CultureInfo.InvariantCulture),
        ExecuteTransactionalDeletes = DataConsistencyOrphanRemediationOperations.DeleteOrphanFindingsSnapshotsAsync,
        AuditEventType = AuditEventTypes.FindingsSnapshotOrphansRemediated,
        BuildAuditPayload = static deletedIds => new
        {
            dryRun = false,
            deletedCount = deletedIds.Count,
            findingsSnapshotIds = deletedIds
        }
    };
}
