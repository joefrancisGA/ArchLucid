using ArchLucid.Core.Integration;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.IntegrationOutbox;

/// <summary>Persists one-shot delivery reservations across workers and Service Bus redelivery.</summary>
public sealed class DapperOutboundWebhookDispatchClaimStore(ISqlConnectionFactory connectionFactory)
    : IOutboundWebhookDispatchClaimStore
{
    public async Task<bool> TryClaimAsync(OutboundWebhookDispatchClaim claim, CancellationToken cancellationToken)
    {
        const string sql = """
                           INSERT INTO dbo.OutboundWebhookDispatchClaims (TenantId, EventId, DestinationHash)
                           SELECT @TenantId, @EventId, @DestinationHash
                           WHERE NOT EXISTS
                           (
                               SELECT 1 FROM dbo.OutboundWebhookDispatchClaims WITH (UPDLOCK, HOLDLOCK)
                               WHERE TenantId = @TenantId AND EventId = @EventId AND DestinationHash = @DestinationHash
                           );
                           SELECT CONVERT(bit, @@ROWCOUNT);
                           """;

        var parameters = new { claim.TenantId, claim.EventId, DestinationHash = Convert.FromHexString(claim.DestinationHash) };
        await using SqlConnection connection =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        return await connection.ExecuteScalarAsync<bool>(
                new CommandDefinition(sql, parameters, cancellationToken: cancellationToken))
            .ConfigureAwait(false);
    }
}
