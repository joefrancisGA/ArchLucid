using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Persistence;
using ArchLucid.Core.Runs.Finalization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

/// <inheritdoc cref="IManifestFinalizationSqlRepository" />
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class SqlManifestFinalizationRepository : IManifestFinalizationSqlRepository
{
    /// <summary>
    ///     Bounded command timeout (well under the ADO.NET 30s default) for the two SQL calls made while this
    ///     transaction holds the <c>dbo.Runs</c> row lock (<see cref="LockRunForFinalizationAsync"/> and
    ///     <see cref="ExecuteFinalizeProcedureAsync"/>). A contended/wedged lock now fails fast so
    ///     <c>AuthorityDrivenArchitectureRunCommitOrchestrator</c>'s bounded transient-retry budget is reached
    ///     quickly rather than each of its attempts silently burning the full default timeout.
    /// </summary>
    private const int FinalizationCommandTimeoutSeconds = 10;

    /// <inheritdoc />
    public async Task<ManifestFinalizationLockedRunRow?> LockRunForFinalizationAsync(
        ScopeContext scope,
        Guid runId,
        IDbConnection connection,
        IDbTransaction transaction,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(transaction);

        const string lockSql = """
                               SELECT LegacyRunStatus,
                                      GoldenManifestId,
                                      CurrentManifestVersion,
                                      FindingsSnapshotId,
                                      ArtifactBundleId,
                                      RowVersionStamp
                               FROM dbo.Runs WITH (UPDLOCK, ROWLOCK)
                               WHERE RunId = @RunId
                                 AND TenantId = @TenantId
                                 AND WorkspaceId = @WorkspaceId
                                 AND ScopeProjectId = @ScopeProjectId
                                 AND ArchivedUtc IS NULL;
                               """;

        return await connection.QuerySingleOrDefaultAsync<ManifestFinalizationLockedRunRow>(
            new CommandDefinition(
                lockSql,
                new
                {
                    RunId = runId,
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId
                },
                transaction,
                commandTimeout: FinalizationCommandTimeoutSeconds,
                cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task ExecuteFinalizeProcedureAsync(
        ManifestFinalizationProcedureRequest request,
        IDbConnection connection,
        IDbTransaction transaction,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(transaction);

        DynamicParameters sp = new();
        sp.Add("@TenantId", request.TenantId);
        sp.Add("@WorkspaceId", request.WorkspaceId);
        sp.Add("@ScopeProjectId", request.ScopeProjectId);
        sp.Add("@RunId", request.RunId);
        sp.Add("@ExpectedFindingsSnapshotId", request.ExpectedFindingsSnapshotId);
        sp.Add("@ExpectedArtifactBundleId", request.ExpectedArtifactBundleId);
        sp.Add("@ManifestId", request.ManifestId);
        sp.Add("@DecisionTraceId", request.DecisionTraceId);
        sp.Add("@ManifestVersion", request.ManifestVersion);
        sp.Add("@ExpectedRowVersion", request.ExpectedRowVersion);
        sp.Add("@ActorUserId", request.ActorUserId);
        sp.Add("@ActorUserName", request.ActorUserName);
        sp.Add("@AuditEventId", request.AuditEventId);
        sp.Add("@OccurredUtc", request.OccurredUtc);
        sp.Add("@AuditDataJson", request.AuditDataJson);
        sp.Add("@CorrelationId", request.CorrelationId);
        sp.Add("@OutboxId", request.OutboxId);
        sp.Add("@IntegrationEventType", request.IntegrationEventType);
        sp.Add("@OutboxMessageId", request.OutboxMessageId);
        sp.Add("@OutboxPayloadUtf8", request.OutboxPayloadUtf8);
        sp.Add("@OutboxPriority", request.OutboxPriority);

        try
        {
            await connection.ExecuteAsync(
                new CommandDefinition(
                    "dbo.sp_FinalizeManifest",
                    sp,
                    transaction,
                    commandTimeout: FinalizationCommandTimeoutSeconds,
                    commandType: CommandType.StoredProcedure,
                    cancellationToken: cancellationToken));
        }
        catch (SqlException ex)
        {
            throw MapSqlException(ex, request.RunId);
        }
    }

    internal static Exception MapSqlException(SqlException ex, Guid runId)
    {
        if (ex.Number == CommittedRunHeaderAnchorRegistry.TriggerErrorNumber)
            return new RunEvidenceAnchorImmutableException(runId);

        if (!Enum.IsDefined(typeof(ManifestFinalizationFaultKind), ex.Number))
            return ex;

        ManifestFinalizationFaultKind kind = (ManifestFinalizationFaultKind)ex.Number;

        return new ManifestFinalizationFaultException(kind, runId, ex.Message, ex);
    }
}
