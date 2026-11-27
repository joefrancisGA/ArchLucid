using ArchLucid.Core.Integration;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.IntegrationOutbox;

/// <summary>SQL-backed claim shared by all workers using the tenant catalog.</summary>
public sealed class DapperAzureDevOpsThreadCreateClaimStore(ISqlConnectionFactory connectionFactory)
    : IAzureDevOpsThreadCreateClaimStore
{
    public async Task<bool> TryClaimAsync(AzureDevOpsThreadCreateClaim claim, CancellationToken cancellationToken)
    {
        const string sql = """
                           INSERT INTO dbo.AzureDevOpsThreadCreateClaims (TenantId, RunId, RepositoryId, PullRequestId)
                           SELECT @TenantId, @RunId, @RepositoryId, @PullRequestId
                           WHERE NOT EXISTS
                           (
                               SELECT 1 FROM dbo.AzureDevOpsThreadCreateClaims WITH (UPDLOCK, HOLDLOCK)
                               WHERE TenantId = @TenantId AND RunId = @RunId
                                 AND RepositoryId = @RepositoryId AND PullRequestId = @PullRequestId
                           );
                           SELECT CONVERT(bit, @@ROWCOUNT);
                           """;

        await using SqlConnection connection =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        return await connection.ExecuteScalarAsync<bool>(
                new CommandDefinition(sql, claim, cancellationToken: cancellationToken))
            .ConfigureAwait(false);
    }
}
