using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Identity;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via integration tests.")]
public sealed class DapperTenantSignInEmailDomainRepository(ISqlConnectionFactory connectionFactory)
    : ITenantSignInEmailDomainRepository
{
    private const string SelectColumns = """
                                         TenantId,
                                         DisplayDomain,
                                         NormalizedDomain,
                                         VerificationStatus,
                                         EnforcementMode,
                                         DnsVerificationToken,
                                         RequireEnterpriseSso,
                                         AllowEmailOtpRecovery,
                                         CreatedUtc,
                                         VerificationPendingUtc,
                                         VerifiedUtc,
                                         VerificationFailedUtc,
                                         RemovedUtc,
                                         UpdatedUtc,
                                         RoutingTestPassedUtc,
                                         EnforcementEnabledUtc
                                         """;

    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<TenantSignInEmailDomainRecord?> FindByNormalizedDomainAsync(
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        string sql = $"""
                      SELECT {SelectColumns}
                      FROM dbo.TenantSignInEmailDomains
                      WHERE NormalizedDomain = @NormalizedDomain
                        AND RemovedUtc IS NULL;
                      """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<TenantSignInEmailDomainRecord>(
            new CommandDefinition(
                sql,
                new { NormalizedDomain = normalizedDomain },
                cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<TenantSignInEmailDomainRecord>> ListByTenantIdAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        string sql = $"""
                      SELECT {SelectColumns}
                      FROM dbo.TenantSignInEmailDomains
                      WHERE TenantId = @TenantId
                        AND RemovedUtc IS NULL
                      ORDER BY NormalizedDomain;
                      """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<TenantSignInEmailDomainRecord> rows = await connection.QueryAsync<TenantSignInEmailDomainRecord>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));

        return rows.ToList();
    }

    public async Task<TenantSignInEmailDomainRecord?> TryGetAsync(
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        string sql = $"""
                      SELECT {SelectColumns}
                      FROM dbo.TenantSignInEmailDomains
                      WHERE TenantId = @TenantId
                        AND NormalizedDomain = @NormalizedDomain
                        AND RemovedUtc IS NULL;
                      """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<TenantSignInEmailDomainRecord>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, NormalizedDomain = normalizedDomain },
                cancellationToken: cancellationToken));
    }

    public async Task InsertAsync(TenantSignInEmailDomainRecord record, CancellationToken cancellationToken)
    {
        const string sql = """
                           INSERT INTO dbo.TenantSignInEmailDomains
                           (
                               TenantId,
                               DisplayDomain,
                               NormalizedDomain,
                               VerificationStatus,
                               EnforcementMode,
                               DnsVerificationToken,
                               RequireEnterpriseSso,
                               AllowEmailOtpRecovery,
                               CreatedUtc,
                               VerificationPendingUtc,
                               VerifiedUtc,
                               VerificationFailedUtc,
                               RemovedUtc,
                               UpdatedUtc,
                               RoutingTestPassedUtc,
                               EnforcementEnabledUtc
                           )
                           VALUES
                           (
                               @TenantId,
                               @DisplayDomain,
                               @NormalizedDomain,
                               @VerificationStatus,
                               @EnforcementMode,
                               @DnsVerificationToken,
                               @RequireEnterpriseSso,
                               @AllowEmailOtpRecovery,
                               @CreatedUtc,
                               @VerificationPendingUtc,
                               @VerifiedUtc,
                               @VerificationFailedUtc,
                               @RemovedUtc,
                               @UpdatedUtc,
                               @RoutingTestPassedUtc,
                               @EnforcementEnabledUtc
                           );
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(sql, record, cancellationToken: cancellationToken));
    }

    public async Task UpdateAsync(TenantSignInEmailDomainRecord record, CancellationToken cancellationToken)
    {
        const string sql = """
                           UPDATE dbo.TenantSignInEmailDomains
                           SET DisplayDomain = @DisplayDomain,
                               VerificationStatus = @VerificationStatus,
                               EnforcementMode = @EnforcementMode,
                               DnsVerificationToken = @DnsVerificationToken,
                               RequireEnterpriseSso = @RequireEnterpriseSso,
                               AllowEmailOtpRecovery = @AllowEmailOtpRecovery,
                               VerificationPendingUtc = @VerificationPendingUtc,
                               VerifiedUtc = @VerifiedUtc,
                               VerificationFailedUtc = @VerificationFailedUtc,
                               RemovedUtc = @RemovedUtc,
                               UpdatedUtc = @UpdatedUtc,
                               RoutingTestPassedUtc = @RoutingTestPassedUtc,
                               EnforcementEnabledUtc = @EnforcementEnabledUtc
                           WHERE TenantId = @TenantId
                             AND NormalizedDomain = @NormalizedDomain;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(sql, record, cancellationToken: cancellationToken));
    }
}
