using System.Data;

using ArchLucid.Core.Resilience;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Resilience;

/// <summary>Serializes mutations to the same provider/deployment in the shared system catalog.</summary>
public sealed class SqlProviderQualityStateStore(ISystemSqlConnectionFactory connectionFactory)
    : IProviderQualityStateStore
{
    public async Task<TResult> UpdateAsync<TResult>(
        string deploymentKey,
        Func<string?, (string? Replacement, TResult Result)> update,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken)
            .ConfigureAwait(false);
        await using SqlTransaction transaction = (SqlTransaction)await connection
            .BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken).ConfigureAwait(false);
        string? current = await connection.QuerySingleOrDefaultAsync<string>(new CommandDefinition(
            """
            SELECT StateJson FROM dbo.ProviderQualityState WITH (UPDLOCK, HOLDLOCK)
            WHERE DeploymentKey = @DeploymentKey;
            """,
            new { DeploymentKey = new DbString { Value = deploymentKey, IsAnsi = true, IsFixedLength = true, Length = 64 } },
            transaction, commandTimeout: 5, cancellationToken: cancellationToken)).ConfigureAwait(false);

        (string? replacement, TResult result) = update(current);
        if (replacement is not null)
        {
            await connection.ExecuteAsync(new CommandDefinition(
                """
                UPDATE dbo.ProviderQualityState SET StateJson = @StateJson WHERE DeploymentKey = @DeploymentKey;
                IF @@ROWCOUNT = 0
                    INSERT dbo.ProviderQualityState (DeploymentKey, StateJson) VALUES (@DeploymentKey, @StateJson);
                """,
                new
                {
                    DeploymentKey = new DbString { Value = deploymentKey, IsAnsi = true, IsFixedLength = true, Length = 64 },
                    StateJson = replacement,
                },
                transaction, commandTimeout: 5, cancellationToken: cancellationToken)).ConfigureAwait(false);
        }

        await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);
        return result;
    }
}
