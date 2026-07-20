using System.Data;

using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Tenancy;

using Dapper;

namespace ArchLucid.Persistence.Governance;

/// <summary>
///     Idempotently ensures <c>dbo.Tenants</c> contains a parent row for governance FK children
///     (for example <c>FK_GovernanceApprovalRequests_Tenants</c>) when scope supplies a tenant id
///     that was never formally provisioned (DevelopmentBypass / greenfield CI scopes).
///     Existing provisioned rows are never updated — only missing parent rows are inserted.
/// </summary>
internal static class GovernanceTenantScopePriming
{
    internal static async Task MergeTenantForScopeAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            return;

        ArgumentNullException.ThrowIfNull(connection);

        string slug = "gov-scope-" + tenantId.ToString("N");

        const string mergeSql = """
                                MERGE INTO dbo.Tenants WITH (HOLDLOCK) AS t
                                USING (SELECT @Id AS Id) AS src ON t.Id = src.Id
                                WHEN NOT MATCHED BY TARGET THEN
                                    INSERT (Id, Name, Slug, Tier, EntraTenantId)
                                    VALUES (@Id, @Name, @Slug, @Tier, NULL);
                                """;

        object param = new
        {
            Id = tenantId,
            Name = "Governance scope tenant",
            Slug = slug,
            Tier = TenantTierSql.ToTierString(TenantTier.Standard)
        };

        await connection.ExecuteAsync(
            new CommandDefinition(
                commandText: mergeSql,
                parameters: param,
                transaction: transaction,
                commandTimeout: DapperCommandTimeoutSeconds.Standard,
                commandType: null,
                flags: CommandFlags.Buffered,
                cancellationToken: cancellationToken));
    }
}
