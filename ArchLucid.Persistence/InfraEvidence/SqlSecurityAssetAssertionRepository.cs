using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlSecurityAssetAssertionRepository(ISqlConnectionFactory connectionFactory)
    : ISecurityAssetAssertionRepository
{
    public async Task InsertAsync(SecurityAssetAssertionRecord record, CancellationToken cancellationToken = default)
    {
        const string sql = """
                           INSERT INTO dbo.SecurityAssetAssertions
                               (AssertionId, TenantId, WorkspaceId, ProjectId, CloudResourceId,
                                DataSensitivity, RegulatoryClass, DeploymentEnvironment, BusinessCriticality,
                                IsRevenueImpact, IsPatientImpact, Rationale, EvidenceReference, ExpirationUtc,
                                Status, RequestedByActorKey, ApprovedByActorKey, PayloadHashSha256,
                                ExpiryProcessedUtc, CreatedUtc, UpdatedUtc, RevokedUtc, RevokedByActorKey)
                           VALUES
                               (@AssertionId, @TenantId, @WorkspaceId, @ProjectId, @CloudResourceId,
                                @DataSensitivity, @RegulatoryClass, @DeploymentEnvironment, @BusinessCriticality,
                                @IsRevenueImpact, @IsPatientImpact, @Rationale, @EvidenceReference, @ExpirationUtc,
                                @Status, @RequestedByActorKey, @ApprovedByActorKey, @PayloadHashSha256,
                                @ExpiryProcessedUtc, @CreatedUtc, @UpdatedUtc, @RevokedUtc, @RevokedByActorKey);
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(sql, MapParameters(record), cancellationToken: cancellationToken));
    }

    public async Task<SecurityAssetAssertionRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid assertionId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT AssertionId, TenantId, WorkspaceId, ProjectId, CloudResourceId,
                                  DataSensitivity, RegulatoryClass, DeploymentEnvironment, BusinessCriticality,
                                  IsRevenueImpact, IsPatientImpact, Rationale, EvidenceReference, ExpirationUtc,
                                  Status, RequestedByActorKey, ApprovedByActorKey, PayloadHashSha256,
                                  ExpiryProcessedUtc, CreatedUtc, UpdatedUtc, RevokedUtc, RevokedByActorKey
                           FROM dbo.SecurityAssetAssertions
                           WHERE TenantId = @TenantId AND AssertionId = @AssertionId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        AssertionRow? row = await conn.QuerySingleOrDefaultAsync<AssertionRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, AssertionId = assertionId },
                cancellationToken: cancellationToken));

        return row is null ? null : Map(row);
    }

    public async Task<IReadOnlyList<SecurityAssetAssertionRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT AssertionId, TenantId, WorkspaceId, ProjectId, CloudResourceId,
                                  DataSensitivity, RegulatoryClass, DeploymentEnvironment, BusinessCriticality,
                                  IsRevenueImpact, IsPatientImpact, Rationale, EvidenceReference, ExpirationUtc,
                                  Status, RequestedByActorKey, ApprovedByActorKey, PayloadHashSha256,
                                  ExpiryProcessedUtc, CreatedUtc, UpdatedUtc, RevokedUtc, RevokedByActorKey
                           FROM dbo.SecurityAssetAssertions
                           WHERE TenantId = @TenantId
                           ORDER BY CreatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AssertionRow> rows = await conn.QueryAsync<AssertionRow>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    public async Task<SecurityAssetAssertionRecord?> TryGetActiveByCloudResourceIdAsync(
        Guid tenantId,
        Guid cloudResourceId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT TOP (1)
                                  AssertionId, TenantId, WorkspaceId, ProjectId, CloudResourceId,
                                  DataSensitivity, RegulatoryClass, DeploymentEnvironment, BusinessCriticality,
                                  IsRevenueImpact, IsPatientImpact, Rationale, EvidenceReference, ExpirationUtc,
                                  Status, RequestedByActorKey, ApprovedByActorKey, PayloadHashSha256,
                                  ExpiryProcessedUtc, CreatedUtc, UpdatedUtc, RevokedUtc, RevokedByActorKey
                           FROM dbo.SecurityAssetAssertions
                           WHERE TenantId = @TenantId
                             AND CloudResourceId = @CloudResourceId
                             AND Status = @ActiveStatus
                             AND ExpirationUtc > @AsOfUtc
                           ORDER BY CreatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        AssertionRow? row = await conn.QuerySingleOrDefaultAsync<AssertionRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    CloudResourceId = cloudResourceId,
                    AsOfUtc = asOfUtc,
                    ActiveStatus = (int)SecurityAssetAssertionStatus.Active,
                },
                cancellationToken: cancellationToken));

        return row is null ? null : Map(row);
    }

    public async Task<IReadOnlyList<Guid>> ListActiveAssertionIdsAsync(
        Guid tenantId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT AssertionId
                           FROM dbo.SecurityAssetAssertions
                           WHERE TenantId = @TenantId
                             AND Status = @ActiveStatus
                             AND ExpirationUtc > @AsOfUtc;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<Guid> rows = await conn.QueryAsync<Guid>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    AsOfUtc = asOfUtc,
                    ActiveStatus = (int)SecurityAssetAssertionStatus.Active,
                },
                cancellationToken: cancellationToken));

        return rows.ToList();
    }

    public async Task<IReadOnlyList<SecurityAssetAssertionRecord>> MarkExpiredAsync(
        Guid tenantId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE dbo.SecurityAssetAssertions
                           SET Status = @ExpiredStatus, UpdatedUtc = @AsOfUtc
                           OUTPUT
                               INSERTED.AssertionId, INSERTED.TenantId, INSERTED.WorkspaceId, INSERTED.ProjectId,
                               INSERTED.CloudResourceId, INSERTED.DataSensitivity, INSERTED.RegulatoryClass,
                               INSERTED.DeploymentEnvironment, INSERTED.BusinessCriticality, INSERTED.IsRevenueImpact,
                               INSERTED.IsPatientImpact, INSERTED.Rationale, INSERTED.EvidenceReference,
                               INSERTED.ExpirationUtc, INSERTED.Status, INSERTED.RequestedByActorKey,
                               INSERTED.ApprovedByActorKey, INSERTED.PayloadHashSha256, INSERTED.ExpiryProcessedUtc,
                               INSERTED.CreatedUtc, INSERTED.UpdatedUtc, INSERTED.RevokedUtc, INSERTED.RevokedByActorKey
                           WHERE TenantId = @TenantId
                             AND Status = @ActiveStatus
                             AND ExpirationUtc < @AsOfUtc;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AssertionRow> rows = await conn.QueryAsync<AssertionRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    AsOfUtc = asOfUtc,
                    ActiveStatus = (int)SecurityAssetAssertionStatus.Active,
                    ExpiredStatus = (int)SecurityAssetAssertionStatus.Expired,
                },
                cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    public async Task MarkExpiryProcessedAsync(
        Guid tenantId,
        Guid assertionId,
        DateTime processedUtc,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE dbo.SecurityAssetAssertions
                           SET ExpiryProcessedUtc = @ProcessedUtc, UpdatedUtc = @ProcessedUtc
                           WHERE TenantId = @TenantId AND AssertionId = @AssertionId AND ExpiryProcessedUtc IS NULL;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, AssertionId = assertionId, ProcessedUtc = processedUtc },
                cancellationToken: cancellationToken));
    }

    public async Task RevokeAsync(
        Guid tenantId,
        Guid assertionId,
        string revokedByActorKey,
        DateTime revokedUtc,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE dbo.SecurityAssetAssertions
                           SET Status = @RevokedStatus,
                               RevokedUtc = @RevokedUtc,
                               RevokedByActorKey = @RevokedByActorKey,
                               UpdatedUtc = @RevokedUtc
                           WHERE TenantId = @TenantId AND AssertionId = @AssertionId AND Status = @ActiveStatus;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    AssertionId = assertionId,
                    RevokedStatus = (int)SecurityAssetAssertionStatus.Revoked,
                    ActiveStatus = (int)SecurityAssetAssertionStatus.Active,
                    RevokedUtc = revokedUtc,
                    RevokedByActorKey = revokedByActorKey,
                },
                cancellationToken: cancellationToken));
    }

    public async Task UpdateRenewalAsync(
        SecurityAssetAssertionRecord record,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE dbo.SecurityAssetAssertions
                           SET ExpirationUtc = @ExpirationUtc,
                               RequestedByActorKey = @RequestedByActorKey,
                               ApprovedByActorKey = @ApprovedByActorKey,
                               PayloadHashSha256 = @PayloadHashSha256,
                               ExpiryProcessedUtc = NULL,
                               UpdatedUtc = @UpdatedUtc
                           WHERE TenantId = @TenantId
                             AND AssertionId = @AssertionId
                             AND Status = @ActiveStatus;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    record.TenantId,
                    record.AssertionId,
                    record.ExpirationUtc,
                    record.RequestedByActorKey,
                    record.ApprovedByActorKey,
                    record.PayloadHashSha256,
                    record.UpdatedUtc,
                    ActiveStatus = (int)SecurityAssetAssertionStatus.Active,
                },
                cancellationToken: cancellationToken));
    }

    private static object MapParameters(SecurityAssetAssertionRecord record) =>
        new
        {
            record.AssertionId,
            record.TenantId,
            record.WorkspaceId,
            record.ProjectId,
            record.CloudResourceId,
            DataSensitivity = (int)record.DataSensitivity,
            RegulatoryClass = (int)record.RegulatoryClass,
            DeploymentEnvironment = (int)record.DeploymentEnvironment,
            BusinessCriticality = (int)record.BusinessCriticality,
            record.IsRevenueImpact,
            record.IsPatientImpact,
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

    private static SecurityAssetAssertionRecord Map(AssertionRow row) =>
        new()
        {
            AssertionId = row.AssertionId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            CloudResourceId = row.CloudResourceId,
            DataSensitivity = (SecurityAssetDataSensitivity)row.DataSensitivity,
            RegulatoryClass = (SecurityAssetRegulatoryClass)row.RegulatoryClass,
            DeploymentEnvironment = (SecurityAssetDeploymentEnvironment)row.DeploymentEnvironment,
            BusinessCriticality = (SecurityAssetBusinessCriticality)row.BusinessCriticality,
            IsRevenueImpact = row.IsRevenueImpact,
            IsPatientImpact = row.IsPatientImpact,
            Rationale = row.Rationale,
            EvidenceReference = row.EvidenceReference,
            ExpirationUtc = row.ExpirationUtc,
            Status = (SecurityAssetAssertionStatus)row.Status,
            RequestedByActorKey = row.RequestedByActorKey,
            ApprovedByActorKey = row.ApprovedByActorKey,
            PayloadHashSha256 = row.PayloadHashSha256,
            ExpiryProcessedUtc = row.ExpiryProcessedUtc,
            CreatedUtc = row.CreatedUtc,
            UpdatedUtc = row.UpdatedUtc,
            RevokedUtc = row.RevokedUtc,
            RevokedByActorKey = row.RevokedByActorKey,
        };

    private sealed class AssertionRow
    {
        public Guid AssertionId
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

        public Guid CloudResourceId
        {
            get;
            init;
        }

        public int DataSensitivity
        {
            get;
            init;
        }

        public int RegulatoryClass
        {
            get;
            init;
        }

        public int DeploymentEnvironment
        {
            get;
            init;
        }

        public int BusinessCriticality
        {
            get;
            init;
        }

        public bool IsRevenueImpact
        {
            get;
            init;
        }

        public bool IsPatientImpact
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
