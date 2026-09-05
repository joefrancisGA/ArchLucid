using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlOperationalSecurityExceptionRepository(ISqlConnectionFactory connectionFactory)
    : IOperationalSecurityExceptionRepository
{
    public async Task InsertAsync(OperationalSecurityExceptionRecord record, CancellationToken cancellationToken = default)
    {
        const string sql = """
                           INSERT INTO dbo.OperationalSecurityExceptions
                               (ExceptionId, TenantId, WorkspaceId, ProjectId, FindingId, PatternId, CloudResourceId,
                                OwnerActorKeysJson, Rationale, ResidualRisk, CompensatingControls, EvidenceReference,
                                ExpirationUtc, Status, RequestedByActorKey, ApprovedByActorKey, PayloadHashSha256,
                                ExpiryProcessedUtc, CreatedUtc, UpdatedUtc, RevokedUtc, RevokedByActorKey)
                           VALUES
                               (@ExceptionId, @TenantId, @WorkspaceId, @ProjectId, @FindingId, @PatternId, @CloudResourceId,
                                @OwnerActorKeysJson, @Rationale, @ResidualRisk, @CompensatingControls, @EvidenceReference,
                                @ExpirationUtc, @Status, @RequestedByActorKey, @ApprovedByActorKey, @PayloadHashSha256,
                                @ExpiryProcessedUtc, @CreatedUtc, @UpdatedUtc, @RevokedUtc, @RevokedByActorKey);
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(sql, MapParameters(record), cancellationToken: cancellationToken));
    }

    public async Task<OperationalSecurityExceptionRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid exceptionId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT ExceptionId, TenantId, WorkspaceId, ProjectId, FindingId, PatternId, CloudResourceId,
                                  OwnerActorKeysJson, Rationale, ResidualRisk, CompensatingControls, EvidenceReference,
                                  ExpirationUtc, Status, RequestedByActorKey, ApprovedByActorKey, PayloadHashSha256,
                                  ExpiryProcessedUtc, CreatedUtc, UpdatedUtc, RevokedUtc, RevokedByActorKey
                           FROM dbo.OperationalSecurityExceptions
                           WHERE TenantId = @TenantId AND ExceptionId = @ExceptionId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        ExceptionRow? row = await conn.QuerySingleOrDefaultAsync<ExceptionRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, ExceptionId = exceptionId },
                cancellationToken: cancellationToken));

        return row is null ? null : Map(row);
    }

    public async Task<IReadOnlyList<OperationalSecurityExceptionRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT ExceptionId, TenantId, WorkspaceId, ProjectId, FindingId, PatternId, CloudResourceId,
                                  OwnerActorKeysJson, Rationale, ResidualRisk, CompensatingControls, EvidenceReference,
                                  ExpirationUtc, Status, RequestedByActorKey, ApprovedByActorKey, PayloadHashSha256,
                                  ExpiryProcessedUtc, CreatedUtc, UpdatedUtc, RevokedUtc, RevokedByActorKey
                           FROM dbo.OperationalSecurityExceptions
                           WHERE TenantId = @TenantId
                           ORDER BY CreatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<ExceptionRow> rows = await conn.QueryAsync<ExceptionRow>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<OperationalSecurityExceptionRecord>> MarkExpiredAsync(
        Guid tenantId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE dbo.OperationalSecurityExceptions
                           SET Status = @ExpiredStatus, UpdatedUtc = @AsOfUtc
                           OUTPUT
                               INSERTED.ExceptionId, INSERTED.TenantId, INSERTED.WorkspaceId, INSERTED.ProjectId,
                               INSERTED.FindingId, INSERTED.PatternId, INSERTED.CloudResourceId,
                               INSERTED.OwnerActorKeysJson, INSERTED.Rationale, INSERTED.ResidualRisk,
                               INSERTED.CompensatingControls, INSERTED.EvidenceReference, INSERTED.ExpirationUtc,
                               INSERTED.Status, INSERTED.RequestedByActorKey, INSERTED.ApprovedByActorKey,
                               INSERTED.PayloadHashSha256, INSERTED.ExpiryProcessedUtc, INSERTED.CreatedUtc,
                               INSERTED.UpdatedUtc, INSERTED.RevokedUtc, INSERTED.RevokedByActorKey
                           WHERE TenantId = @TenantId
                             AND Status = @ActiveStatus
                             AND ExpirationUtc < @AsOfUtc;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<ExceptionRow> rows = await conn.QueryAsync<ExceptionRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    AsOfUtc = asOfUtc,
                    ActiveStatus = (int)OperationalSecurityExceptionStatus.Active,
                    ExpiredStatus = (int)OperationalSecurityExceptionStatus.Expired,
                },
                cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    public async Task MarkExpiryProcessedAsync(
        Guid tenantId,
        Guid exceptionId,
        DateTime processedUtc,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE dbo.OperationalSecurityExceptions
                           SET ExpiryProcessedUtc = @ProcessedUtc, UpdatedUtc = @ProcessedUtc
                           WHERE TenantId = @TenantId AND ExceptionId = @ExceptionId AND ExpiryProcessedUtc IS NULL;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, ExceptionId = exceptionId, ProcessedUtc = processedUtc },
                cancellationToken: cancellationToken));
    }

    public async Task RevokeAsync(
        Guid tenantId,
        Guid exceptionId,
        string revokedByActorKey,
        DateTime revokedUtc,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE dbo.OperationalSecurityExceptions
                           SET Status = @RevokedStatus,
                               RevokedUtc = @RevokedUtc,
                               RevokedByActorKey = @RevokedByActorKey,
                               UpdatedUtc = @RevokedUtc
                           WHERE TenantId = @TenantId
                             AND ExceptionId = @ExceptionId
                             AND Status = @ActiveStatus;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    ExceptionId = exceptionId,
                    RevokedUtc = revokedUtc,
                    RevokedByActorKey = revokedByActorKey,
                    ActiveStatus = (int)OperationalSecurityExceptionStatus.Active,
                    RevokedStatus = (int)OperationalSecurityExceptionStatus.Revoked,
                },
                cancellationToken: cancellationToken));
    }

    public async Task<bool> HasActiveExceptionForFindingAsync(
        Guid tenantId,
        Guid findingId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT TOP (1) 1
                           FROM dbo.OperationalSecurityExceptions
                           WHERE TenantId = @TenantId
                             AND FindingId = @FindingId
                             AND Status = @ActiveStatus
                             AND ExpirationUtc > @AsOfUtc;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int? exists = await conn.ExecuteScalarAsync<int?>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    FindingId = findingId,
                    AsOfUtc = asOfUtc,
                    ActiveStatus = (int)OperationalSecurityExceptionStatus.Active,
                },
                cancellationToken: cancellationToken));

        return exists.HasValue;
    }

    private static object MapParameters(OperationalSecurityExceptionRecord record) =>
        new
        {
            record.ExceptionId,
            record.TenantId,
            record.WorkspaceId,
            record.ProjectId,
            record.FindingId,
            record.PatternId,
            record.CloudResourceId,
            record.OwnerActorKeysJson,
            record.Rationale,
            record.ResidualRisk,
            record.CompensatingControls,
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

    private static OperationalSecurityExceptionRecord Map(ExceptionRow row) =>
        new()
        {
            ExceptionId = row.ExceptionId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            FindingId = row.FindingId,
            PatternId = row.PatternId,
            CloudResourceId = row.CloudResourceId,
            OwnerActorKeysJson = row.OwnerActorKeysJson,
            Rationale = row.Rationale,
            ResidualRisk = row.ResidualRisk,
            CompensatingControls = row.CompensatingControls,
            EvidenceReference = row.EvidenceReference,
            ExpirationUtc = row.ExpirationUtc,
            Status = (OperationalSecurityExceptionStatus)row.Status,
            RequestedByActorKey = row.RequestedByActorKey,
            ApprovedByActorKey = row.ApprovedByActorKey,
            PayloadHashSha256 = row.PayloadHashSha256,
            ExpiryProcessedUtc = row.ExpiryProcessedUtc,
            CreatedUtc = row.CreatedUtc,
            UpdatedUtc = row.UpdatedUtc,
            RevokedUtc = row.RevokedUtc,
            RevokedByActorKey = row.RevokedByActorKey,
        };

    private sealed class ExceptionRow
    {
        public Guid ExceptionId
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

        public Guid? FindingId
        {
            get;
            init;
        }

        public Guid? PatternId
        {
            get;
            init;
        }

        public Guid? CloudResourceId
        {
            get;
            init;
        }

        public string OwnerActorKeysJson
        {
            get;
            init;
        } = string.Empty;

        public string Rationale
        {
            get;
            init;
        } = string.Empty;

        public string? ResidualRisk
        {
            get;
            init;
        }

        public string? CompensatingControls
        {
            get;
            init;
        }

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
