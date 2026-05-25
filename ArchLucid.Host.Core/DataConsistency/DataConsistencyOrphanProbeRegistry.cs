using System.Reflection;

namespace ArchLucid.Host.Core.DataConsistency;

/// <summary>
///     Canonical orphan-probe coverage for <c>dbo.*</c> tables with <c>RunId</c> authority semantics.
///     CI architecture tests require every <c>FK_*_Runs_RunId</c> table in <c>ArchLucid.sql</c> to appear here.
/// </summary>
public static class DataConsistencyOrphanProbeRegistry
{
    public static IReadOnlyList<DataConsistencyOrphanProbeRegistration> All { get; } =
    [
        Background("GoldenManifests", "GoldenManifestsRunId"),
        Background("FindingsSnapshots", "FindingsSnapshotsRunId"),
        Background("ContextSnapshots", "ContextSnapshotsRunId"),
        Background("GraphSnapshots", "GraphSnapshotsRunId"),
        Background("ArtifactBundles", "ArtifactBundlesRunId"),
        OptOut(
            "DecisioningTraces",
            "RunId",
            "Archived with parent dbo.Runs batch; orphan drift is reconciled via run archival and admin reconciliation."),
        OptOut(
            "AgentTasks",
            "RunId",
            "Agent sub-entity purged via run lifecycle stored procedures; not independently background-probed."),
        OptOut(
            "AgentResults",
            "RunId",
            "Agent sub-entity purged via run lifecycle stored procedures; not independently background-probed."),
        OptOut(
            "DecisionTraces",
            "RunId",
            "Decision sub-entity purged via run lifecycle stored procedures; not independently background-probed."),
        OptOut(
            "AgentEvidencePackages",
            "RunId",
            "Agent sub-entity purged via run lifecycle stored procedures; not independently background-probed."),
        OptOut(
            "AgentExecutionTraces",
            "RunId",
            "Archived with parent dbo.Runs batch; leader-elected blob cleanup handles dangling trace blobs."),
        OptOut(
            "IntegrationEventOutbox",
            "RunId",
            "Transactional outbox rows are retried or dead-lettered independently of authority orphan probes."),
        OptOut(
            "RetrievalIndexingOutbox",
            "RunId",
            "Transactional outbox rows are retried or dead-lettered independently of authority orphan probes."),
        OptOut(
            "AuthorityPipelineWorkOutbox",
            "RunId",
            "Transactional outbox rows are retried or dead-lettered independently of authority orphan probes."),
        OptOut(
            "AlertRecords",
            "RunId",
            "Optional RunId correlation; alert lifecycle is separate from authority snapshot orphan probes."),
        OptOut(
            "AuditEvents",
            "RunId",
            "Append-only audit trail with optional RunId correlation; excluded from tenant hard purge."),
        OptOut(
            "RecommendationRecords",
            "RunId",
            "Optional RunId correlation; recommendation lifecycle is separate from authority orphan probes."),
        OptOut(
            "ArchitectureRunIdempotency",
            "RunId",
            "Idempotency ledger rows are purged with tenant hard purge and run lifecycle maintenance."),
        OptOut(
            "CommitRunIdempotency",
            "RunId",
            "Idempotency ledger rows are purged with tenant hard purge and run lifecycle maintenance."),
        OptOut(
            "ComparisonRecords",
            "LeftRunId",
            "LeftRunId/RightRunId are FK-backed UNIQUEIDENTIFIER columns (DbUp 137); simple RunId orphan probe does not apply."),
    ];

    public static IReadOnlyList<DataConsistencyOrphanProbeRegistration> BackgroundProbed { get; } =
        All.Where(static registration => registration.IsBackgroundProbed).ToArray();

    public static string ResolveBackgroundProbeCountSql(DataConsistencyOrphanProbeRegistration registration)
    {
        ArgumentNullException.ThrowIfNull(registration);

        if (!registration.IsBackgroundProbed)
        {
            throw new InvalidOperationException(
                $"Registration for dbo.{registration.TableName} is opt-out and has no background probe SQL.");
        }

        if (string.IsNullOrWhiteSpace(registration.SqlConstantName))
        {
            throw new InvalidOperationException(
                $"Registration for dbo.{registration.TableName} is missing {nameof(DataConsistencyOrphanProbeRegistration.SqlConstantName)}.");
        }

        FieldInfo? field = typeof(DataConsistencyOrphanProbeSql).GetField(
            registration.SqlConstantName,
            BindingFlags.Public | BindingFlags.Static);

        if (field is null || field.FieldType != typeof(string))
        {
            throw new InvalidOperationException(
                $"Expected public const string {registration.SqlConstantName} on {nameof(DataConsistencyOrphanProbeSql)}.");
        }

        string? sql = field.GetValue(null) as string;

        if (string.IsNullOrWhiteSpace(sql))
        {
            throw new InvalidOperationException(
                $"Probe SQL constant {registration.SqlConstantName} must be non-empty.");
        }

        return sql;
    }

    private static DataConsistencyOrphanProbeRegistration Background(string tableName, string sqlConstantName)
    {
        return new DataConsistencyOrphanProbeRegistration(
            tableName,
            "RunId",
            IsBackgroundProbed: true,
            SqlConstantName: sqlConstantName);
    }

    private static DataConsistencyOrphanProbeRegistration OptOut(
        string tableName,
        string columnName,
        string rationale)
    {
        return new DataConsistencyOrphanProbeRegistration(
            tableName,
            columnName,
            IsBackgroundProbed: false,
            OptOutRationale: rationale);
    }
}
