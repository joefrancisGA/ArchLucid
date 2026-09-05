using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlRemediationInstanceRepository(ISqlConnectionFactory connectionFactory)
    : IRemediationInstanceRepository
{
    public async Task InsertInstanceAsync(RemediationInstanceRecord instance, CancellationToken cancellationToken = default)
    {
        const string sql = """
                           INSERT INTO dbo.RemediationInstances
                               (InstanceId, TenantId, WorkspaceId, ProjectId, FindingId, PatternId, PatternVersionId,
                                PatternKey, FrozenPatternVersion, AutomationLevel, Status, CloudResourceId, AssessmentId,
                                ControlId, PreflightSnapshotId, ExecutionSnapshotId, VerificationSnapshotId, WaveId,
                                PreflightResultJson, VerificationResultJson, CreatedByActorKey, ApprovedByActorKey,
                                CreatedUtc, UpdatedUtc, ApprovedUtc, ExecutedUtc, VerifiedUtc, ClosedUtc)
                           VALUES
                               (@InstanceId, @TenantId, @WorkspaceId, @ProjectId, @FindingId, @PatternId, @PatternVersionId,
                                @PatternKey, @FrozenPatternVersion, @AutomationLevel, @Status, @CloudResourceId, @AssessmentId,
                                @ControlId, @PreflightSnapshotId, @ExecutionSnapshotId, @VerificationSnapshotId, @WaveId,
                                @PreflightResultJson, @VerificationResultJson, @CreatedByActorKey, @ApprovedByActorKey,
                                @CreatedUtc, @UpdatedUtc, @ApprovedUtc, @ExecutedUtc, @VerifiedUtc, @ClosedUtc);
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(sql, MapInstanceParameters(instance), cancellationToken: cancellationToken));
    }

    public async Task UpdateInstanceAsync(RemediationInstanceRecord instance, CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE dbo.RemediationInstances
                           SET Status = @Status,
                               CloudResourceId = @CloudResourceId,
                               AssessmentId = @AssessmentId,
                               ControlId = @ControlId,
                               PreflightSnapshotId = @PreflightSnapshotId,
                               ExecutionSnapshotId = @ExecutionSnapshotId,
                               VerificationSnapshotId = @VerificationSnapshotId,
                               WaveId = @WaveId,
                               PreflightResultJson = @PreflightResultJson,
                               VerificationResultJson = @VerificationResultJson,
                               ApprovedByActorKey = @ApprovedByActorKey,
                               UpdatedUtc = @UpdatedUtc,
                               ApprovedUtc = @ApprovedUtc,
                               ExecutedUtc = @ExecutedUtc,
                               VerifiedUtc = @VerifiedUtc,
                               ClosedUtc = @ClosedUtc
                           WHERE TenantId = @TenantId AND InstanceId = @InstanceId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(sql, MapInstanceParameters(instance), cancellationToken: cancellationToken));
    }

    public async Task<RemediationInstanceRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid instanceId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT InstanceId, TenantId, WorkspaceId, ProjectId, FindingId, PatternId, PatternVersionId,
                                  PatternKey, FrozenPatternVersion, AutomationLevel, Status, CloudResourceId, AssessmentId,
                                  ControlId, PreflightSnapshotId, ExecutionSnapshotId, VerificationSnapshotId, WaveId,
                                  PreflightResultJson, VerificationResultJson, CreatedByActorKey, ApprovedByActorKey,
                                  CreatedUtc, UpdatedUtc, ApprovedUtc, ExecutedUtc, VerifiedUtc, ClosedUtc
                           FROM dbo.RemediationInstances
                           WHERE TenantId = @TenantId AND InstanceId = @InstanceId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        InstanceRow? row = await conn.QuerySingleOrDefaultAsync<InstanceRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, InstanceId = instanceId },
                cancellationToken: cancellationToken));

        return row is null ? null : MapInstance(row);
    }

    public async Task InsertEvidenceAsync(RemediationEvidenceRecord evidence, CancellationToken cancellationToken = default)
    {
        const string sql = """
                           INSERT INTO dbo.RemediationEvidence
                               (EvidenceId, InstanceId, TenantId, Phase, PayloadJson, ActorKey, CorrelationId, CreatedUtc)
                           VALUES
                               (@EvidenceId, @InstanceId, @TenantId, @Phase, @PayloadJson, @ActorKey, @CorrelationId, @CreatedUtc);
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    evidence.EvidenceId,
                    evidence.InstanceId,
                    evidence.TenantId,
                    Phase = (int)evidence.Phase,
                    evidence.PayloadJson,
                    evidence.ActorKey,
                    evidence.CorrelationId,
                    evidence.CreatedUtc,
                },
                cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<RemediationEvidenceRecord>> ListEvidenceByInstanceAsync(
        Guid tenantId,
        Guid instanceId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT EvidenceId, InstanceId, TenantId, Phase, PayloadJson, ActorKey, CorrelationId, CreatedUtc
                           FROM dbo.RemediationEvidence
                           WHERE TenantId = @TenantId AND InstanceId = @InstanceId
                           ORDER BY CreatedUtc;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<EvidenceRow> rows = await conn.QueryAsync<EvidenceRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, InstanceId = instanceId },
                cancellationToken: cancellationToken));

        return rows.Select(MapEvidence).ToList();
    }

    public async Task<IReadOnlyList<RemediationInstanceRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT InstanceId, TenantId, WorkspaceId, ProjectId, FindingId, PatternId, PatternVersionId,
                                  PatternKey, FrozenPatternVersion, AutomationLevel, Status, CloudResourceId, AssessmentId,
                                  ControlId, PreflightSnapshotId, ExecutionSnapshotId, VerificationSnapshotId, WaveId,
                                  PreflightResultJson, VerificationResultJson, CreatedByActorKey, ApprovedByActorKey,
                                  CreatedUtc, UpdatedUtc, ApprovedUtc, ExecutedUtc, VerifiedUtc, ClosedUtc
                           FROM dbo.RemediationInstances
                           WHERE TenantId = @TenantId
                           ORDER BY UpdatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<InstanceRow> rows = await conn.QueryAsync<InstanceRow>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));

        return rows.Select(MapInstance).ToList();
    }

    private static object MapInstanceParameters(RemediationInstanceRecord instance) =>
        new
        {
            instance.InstanceId,
            instance.TenantId,
            instance.WorkspaceId,
            instance.ProjectId,
            instance.FindingId,
            instance.PatternId,
            instance.PatternVersionId,
            instance.PatternKey,
            instance.FrozenPatternVersion,
            AutomationLevel = (int)instance.AutomationLevel,
            Status = (int)instance.Status,
            instance.CloudResourceId,
            instance.AssessmentId,
            instance.ControlId,
            instance.PreflightSnapshotId,
            instance.ExecutionSnapshotId,
            instance.VerificationSnapshotId,
            instance.WaveId,
            instance.PreflightResultJson,
            instance.VerificationResultJson,
            instance.CreatedByActorKey,
            instance.ApprovedByActorKey,
            instance.CreatedUtc,
            instance.UpdatedUtc,
            instance.ApprovedUtc,
            instance.ExecutedUtc,
            instance.VerifiedUtc,
            instance.ClosedUtc,
        };

    private static RemediationInstanceRecord MapInstance(InstanceRow row) =>
        new()
        {
            InstanceId = row.InstanceId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            FindingId = row.FindingId,
            PatternId = row.PatternId,
            PatternVersionId = row.PatternVersionId,
            PatternKey = row.PatternKey,
            FrozenPatternVersion = row.FrozenPatternVersion,
            AutomationLevel = (RemediationAutomationLevel)row.AutomationLevel,
            Status = (RemediationInstanceStatus)row.Status,
            CloudResourceId = row.CloudResourceId,
            AssessmentId = row.AssessmentId,
            ControlId = row.ControlId,
            PreflightSnapshotId = row.PreflightSnapshotId,
            ExecutionSnapshotId = row.ExecutionSnapshotId,
            VerificationSnapshotId = row.VerificationSnapshotId,
            WaveId = row.WaveId,
            PreflightResultJson = row.PreflightResultJson,
            VerificationResultJson = row.VerificationResultJson,
            CreatedByActorKey = row.CreatedByActorKey,
            ApprovedByActorKey = row.ApprovedByActorKey,
            CreatedUtc = row.CreatedUtc,
            UpdatedUtc = row.UpdatedUtc,
            ApprovedUtc = row.ApprovedUtc,
            ExecutedUtc = row.ExecutedUtc,
            VerifiedUtc = row.VerifiedUtc,
            ClosedUtc = row.ClosedUtc,
        };

    private static RemediationEvidenceRecord MapEvidence(EvidenceRow row) =>
        new()
        {
            EvidenceId = row.EvidenceId,
            InstanceId = row.InstanceId,
            TenantId = row.TenantId,
            Phase = (RemediationEvidencePhase)row.Phase,
            PayloadJson = row.PayloadJson,
            ActorKey = row.ActorKey,
            CorrelationId = row.CorrelationId,
            CreatedUtc = row.CreatedUtc,
        };

    private sealed class InstanceRow
    {
        public Guid InstanceId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public Guid WorkspaceId
        {
            get;
            init;
        }

        public Guid ProjectId
        {
            get;
            init;
        }

        public Guid FindingId
        {
            get;
            init;
        }

        public Guid PatternId
        {
            get;
            init;
        }

        public Guid PatternVersionId
        {
            get;
            init;
        }

        public string PatternKey
        {
            get;
            init;
        } = string.Empty;

        public string FrozenPatternVersion
        {
            get;
            init;
        } = string.Empty;

        public int AutomationLevel
        {
            get;
            init;
        }

        public int Status
        {
            get;
            init;
        }

        public Guid? CloudResourceId
        {
            get;
            init;
        }

        public Guid? AssessmentId
        {
            get;
            init;
        }

        public Guid? ControlId
        {
            get;
            init;
        }

        public Guid? PreflightSnapshotId
        {
            get;
            init;
        }

        public Guid? ExecutionSnapshotId
        {
            get;
            init;
        }

        public Guid? VerificationSnapshotId
        {
            get;
            init;
        }

        public Guid? WaveId
        {
            get;
            init;
        }

        public string? PreflightResultJson
        {
            get;
            init;
        }

        public string? VerificationResultJson
        {
            get;
            init;
        }

        public string CreatedByActorKey
        {
            get;
            init;
        } = string.Empty;

        public string? ApprovedByActorKey
        {
            get;
            init;
        }

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public DateTime UpdatedUtc
        {
            get;
            init;
        }

        public DateTime? ApprovedUtc
        {
            get;
            init;
        }

        public DateTime? ExecutedUtc
        {
            get;
            init;
        }

        public DateTime? VerifiedUtc
        {
            get;
            init;
        }

        public DateTime? ClosedUtc
        {
            get;
            init;
        }
    }

    private sealed class EvidenceRow
    {
        public Guid EvidenceId
        {
            get;
            init;
        }

        public Guid InstanceId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public int Phase
        {
            get;
            init;
        }

        public string PayloadJson
        {
            get;
            init;
        } = string.Empty;

        public string ActorKey
        {
            get;
            init;
        } = string.Empty;

        public string CorrelationId
        {
            get;
            init;
        } = string.Empty;

        public DateTime CreatedUtc
        {
            get;
            init;
        }
    }
}
