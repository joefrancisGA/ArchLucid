using ArchLucid.Contracts.Governance;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class SqlRiskExceptionRepository
{
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

    public async Task<IReadOnlyList<RiskExceptionRecord>> MarkExpiredAsync(
        Guid tenantId,
        DateTimeOffset asOfUtc,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE dbo.RiskExceptions
                           SET Status = N'Expired'
                           OUTPUT
                               INSERTED.RiskExceptionId,
                               INSERTED.TenantId,
                               INSERTED.WorkspaceId,
                               INSERTED.ProjectId,
                               INSERTED.FindingId,
                               INSERTED.RunId,
                               INSERTED.ManifestId,
                               INSERTED.OwnerUserId,
                               INSERTED.Rationale,
                               INSERTED.EvidenceRef,
                               INSERTED.ExpiresAtUtc,
                               INSERTED.Status,
                               INSERTED.CreatedAtUtc,
                               INSERTED.CreatedByUserId,
                               INSERTED.RevokedAtUtc,
                               INSERTED.RevokedByUserId
                           WHERE TenantId = @TenantId AND Status = N'Active' AND ExpiresAtUtc < @AsOfUtc;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<RiskExceptionRow> rows = await conn.QueryAsync<RiskExceptionRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, AsOfUtc = asOfUtc.UtcDateTime },
                cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    public async Task RenewAsync(
        Guid tenantId,
        Guid riskExceptionId,
        DateTimeOffset expiresAtUtc,
        string renewedByUserId,
        string? rationale,
        string? evidenceRef,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE dbo.RiskExceptions
                           SET ExpiresAtUtc = @ExpiresAtUtc,
                               Rationale = COALESCE(@Rationale, Rationale),
                               EvidenceRef = COALESCE(@EvidenceRef, EvidenceRef),
                               Status = N'Active',
                               RevokedAtUtc = NULL,
                               RevokedByUserId = NULL
                           WHERE TenantId = @TenantId
                             AND RiskExceptionId = @RiskExceptionId
                             AND Status IN (N'Active', N'Expired');
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int rows = await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    RiskExceptionId = riskExceptionId,
                    ExpiresAtUtc = expiresAtUtc.UtcDateTime,
                    Rationale = rationale,
                    EvidenceRef = evidenceRef,
                    RenewedByUserId = renewedByUserId,
                },
                cancellationToken: cancellationToken));

        if (rows == 0)
            throw new InvalidOperationException("Risk exception was not found or cannot be renewed.");
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
}
