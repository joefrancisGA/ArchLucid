using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Identity;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Identity;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via integration tests.")]
public sealed class DapperPlatformTenantAuthRecoveryGrantRepository(ISqlConnectionFactory connectionFactory)
    : IPlatformTenantAuthRecoveryGrantRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<PlatformTenantAuthRecoveryGrantRecord> InsertAsync(
        PlatformTenantAuthRecoveryGrantRecord grant,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           INSERT INTO dbo.PlatformTenantAuthRecoveryGrants
                           (
                               GrantId,
                               TenantId,
                               NormalizedDomain,
                               Reason,
                               EvidenceReference,
                               GrantedByActorId,
                               GrantedUtc,
                               ExpiresUtc
                           )
                           VALUES
                           (
                               @GrantId,
                               @TenantId,
                               @NormalizedDomain,
                               @Reason,
                               @EvidenceReference,
                               @GrantedByActorId,
                               @GrantedUtc,
                               @ExpiresUtc
                           );
                           """;

        Guid grantId = grant.GrantId != Guid.Empty ? grant.GrantId : Guid.NewGuid();
        PlatformTenantAuthRecoveryGrantRecord stored = new()
        {
            GrantId = grantId,
            TenantId = grant.TenantId,
            NormalizedDomain = grant.NormalizedDomain,
            Reason = grant.Reason,
            EvidenceReference = grant.EvidenceReference,
            GrantedByActorId = grant.GrantedByActorId,
            GrantedUtc = grant.GrantedUtc,
            ExpiresUtc = grant.ExpiresUtc
        };

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    stored.GrantId,
                    stored.TenantId,
                    stored.NormalizedDomain,
                    stored.Reason,
                    stored.EvidenceReference,
                    stored.GrantedByActorId,
                    GrantedUtc = stored.GrantedUtc.UtcDateTime,
                    ExpiresUtc = stored.ExpiresUtc.UtcDateTime
                },
                cancellationToken: cancellationToken));

        return stored;
    }

    public async Task<PlatformTenantAuthRecoveryGrantRecord?> GetActiveByTenantAndDomainAsync(
        Guid tenantId,
        string normalizedDomain,
        DateTimeOffset nowUtc,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT TOP (1)
                                  GrantId,
                                  TenantId,
                                  NormalizedDomain,
                                  Reason,
                                  EvidenceReference,
                                  GrantedByActorId,
                                  GrantedUtc,
                                  ExpiresUtc,
                                  RevokedUtc,
                                  RevokedByActorId,
                                  TenantNotifiedUtc
                           FROM dbo.PlatformTenantAuthRecoveryGrants
                           WHERE TenantId = @TenantId
                             AND NormalizedDomain = @NormalizedDomain
                             AND RevokedUtc IS NULL
                             AND ExpiresUtc > @NowUtc
                           ORDER BY GrantedUtc DESC;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        PlatformTenantAuthRecoveryGrantRow? row = await connection.QuerySingleOrDefaultAsync<PlatformTenantAuthRecoveryGrantRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    NormalizedDomain = normalizedDomain,
                    NowUtc = nowUtc.UtcDateTime
                },
                cancellationToken: cancellationToken));

        return row?.ToRecord();
    }

    public async Task<PlatformTenantAuthRecoveryGrantRecord?> GetByIdAsync(
        Guid grantId,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT GrantId,
                                  TenantId,
                                  NormalizedDomain,
                                  Reason,
                                  EvidenceReference,
                                  GrantedByActorId,
                                  GrantedUtc,
                                  ExpiresUtc,
                                  RevokedUtc,
                                  RevokedByActorId,
                                  TenantNotifiedUtc
                           FROM dbo.PlatformTenantAuthRecoveryGrants
                           WHERE GrantId = @GrantId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        PlatformTenantAuthRecoveryGrantRow? row = await connection.QuerySingleOrDefaultAsync<PlatformTenantAuthRecoveryGrantRow>(
            new CommandDefinition(sql, new { GrantId = grantId }, cancellationToken: cancellationToken));

        return row?.ToRecord();
    }

    [TenantScopeExempt(
        TenantScopeExemptReason.Operational,
        "Platform operator revokes recovery grant by grant id within control-plane workflow.")]
    public async Task<bool> RevokeAsync(
        Guid grantId,
        string revokedByActorId,
        DateTimeOffset revokedUtc,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           UPDATE dbo.PlatformTenantAuthRecoveryGrants
                           SET RevokedUtc = @RevokedUtc,
                               RevokedByActorId = @RevokedByActorId
                           WHERE GrantId = @GrantId
                             AND RevokedUtc IS NULL;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int rows = await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    GrantId = grantId,
                    RevokedByActorId = revokedByActorId,
                    RevokedUtc = revokedUtc.UtcDateTime
                },
                cancellationToken: cancellationToken));

        return rows == 1;
    }

    public async Task MarkTenantNotifiedAsync(
        Guid grantId,
        DateTimeOffset notifiedUtc,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           UPDATE dbo.PlatformTenantAuthRecoveryGrants
                           SET TenantNotifiedUtc = @TenantNotifiedUtc
                           WHERE GrantId = @GrantId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new { GrantId = grantId, TenantNotifiedUtc = notifiedUtc.UtcDateTime },
                cancellationToken: cancellationToken));
    }

    private sealed class PlatformTenantAuthRecoveryGrantRow
    {
        public Guid GrantId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public string NormalizedDomain
        {
            get;
            init;
        } = string.Empty;

        public string Reason
        {
            get;
            init;
        } = string.Empty;

        public string EvidenceReference
        {
            get;
            init;
        } = string.Empty;

        public string GrantedByActorId
        {
            get;
            init;
        } = string.Empty;

        public DateTime GrantedUtc
        {
            get;
            init;
        }

        public DateTime ExpiresUtc
        {
            get;
            init;
        }

        public DateTime? RevokedUtc
        {
            get;
            init;
        }

        public string? RevokedByActorId
        {
            get;
            init;
        }

        public DateTime? TenantNotifiedUtc
        {
            get;
            init;
        }

        public PlatformTenantAuthRecoveryGrantRecord ToRecord() =>
            new()
            {
                GrantId = GrantId,
                TenantId = TenantId,
                NormalizedDomain = NormalizedDomain,
                Reason = Reason,
                EvidenceReference = EvidenceReference,
                GrantedByActorId = GrantedByActorId,
                GrantedUtc = GrantedUtc,
                ExpiresUtc = ExpiresUtc,
                RevokedUtc = RevokedUtc,
                RevokedByActorId = RevokedByActorId,
                TenantNotifiedUtc = TenantNotifiedUtc
            };
    }
}
