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
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<TenantSignInEmailDomainRecord?> FindByNormalizedDomainAsync(
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT TenantId, NormalizedDomain, RequireEnterpriseSso, AllowEmailOtpRecovery
                           FROM dbo.TenantSignInEmailDomains
                           WHERE NormalizedDomain = @NormalizedDomain;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<TenantSignInEmailDomainRecord>(
            new CommandDefinition(
                sql,
                new { NormalizedDomain = normalizedDomain },
                cancellationToken: cancellationToken));
    }
}
