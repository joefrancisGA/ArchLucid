using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlAuditControlTimelineRepository(ISqlConnectionFactory connectionFactory)
    : IAuditControlTimelineRepository
{
    public async Task UpsertAsync(
        AuditControlTechnicalTimelineRecord record,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
                           MERGE dbo.AuditControlTechnicalTimelineStates AS target
                           USING
                           (
                               SELECT
                                   @TimelineStateId AS TimelineStateId,
                                   @TenantId AS TenantId,
                                   @AssessmentId AS AssessmentId,
                                   @ControlId AS ControlId,
                                   @State AS State,
                                   @InventoryDiffId AS InventoryDiffId,
                                   @UpdatedUtc AS UpdatedUtc
                           ) AS source
                           ON target.TenantId = source.TenantId
                               AND target.AssessmentId = source.AssessmentId
                               AND target.ControlId = source.ControlId
                           WHEN MATCHED THEN
                               UPDATE SET
                                   TimelineStateId = source.TimelineStateId,
                                   State = source.State,
                                   InventoryDiffId = source.InventoryDiffId,
                                   UpdatedUtc = source.UpdatedUtc
                           WHEN NOT MATCHED THEN
                               INSERT
                               (
                                   TimelineStateId, TenantId, AssessmentId, ControlId, State, InventoryDiffId, UpdatedUtc
                               )
                               VALUES
                               (
                                   source.TimelineStateId, source.TenantId, source.AssessmentId, source.ControlId,
                                   source.State, source.InventoryDiffId, source.UpdatedUtc
                               );
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    record.TimelineStateId,
                    record.TenantId,
                    record.AssessmentId,
                    record.ControlId,
                    State = (int)record.State,
                    record.InventoryDiffId,
                    record.UpdatedUtc,
                },
                cancellationToken: cancellationToken));
    }

    public async Task<AuditControlTechnicalTimelineRecord?> TryGetLatestAsync(
        Guid tenantId,
        Guid assessmentId,
        Guid controlId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT TOP (1)
                               TimelineStateId, TenantId, AssessmentId, ControlId, State, InventoryDiffId, UpdatedUtc
                           FROM dbo.AuditControlTechnicalTimelineStates
                           WHERE TenantId = @TenantId
                               AND AssessmentId = @AssessmentId
                               AND ControlId = @ControlId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        TimelineRow? row = await conn.QuerySingleOrDefaultAsync<TimelineRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, AssessmentId = assessmentId, ControlId = controlId },
                cancellationToken: cancellationToken));

        return row is null
            ? null
            : new AuditControlTechnicalTimelineRecord
            {
                TimelineStateId = row.TimelineStateId,
                TenantId = row.TenantId,
                AssessmentId = row.AssessmentId,
                ControlId = row.ControlId,
                State = (AuditControlTechnicalTimelineState)row.State,
                InventoryDiffId = row.InventoryDiffId,
                UpdatedUtc = row.UpdatedUtc,
            };
    }

    private sealed class TimelineRow
    {
        public Guid TimelineStateId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public Guid AssessmentId
        {
            get;
            init;
        }

        public Guid ControlId
        {
            get;
            init;
        }

        public int State
        {
            get;
            init;
        }

        public Guid? InventoryDiffId
        {
            get;
            init;
        }

        public DateTime UpdatedUtc
        {
            get;
            init;
        }
    }
}
