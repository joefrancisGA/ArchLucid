using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed class SqlRiskExceptionRepository(ISqlConnectionFactory connectionFactory) : IRiskExceptionRepository
{
    public async Task CreateAsync(RiskExceptionRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
                           INSERT INTO dbo.RiskExceptions
                           (RiskExceptionId, TenantId, WorkspaceId, ProjectId, FindingId, RunId, ManifestId,
                            OwnerUserId, Rationale, EvidenceRef, ExpiresAtUtc, Status, CreatedAtUtc, CreatedByUserId)
                           VALUES
                           (@RiskExceptionId, @TenantId, @WorkspaceId, @ProjectId, @FindingId, @RunId, @ManifestId,
                            @OwnerUserId, @Rationale, @EvidenceRef, @ExpiresAtUtc, @Status, @CreatedAtUtc, @CreatedByUserId);
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    record.RiskExceptionId,
                    record.TenantId,
                    record.WorkspaceId,
                    record.ProjectId,
                    record.FindingId,
                    record.RunId,
                    record.ManifestId,
                    record.OwnerUserId,
                    record.Rationale,
                    record.EvidenceRef,
                    ExpiresAtUtc = record.ExpiresAtUtc.UtcDateTime,
                    Status = record.Status.ToString(),
                    CreatedAtUtc = record.CreatedAtUtc.UtcDateTime,
                    record.CreatedByUserId,
                },
                cancellationToken: cancellationToken));
    }

    public async Task<RiskExceptionRecord?> GetByIdAsync(Guid tenantId, Guid riskExceptionId, CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT RiskExceptionId, TenantId, WorkspaceId, ProjectId, FindingId, RunId, ManifestId,
                                  OwnerUserId, Rationale, EvidenceRef, ExpiresAtUtc, Status, CreatedAtUtc, CreatedByUserId,
                                  RevokedAtUtc, RevokedByUserId
                           FROM dbo.RiskExceptions
                           WHERE TenantId = @TenantId AND RiskExceptionId = @RiskExceptionId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        RiskExceptionRow? row = await conn.QuerySingleOrDefaultAsync<RiskExceptionRow>(
            new CommandDefinition(sql, new { TenantId = tenantId, RiskExceptionId = riskExceptionId }, cancellationToken: cancellationToken));

        return row is null ? null : Map(row);
    }

    public async Task<IReadOnlyList<RiskExceptionRecord>> ListActiveForTenantAsync(
        Guid tenantId,
        Guid? projectId,
        CancellationToken cancellationToken = default)
    {
        string sql = """
                     SELECT RiskExceptionId, TenantId, WorkspaceId, ProjectId, FindingId, RunId, ManifestId,
                            OwnerUserId, Rationale, EvidenceRef, ExpiresAtUtc, Status, CreatedAtUtc, CreatedByUserId,
                            RevokedAtUtc, RevokedByUserId
                     FROM dbo.RiskExceptions
                     WHERE TenantId = @TenantId AND Status = N'Active'
                     """;

        if (projectId.HasValue)
            sql += " AND ProjectId = @ProjectId";

        sql += " ORDER BY ExpiresAtUtc ASC;";

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<RiskExceptionRow> rows = await conn.QueryAsync<RiskExceptionRow>(
            new CommandDefinition(sql, new { TenantId = tenantId, ProjectId = projectId }, cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    public async Task RevokeAsync(
        Guid tenantId,
        Guid riskExceptionId,
        string revokedByUserId,
        DateTimeOffset revokedAtUtc,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE dbo.RiskExceptions
                           SET Status = N'Revoked', RevokedAtUtc = @RevokedAtUtc, RevokedByUserId = @RevokedByUserId
                           WHERE TenantId = @TenantId AND RiskExceptionId = @RiskExceptionId AND Status = N'Active';
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    RiskExceptionId = riskExceptionId,
                    RevokedAtUtc = revokedAtUtc.UtcDateTime,
                    RevokedByUserId = revokedByUserId,
                },
                cancellationToken: cancellationToken));
    }

    public async Task MarkExpiredAsync(Guid tenantId, DateTimeOffset asOfUtc, CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE dbo.RiskExceptions
                           SET Status = N'Expired'
                           WHERE TenantId = @TenantId AND Status = N'Active' AND ExpiresAtUtc < @AsOfUtc;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, AsOfUtc = asOfUtc.UtcDateTime },
                cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<RiskExceptionRecord>> ListRetiredSinceUtcAsync(
        Guid tenantId,
        Guid? projectId,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken = default)
    {
        string sql = """
                     SELECT RiskExceptionId, TenantId, WorkspaceId, ProjectId, FindingId, RunId, ManifestId,
                            OwnerUserId, Rationale, EvidenceRef, ExpiresAtUtc, Status, CreatedAtUtc, CreatedByUserId,
                            RevokedAtUtc, RevokedByUserId
                     FROM dbo.RiskExceptions
                     WHERE TenantId = @TenantId
                       AND Status IN (N'Revoked', N'Expired')
                       AND (
                           (Status = N'Revoked' AND RevokedAtUtc >= @SinceUtc)
                           OR (Status = N'Expired' AND ExpiresAtUtc >= @SinceUtc)
                       )
                     """;

        if (projectId.HasValue)
            sql += " AND ProjectId = @ProjectId";

        sql += " ORDER BY ExpiresAtUtc DESC;";

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<RiskExceptionRow> rows = await conn.QueryAsync<RiskExceptionRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, ProjectId = projectId, SinceUtc = sinceUtc.UtcDateTime },
                cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    private static RiskExceptionRecord Map(RiskExceptionRow row)
    {
        Enum.TryParse(row.Status, true, out RiskExceptionStatus status);

        return new RiskExceptionRecord
        {
            RiskExceptionId = row.RiskExceptionId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            FindingId = row.FindingId,
            RunId = row.RunId,
            ManifestId = row.ManifestId,
            OwnerUserId = row.OwnerUserId,
            Rationale = row.Rationale,
            EvidenceRef = row.EvidenceRef,
            ExpiresAtUtc = new DateTimeOffset(DateTime.SpecifyKind(row.ExpiresAtUtc, DateTimeKind.Utc)),
            Status = status,
            CreatedAtUtc = new DateTimeOffset(DateTime.SpecifyKind(row.CreatedAtUtc, DateTimeKind.Utc)),
            CreatedByUserId = row.CreatedByUserId,
            RevokedAtUtc = row.RevokedAtUtc is null
                ? null
                : new DateTimeOffset(DateTime.SpecifyKind(row.RevokedAtUtc.Value, DateTimeKind.Utc)),
            RevokedByUserId = row.RevokedByUserId,
        };
    }

    private sealed class RiskExceptionRow
    {
        public Guid RiskExceptionId
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

        public string FindingId
        {
            get;
            init;
        } = string.Empty;

        public Guid? RunId
        {
            get;
            init;
        }

        public Guid? ManifestId
        {
            get;
            init;
        }

        public string OwnerUserId
        {
            get;
            init;
        } = string.Empty;

        public string Rationale
        {
            get;
            init;
        } = string.Empty;

        public string? EvidenceRef
        {
            get;
            init;
        }

        public DateTime ExpiresAtUtc
        {
            get;
            init;
        }

        public string Status
        {
            get;
            init;
        } = string.Empty;

        public DateTime CreatedAtUtc
        {
            get;
            init;
        }

        public string CreatedByUserId
        {
            get;
            init;
        } = string.Empty;

        public DateTime? RevokedAtUtc
        {
            get;
            init;
        }

        public string? RevokedByUserId
        {
            get;
            init;
        }
    }
}
