using System.Data;

using ArchLucid.Core.Billing;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Billing;

public sealed partial class SqlBillingLedger
{
    public async Task<bool> TenantHasActiveSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           SELECT CAST(1 AS bit)
                           FROM dbo.BillingSubscriptions
                           WHERE TenantId = @TenantId AND Status = N'Active';
                           """;

        bool? row = await connection.ExecuteScalarAsync<bool?>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));

        return row == true;
    }

    public async Task UpsertPendingCheckoutAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string provider,
        string providerSessionId,
        string tierCode,
        int seats,
        int workspaces,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.sp_Billing_UpsertPending",
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    Provider = provider,
                    ProviderSubscriptionId = providerSessionId,
                    Tier = tierCode,
                    SeatsPurchased = seats,
                    WorkspacesPurchased = workspaces
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<BillingSubscriptionStateHistoryEntry>> GetSubscriptionStateHistoryAsync(
        Guid tenantId,
        int maxRows,
        CancellationToken cancellationToken = default)
    {
        BillingLedgerCore.ValidateHistoryMaxRows(maxRows);

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           SELECT TOP (@MaxRows)
                               HistoryId,
                               TenantId,
                               WorkspaceId,
                               ProjectId,
                               RecordedUtc,
                               ChangeKind,
                               PrevStatus,
                               NewStatus,
                               PrevTier,
                               NewTier,
                               PrevSeatsPurchased,
                               NewSeatsPurchased,
                               PrevWorkspacesPurchased,
                               NewWorkspacesPurchased,
                               PrevProvider,
                               NewProvider,
                               PrevProviderSubscriptionId,
                               NewProviderSubscriptionId
                           FROM dbo.BillingSubscriptionStateHistory
                           WHERE TenantId = @TenantId
                           ORDER BY RecordedUtc DESC;
                           """;

        IEnumerable<BillingSubscriptionStateHistoryEntry> rows =
            await connection.QueryAsync<BillingSubscriptionStateHistoryEntry>(
                new CommandDefinition(sql, new { TenantId = tenantId, MaxRows = maxRows },
                    cancellationToken: cancellationToken));

        return [.. rows];
    }

    public async Task<BillingSubscriptionSnapshot?> TryGetSubscriptionAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           SELECT Provider,
                                  Tier AS TierCode,
                                  SeatsPurchased,
                                  WorkspacesPurchased,
                                  Status
                           FROM dbo.BillingSubscriptions
                           WHERE TenantId = @TenantId;
                           """;

        return await connection.QuerySingleOrDefaultAsync<BillingSubscriptionSnapshot>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));
    }

    public async Task<string?> TryGetProviderSubscriptionIdAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           SELECT ProviderSubscriptionId
                           FROM dbo.BillingSubscriptions
                           WHERE TenantId = @TenantId;
                           """;

        return await connection.QuerySingleOrDefaultAsync<string?>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));
    }

    public async Task<Guid?> TryResolveTenantIdByProviderSubscriptionIdAsync(
        string providerSubscriptionId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(providerSubscriptionId))
            return null;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           SELECT TenantId
                           FROM dbo.BillingSubscriptions
                           WHERE ProviderSubscriptionId = @ProviderSubscriptionId;
                           """;

        return await connection.QuerySingleOrDefaultAsync<Guid?>(
            new CommandDefinition(
                sql,
                new { ProviderSubscriptionId = providerSubscriptionId.Trim() },
                cancellationToken: cancellationToken));
    }
}
