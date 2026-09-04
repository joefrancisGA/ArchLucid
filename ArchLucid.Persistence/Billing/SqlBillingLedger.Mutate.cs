using System.Data;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Billing;

public sealed partial class SqlBillingLedger
{
    public async Task ActivateSubscriptionAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string provider,
        string providerSubscriptionId,
        string tierCode,
        int seats,
        int workspaces,
        string? rawWebhookJson,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.sp_Billing_Activate",
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    Provider = provider,
                    ProviderSubscriptionId = providerSubscriptionId,
                    Tier = tierCode,
                    SeatsPurchased = seats,
                    WorkspacesPurchased = workspaces,
                    RawWebhookJson = rawWebhookJson
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));
    }

    public async Task SuspendSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.sp_Billing_Suspend",
                new { TenantId = tenantId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));
    }

    public async Task ReinstateSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.sp_Billing_Reinstate",
                new { TenantId = tenantId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));
    }

    public async Task CancelSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.sp_Billing_Cancel",
                new { TenantId = tenantId },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));
    }

    public async Task ChangePlanAsync(Guid tenantId, string tierCode, string? rawWebhookJson,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.sp_Billing_ChangePlan",
                new { TenantId = tenantId, Tier = tierCode, RawWebhookJson = rawWebhookJson },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));
    }

    public async Task ChangeQuantityAsync(Guid tenantId, int seatsPurchased, string? rawWebhookJson,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.sp_Billing_ChangeQuantity",
                new { TenantId = tenantId, SeatsPurchased = seatsPurchased, RawWebhookJson = rawWebhookJson },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));
    }
}
