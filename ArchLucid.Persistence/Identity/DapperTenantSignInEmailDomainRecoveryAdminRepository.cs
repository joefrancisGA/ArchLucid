using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Identity;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via integration tests.")]
public sealed class DapperTenantSignInEmailDomainRecoveryAdminRepository(ISqlConnectionFactory connectionFactory)
    : ITenantSignInEmailDomainRecoveryAdminRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<IReadOnlyList<TenantSignInEmailDomainRecoveryAdminRecord>> ListByDomainAsync(
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT TenantId,
                                  NormalizedDomain,
                                  NormalizedRecoveryAdminEmail,
                                  DisplayRecoveryAdminEmail,
                                  CreatedUtc,
                                  CreatedByActorId,
                                  AuthenticationVerifiedUtc
                           FROM dbo.TenantSignInEmailDomainRecoveryAdmins
                           WHERE TenantId = @TenantId
                             AND NormalizedDomain = @NormalizedDomain
                           ORDER BY NormalizedRecoveryAdminEmail;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<TenantSignInEmailDomainRecoveryAdminRecord> rows =
            await connection.QueryAsync<TenantSignInEmailDomainRecoveryAdminRecord>(
                new CommandDefinition(
                    sql,
                    new { TenantId = tenantId, NormalizedDomain = normalizedDomain },
                    cancellationToken: cancellationToken));

        return rows.ToList();
    }

    public async Task<bool> IsRecoveryAdminAsync(
        Guid tenantId,
        string normalizedDomain,
        string normalizedEmail,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT 1
                           FROM dbo.TenantSignInEmailDomainRecoveryAdmins
                           WHERE TenantId = @TenantId
                             AND NormalizedDomain = @NormalizedDomain
                             AND NormalizedRecoveryAdminEmail = @NormalizedRecoveryAdminEmail
                             AND AuthenticationVerifiedUtc IS NOT NULL;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int? found = await connection.ExecuteScalarAsync<int?>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    NormalizedDomain = normalizedDomain,
                    NormalizedRecoveryAdminEmail = normalizedEmail
                },
                cancellationToken: cancellationToken));

        return found == 1;
    }

    public async Task InsertAsync(TenantSignInEmailDomainRecoveryAdminRecord record, CancellationToken cancellationToken)
    {
        const string sql = """
                           INSERT INTO dbo.TenantSignInEmailDomainRecoveryAdmins
                           (
                               TenantId,
                               NormalizedDomain,
                               NormalizedRecoveryAdminEmail,
                               DisplayRecoveryAdminEmail,
                               CreatedUtc,
                               CreatedByActorId
                           )
                           VALUES
                           (
                               @TenantId,
                               @NormalizedDomain,
                               @NormalizedRecoveryAdminEmail,
                               @DisplayRecoveryAdminEmail,
                               @CreatedUtc,
                               @CreatedByActorId
                           );
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(sql, record, cancellationToken: cancellationToken));
    }

    public async Task DeleteAsync(
        Guid tenantId,
        string normalizedDomain,
        string normalizedRecoveryAdminEmail,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           DELETE FROM dbo.TenantSignInEmailDomainRecoveryAdmins
                           WHERE TenantId = @TenantId
                             AND NormalizedDomain = @NormalizedDomain
                             AND NormalizedRecoveryAdminEmail = @NormalizedRecoveryAdminEmail;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    NormalizedDomain = normalizedDomain,
                    NormalizedRecoveryAdminEmail = normalizedRecoveryAdminEmail
                },
                cancellationToken: cancellationToken));
    }

    public async Task MarkAuthenticationVerifiedAsync(
        Guid tenantId,
        string normalizedDomain,
        string normalizedRecoveryAdminEmail,
        DateTimeOffset verifiedUtc,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           UPDATE dbo.TenantSignInEmailDomainRecoveryAdmins
                           SET AuthenticationVerifiedUtc = @AuthenticationVerifiedUtc
                           WHERE TenantId = @TenantId
                             AND NormalizedDomain = @NormalizedDomain
                             AND NormalizedRecoveryAdminEmail = @NormalizedRecoveryAdminEmail;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    NormalizedDomain = normalizedDomain,
                    NormalizedRecoveryAdminEmail = normalizedRecoveryAdminEmail,
                    AuthenticationVerifiedUtc = verifiedUtc.UtcDateTime
                },
                cancellationToken: cancellationToken));
    }
}
