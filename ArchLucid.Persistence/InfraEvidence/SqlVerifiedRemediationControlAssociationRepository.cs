using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlVerifiedRemediationControlAssociationRepository(ISqlConnectionFactory connectionFactory)
    : IVerifiedRemediationControlAssociationRepository
{
    public async Task<VerifiedRemediationControlAssociationRecord> UpsertAsync(
        ProjectScopeKey scope,
        VerifiedRemediationControlAssociationRecord record,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(record);
        ArgumentNullException.ThrowIfNull(connectionFactory);
        VerifiedRemediationControlAssociationRules.EnsureWritable(scope, record);

        const string sql = """
            MERGE dbo.VerifiedRemediationControlAssociations AS target
            USING (
                SELECT
                    @TenantId AS TenantId,
                    @InstanceId AS InstanceId,
                    @VerificationSnapshotId AS VerificationSnapshotId,
                    @ControlId AS ControlId
            ) AS source
            ON target.TenantId = source.TenantId
               AND target.InstanceId = source.InstanceId
               AND target.VerificationSnapshotId = source.VerificationSnapshotId
               AND target.ControlId = source.ControlId
            WHEN MATCHED THEN
                UPDATE SET UpdatedUtc = @UpdatedUtc
            WHEN NOT MATCHED THEN
                INSERT (
                    AssociationId, TenantId, WorkspaceId, ProjectId, InstanceId,
                    VerificationSnapshotId, ControlId, AssessmentId, CreatedUtc, UpdatedUtc)
                VALUES (
                    @AssociationId, @TenantId, @WorkspaceId, @ProjectId, @InstanceId,
                    @VerificationSnapshotId, @ControlId, @AssessmentId, @CreatedUtc, @UpdatedUtc)
            OUTPUT
                inserted.AssociationId,
                inserted.TenantId,
                inserted.WorkspaceId,
                inserted.ProjectId,
                inserted.InstanceId,
                inserted.VerificationSnapshotId,
                inserted.ControlId,
                inserted.AssessmentId,
                inserted.CreatedUtc,
                inserted.UpdatedUtc;
            """;

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.QuerySingleAsync<VerifiedRemediationControlAssociationRecord>(
            new CommandDefinition(sql, record, cancellationToken: cancellationToken));
    }

    public async Task<VerifiedRemediationControlAssociationRecord?> TryGetAsync(
        ProjectScopeKey scope,
        Guid associationId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(connectionFactory);

        const string sql = """
            SELECT AssociationId, TenantId, WorkspaceId, ProjectId, InstanceId,
                   VerificationSnapshotId, ControlId, AssessmentId, CreatedUtc, UpdatedUtc
            FROM dbo.VerifiedRemediationControlAssociations
            WHERE AssociationId = @AssociationId
              AND TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId;
            """;

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<VerifiedRemediationControlAssociationRecord>(
            new CommandDefinition(
                sql,
                new
                {
                    AssociationId = associationId,
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                },
                cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<VerifiedRemediationControlAssociationRecord>> ListByInstanceAsync(
        ProjectScopeKey scope,
        Guid instanceId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(connectionFactory);

        const string sql = """
            SELECT AssociationId, TenantId, WorkspaceId, ProjectId, InstanceId,
                   VerificationSnapshotId, ControlId, AssessmentId, CreatedUtc, UpdatedUtc
            FROM dbo.VerifiedRemediationControlAssociations
            WHERE InstanceId = @InstanceId
              AND TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
            ORDER BY UpdatedUtc DESC, AssociationId;
            """;

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<VerifiedRemediationControlAssociationRecord> rows =
            await connection.QueryAsync<VerifiedRemediationControlAssociationRecord>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        InstanceId = instanceId,
                        scope.TenantId,
                        scope.WorkspaceId,
                        scope.ProjectId,
                    },
                    cancellationToken: cancellationToken));

        return rows.ToArray();
    }

    public async Task<IReadOnlyList<VerifiedRemediationControlAssociationRecord>> ListByControlAndVerificationSnapshotIdsAsync(
        ProjectScopeKey scope,
        Guid controlId,
        IReadOnlyList<Guid> verificationSnapshotIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(verificationSnapshotIds);
        ArgumentNullException.ThrowIfNull(connectionFactory);

        if (controlId == Guid.Empty || verificationSnapshotIds.Count == 0)
        {
            return [];
        }

        Guid[] linkedSnapshotIds = verificationSnapshotIds
            .Where(candidate => candidate != Guid.Empty)
            .Distinct()
            .ToArray();

        if (linkedSnapshotIds.Length == 0)
        {
            return [];
        }

        const string sql = """
            SELECT AssociationId, TenantId, WorkspaceId, ProjectId, InstanceId,
                   VerificationSnapshotId, ControlId, AssessmentId, CreatedUtc, UpdatedUtc
            FROM dbo.VerifiedRemediationControlAssociations
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
              AND ControlId = @ControlId
              AND VerificationSnapshotId IN @VerificationSnapshotIds
            ORDER BY UpdatedUtc DESC, AssociationId;
            """;

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<VerifiedRemediationControlAssociationRecord> rows =
            await connection.QueryAsync<VerifiedRemediationControlAssociationRecord>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        scope.TenantId,
                        scope.WorkspaceId,
                        scope.ProjectId,
                        ControlId = controlId,
                        VerificationSnapshotIds = linkedSnapshotIds,
                    },
                    cancellationToken: cancellationToken));

        return rows.ToArray();
    }
}
