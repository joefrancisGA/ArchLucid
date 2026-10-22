using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlOperationalSecurityExceptionRepository
{
    public async Task<int> CountExpiredBetweenInScopeAsync(
        ProjectScopeKey scope,
        DateTime windowStartUtc,
        DateTime windowEndUtc,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT COUNT(1)
                           FROM dbo.OperationalSecurityExceptions
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND Status = @ExpiredStatus
                             AND ExpirationUtc > @WindowStartUtc
                             AND ExpirationUtc <= @WindowEndUtc;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    WindowStartUtc = windowStartUtc,
                    WindowEndUtc = windowEndUtc,
                    ExpiredStatus = (int)OperationalSecurityExceptionStatus.Expired,
                },
                cancellationToken: cancellationToken));
    }
}
