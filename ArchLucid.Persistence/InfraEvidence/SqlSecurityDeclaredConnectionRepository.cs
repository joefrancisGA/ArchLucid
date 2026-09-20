using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlSecurityDeclaredConnectionRepository(ISqlConnectionFactory connectionFactory)
    : ISecurityDeclaredConnectionRepository
{
    public async Task InsertAsync(SecurityDeclaredConnectionRecord record, CancellationToken cancellationToken = default)
    {
        const string sql = """
                           INSERT INTO dbo.SecurityDeclaredConnections
                               (ConnectionId, TenantId, WorkspaceId, ProjectId, FromCloudResourceId, ToCloudResourceId,
                                RelationshipType, Rationale, EvidenceReference, ExpirationUtc, Status,
                                RequestedByActorKey, ApprovedByActorKey, PayloadHashSha256, ExpiryProcessedUtc,
                                CreatedUtc, UpdatedUtc, RevokedUtc, RevokedByActorKey)
                           VALUES
                               (@ConnectionId, @TenantId, @WorkspaceId, @ProjectId, @FromCloudResourceId, @ToCloudResourceId,
                                @RelationshipType, @Rationale, @EvidenceReference, @ExpirationUtc, @Status,
                                @RequestedByActorKey, @ApprovedByActorKey, @PayloadHashSha256, @ExpiryProcessedUtc,
                                @CreatedUtc, @UpdatedUtc, @RevokedUtc, @RevokedByActorKey);
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(sql, MapParameters(record), cancellationToken: cancellationToken));
    }

    public async Task<SecurityDeclaredConnectionRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid connectionId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT ConnectionId, TenantId, WorkspaceId, ProjectId, FromCloudResourceId, ToCloudResourceId,
                                  RelationshipType, Rationale, EvidenceReference, ExpirationUtc, Status,
                                  RequestedByActorKey, ApprovedByActorKey, PayloadHashSha256, ExpiryProcessedUtc,
                                  CreatedUtc, UpdatedUtc, RevokedUtc, RevokedByActorKey
                           FROM dbo.SecurityDeclaredConnections
                           WHERE TenantId = @TenantId AND ConnectionId = @ConnectionId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        ConnectionRow? row = await conn.QuerySingleOrDefaultAsync<ConnectionRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, ConnectionId = connectionId },
                cancellationToken: cancellationToken));

        return row is null ? null : Map(row);
    }

    public async Task<SecurityDeclaredConnectionRecord?> TryGetByIdInScopeAsync(
        ProjectScopeKey scope,
        Guid connectionId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT ConnectionId, TenantId, WorkspaceId, ProjectId, FromCloudResourceId, ToCloudResourceId,
                                  RelationshipType, Rationale, EvidenceReference, ExpirationUtc, Status,
                                  RequestedByActorKey, ApprovedByActorKey, PayloadHashSha256, ExpiryProcessedUtc,
                                  CreatedUtc, UpdatedUtc, RevokedUtc, RevokedByActorKey
                           FROM dbo.SecurityDeclaredConnections
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND ConnectionId = @ConnectionId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        ConnectionRow? row = await conn.QuerySingleOrDefaultAsync<ConnectionRow>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    ConnectionId = connectionId,
                },
                cancellationToken: cancellationToken));

        return row is null ? null : Map(row);
    }

    public async Task<IReadOnlyList<SecurityDeclaredConnectionRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT ConnectionId, TenantId, WorkspaceId, ProjectId, FromCloudResourceId, ToCloudResourceId,
                                  RelationshipType, Rationale, EvidenceReference, ExpirationUtc, Status,
                                  RequestedByActorKey, ApprovedByActorKey, PayloadHashSha256, ExpiryProcessedUtc,
                                  CreatedUtc, UpdatedUtc, RevokedUtc, RevokedByActorKey
                           FROM dbo.SecurityDeclaredConnections
                           WHERE TenantId = @TenantId
                           ORDER BY CreatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<ConnectionRow> rows = await conn.QueryAsync<ConnectionRow>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<SecurityDeclaredConnectionRecord>> ListByScopeAsync(
        ProjectScopeKey scope,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT ConnectionId, TenantId, WorkspaceId, ProjectId, FromCloudResourceId, ToCloudResourceId,
                                  RelationshipType, Rationale, EvidenceReference, ExpirationUtc, Status,
                                  RequestedByActorKey, ApprovedByActorKey, PayloadHashSha256, ExpiryProcessedUtc,
                                  CreatedUtc, UpdatedUtc, RevokedUtc, RevokedByActorKey
                           FROM dbo.SecurityDeclaredConnections
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                           ORDER BY CreatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<ConnectionRow> rows = await conn.QueryAsync<ConnectionRow>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                },
                cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    public async Task<SecurityDeclaredConnectionRecord?> TryGetActiveDuplicateAsync(
        Guid tenantId,
        Guid fromCloudResourceId,
        Guid toCloudResourceId,
        SecurityDeclaredConnectionRelationshipType relationshipType,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT TOP (1)
                                  ConnectionId, TenantId, WorkspaceId, ProjectId, FromCloudResourceId, ToCloudResourceId,
                                  RelationshipType, Rationale, EvidenceReference, ExpirationUtc, Status,
                                  RequestedByActorKey, ApprovedByActorKey, PayloadHashSha256, ExpiryProcessedUtc,
                                  CreatedUtc, UpdatedUtc, RevokedUtc, RevokedByActorKey
                           FROM dbo.SecurityDeclaredConnections
                           WHERE TenantId = @TenantId
                             AND FromCloudResourceId = @FromCloudResourceId
                             AND ToCloudResourceId = @ToCloudResourceId
                             AND RelationshipType = @RelationshipType
                             AND Status = @ActiveStatus
                             AND ExpirationUtc > @AsOfUtc
                           ORDER BY CreatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        ConnectionRow? row = await conn.QuerySingleOrDefaultAsync<ConnectionRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    FromCloudResourceId = fromCloudResourceId,
                    ToCloudResourceId = toCloudResourceId,
                    RelationshipType = (int)relationshipType,
                    AsOfUtc = asOfUtc,
                    ActiveStatus = (int)SecurityDeclaredConnectionStatus.Active,
                },
                cancellationToken: cancellationToken));

        return row is null ? null : Map(row);
    }

    public async Task<IReadOnlyList<SecurityDeclaredConnectionRecord>> ListActiveByTenantAsync(
        Guid tenantId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT ConnectionId, TenantId, WorkspaceId, ProjectId, FromCloudResourceId, ToCloudResourceId,
                                  RelationshipType, Rationale, EvidenceReference, ExpirationUtc, Status,
                                  RequestedByActorKey, ApprovedByActorKey, PayloadHashSha256, ExpiryProcessedUtc,
                                  CreatedUtc, UpdatedUtc, RevokedUtc, RevokedByActorKey
                           FROM dbo.SecurityDeclaredConnections
                           WHERE TenantId = @TenantId
                             AND Status = @ActiveStatus
                             AND ExpirationUtc > @AsOfUtc
                           ORDER BY CreatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<ConnectionRow> rows = await conn.QueryAsync<ConnectionRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    AsOfUtc = asOfUtc,
                    ActiveStatus = (int)SecurityDeclaredConnectionStatus.Active,
                },
                cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<SecurityDeclaredConnectionRecord>> MarkExpiredAsync(
        Guid tenantId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE dbo.SecurityDeclaredConnections
                           SET Status = @ExpiredStatus, UpdatedUtc = @AsOfUtc
                           OUTPUT
                               INSERTED.ConnectionId, INSERTED.TenantId, INSERTED.WorkspaceId, INSERTED.ProjectId,
                               INSERTED.FromCloudResourceId, INSERTED.ToCloudResourceId, INSERTED.RelationshipType,
                               INSERTED.Rationale, INSERTED.EvidenceReference, INSERTED.ExpirationUtc, INSERTED.Status,
                               INSERTED.RequestedByActorKey, INSERTED.ApprovedByActorKey, INSERTED.PayloadHashSha256,
                               INSERTED.ExpiryProcessedUtc, INSERTED.CreatedUtc, INSERTED.UpdatedUtc,
                               INSERTED.RevokedUtc, INSERTED.RevokedByActorKey
                           WHERE TenantId = @TenantId
                             AND Status = @ActiveStatus
                             AND ExpirationUtc < @AsOfUtc;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<ConnectionRow> rows = await conn.QueryAsync<ConnectionRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    AsOfUtc = asOfUtc,
                    ActiveStatus = (int)SecurityDeclaredConnectionStatus.Active,
                    ExpiredStatus = (int)SecurityDeclaredConnectionStatus.Expired,
                },
                cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    public async Task MarkExpiryProcessedAsync(
        Guid tenantId,
        Guid connectionId,
        DateTime processedUtc,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE dbo.SecurityDeclaredConnections
                           SET ExpiryProcessedUtc = @ProcessedUtc, UpdatedUtc = @ProcessedUtc
                           WHERE TenantId = @TenantId AND ConnectionId = @ConnectionId AND ExpiryProcessedUtc IS NULL;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, ConnectionId = connectionId, ProcessedUtc = processedUtc },
                cancellationToken: cancellationToken));
    }

    public async Task RevokeAsync(
        Guid tenantId,
        Guid connectionId,
        string revokedByActorKey,
        DateTime revokedUtc,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE dbo.SecurityDeclaredConnections
                           SET Status = @RevokedStatus,
                               RevokedUtc = @RevokedUtc,
                               RevokedByActorKey = @RevokedByActorKey,
                               UpdatedUtc = @RevokedUtc
                           WHERE TenantId = @TenantId AND ConnectionId = @ConnectionId AND Status = @ActiveStatus;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    ConnectionId = connectionId,
                    RevokedStatus = (int)SecurityDeclaredConnectionStatus.Revoked,
                    ActiveStatus = (int)SecurityDeclaredConnectionStatus.Active,
                    RevokedUtc = revokedUtc,
                    RevokedByActorKey = revokedByActorKey,
                },
                cancellationToken: cancellationToken));
    }

    public async Task UpdateRenewalAsync(
        SecurityDeclaredConnectionRecord record,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE dbo.SecurityDeclaredConnections
                           SET ExpirationUtc = @ExpirationUtc,
                               ApprovedByActorKey = @ApprovedByActorKey,
                               PayloadHashSha256 = @PayloadHashSha256,
                               ExpiryProcessedUtc = NULL,
                               UpdatedUtc = @UpdatedUtc
                           WHERE TenantId = @TenantId
                             AND ConnectionId = @ConnectionId
                             AND Status = @ActiveStatus;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    record.TenantId,
                    record.ConnectionId,
                    record.ExpirationUtc,
                    record.ApprovedByActorKey,
                    record.PayloadHashSha256,
                    record.UpdatedUtc,
                    ActiveStatus = (int)SecurityDeclaredConnectionStatus.Active,
                },
                cancellationToken: cancellationToken));
    }

    private static object MapParameters(SecurityDeclaredConnectionRecord record) =>
        new
        {
            record.ConnectionId,
            record.TenantId,
            record.WorkspaceId,
            record.ProjectId,
            record.FromCloudResourceId,
            record.ToCloudResourceId,
            RelationshipType = (int)record.RelationshipType,
            record.Rationale,
            record.EvidenceReference,
            record.ExpirationUtc,
            Status = (int)record.Status,
            record.RequestedByActorKey,
            record.ApprovedByActorKey,
            record.PayloadHashSha256,
            record.ExpiryProcessedUtc,
            record.CreatedUtc,
            record.UpdatedUtc,
            record.RevokedUtc,
            record.RevokedByActorKey,
        };

    private static SecurityDeclaredConnectionRecord Map(ConnectionRow row) =>
        new()
        {
            ConnectionId = row.ConnectionId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            FromCloudResourceId = row.FromCloudResourceId,
            ToCloudResourceId = row.ToCloudResourceId,
            RelationshipType = (SecurityDeclaredConnectionRelationshipType)row.RelationshipType,
            Rationale = row.Rationale,
            EvidenceReference = row.EvidenceReference,
            ExpirationUtc = row.ExpirationUtc,
            Status = (SecurityDeclaredConnectionStatus)row.Status,
            RequestedByActorKey = row.RequestedByActorKey,
            ApprovedByActorKey = row.ApprovedByActorKey,
            PayloadHashSha256 = row.PayloadHashSha256,
            ExpiryProcessedUtc = row.ExpiryProcessedUtc,
            CreatedUtc = row.CreatedUtc,
            UpdatedUtc = row.UpdatedUtc,
            RevokedUtc = row.RevokedUtc,
            RevokedByActorKey = row.RevokedByActorKey,
        };

    private sealed class ConnectionRow
    {
        public Guid ConnectionId
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

        public Guid FromCloudResourceId
        {
            get;
            init;
        }

        public Guid ToCloudResourceId
        {
            get;
            init;
        }

        public int RelationshipType
        {
            get;
            init;
        }

        public string Rationale
        {
            get;
            init;
        } = string.Empty;

        public string? EvidenceReference
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

        public string RequestedByActorKey
        {
            get;
            init;
        } = string.Empty;

        public string ApprovedByActorKey
        {
            get;
            init;
        } = string.Empty;

        public byte[] PayloadHashSha256
        {
            get;
            init;
        } = [];

        public DateTime? ExpiryProcessedUtc
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

        public DateTime? RevokedUtc
        {
            get;
            init;
        }

        public string? RevokedByActorKey
        {
            get;
            init;
        }
    }
}
