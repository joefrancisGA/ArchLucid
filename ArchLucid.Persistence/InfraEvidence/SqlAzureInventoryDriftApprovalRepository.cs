using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlAzureInventoryDriftApprovalRepository(ISqlConnectionFactory connectionFactory)
    : IAzureInventoryDriftApprovalRepository
{
    public async Task InsertAsync(AzureInventoryDriftApprovalRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
                           INSERT INTO dbo.AzureInventoryDriftApprovals
                           (
                               ApprovalId, TenantId, WorkspaceId, ProjectId, DiffId, ChangeId,
                               Approver, Reason, TicketReference, ExpirationUtc, Status, CreatedUtc
                           )
                           VALUES
                           (
                               @ApprovalId, @TenantId, @WorkspaceId, @ProjectId, @DiffId, @ChangeId,
                               @Approver, @Reason, @TicketReference, @ExpirationUtc, @Status, @CreatedUtc
                           );
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    record.ApprovalId,
                    record.TenantId,
                    record.WorkspaceId,
                    record.ProjectId,
                    record.DiffId,
                    record.ChangeId,
                    record.Approver,
                    record.Reason,
                    record.TicketReference,
                    record.ExpirationUtc,
                    Status = (int)record.Status,
                    record.CreatedUtc,
                },
                cancellationToken: cancellationToken));
    }

    public async Task MarkExpiredAsync(Guid tenantId, DateTime asOfUtc, CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE dbo.AzureInventoryDriftApprovals
                           SET Status = @ExpiredStatus
                           WHERE TenantId = @TenantId
                             AND Status = @ActiveStatus
                             AND ExpirationUtc <= @AsOfUtc;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    AsOfUtc = asOfUtc,
                    ActiveStatus = (int)AzureInventoryDriftApprovalStatus.Active,
                    ExpiredStatus = (int)AzureInventoryDriftApprovalStatus.Expired,
                },
                cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<AzureInventoryDriftApprovalRecord>> ListActiveForDiffAsync(
        ScopeContext scope,
        Guid diffId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
                           SELECT ApprovalId, TenantId, WorkspaceId, ProjectId, DiffId, ChangeId,
                                  Approver, Reason, TicketReference, ExpirationUtc, Status, CreatedUtc
                           FROM dbo.AzureInventoryDriftApprovals
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND DiffId = @DiffId
                             AND Status = @ActiveStatus
                             AND ExpirationUtc > @AsOfUtc
                           ORDER BY CreatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<ApprovalRow> rows = await conn.QueryAsync<ApprovalRow>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    DiffId = diffId,
                    ActiveStatus = (int)AzureInventoryDriftApprovalStatus.Active,
                    AsOfUtc = asOfUtc,
                },
                cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    private static AzureInventoryDriftApprovalRecord Map(ApprovalRow row) =>
        new()
        {
            ApprovalId = row.ApprovalId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            DiffId = row.DiffId,
            ChangeId = row.ChangeId,
            Approver = row.Approver,
            Reason = row.Reason,
            TicketReference = row.TicketReference,
            ExpirationUtc = row.ExpirationUtc,
            Status = (AzureInventoryDriftApprovalStatus)row.Status,
            CreatedUtc = row.CreatedUtc,
        };

    private sealed class ApprovalRow
    {
        public Guid ApprovalId
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

        public Guid DiffId
        {
            get;
            init;
        }

        public Guid? ChangeId
        {
            get;
            init;
        }

        public string Approver
        {
            get;
            init;
        } = string.Empty;

        public string Reason
        {
            get;
            init;
        } = string.Empty;

        public string? TicketReference
        {
            get;
            init;
        }

        public DateTime ExpirationUtc
        {
            get;
            init;
        }

        public int Status
        {
            get;
            init;
        }

        public DateTime CreatedUtc
        {
            get;
            init;
        }
    }
}
