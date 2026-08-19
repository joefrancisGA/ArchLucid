using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Governance;

/// <summary>
///     SQL Server persistence for <see cref="PolicyPack" /> rows (<c>dbo.PolicyPacks</c>).
/// </summary>
/// <remarks>
///     <strong>ListByScopeAsync</strong> filters by exact tenant/workspace/project triple—these are
///     <em>pack authoring</em> coordinates, not assignment tiers.
///     Called from <c>PolicyPacksController.List</c> and from management flows when updating pack metadata after publish.
/// </remarks>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class DapperPolicyPackRepository(
    ISqlConnectionFactory connectionFactory,
    IGovernanceResolutionReadConnectionFactory governanceResolutionReadConnectionFactory) : IPolicyPackRepository
{
    /// <inheritdoc />
    public async Task CreateAsync(
        PolicyPack pack,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(pack);

        const string sql = """
                           INSERT INTO dbo.PolicyPacks
                           (
                               PolicyPackId, TenantId, WorkspaceId, ProjectId,
                               Name, Description, PackType, DistributionScope, Status,
                               CreatedUtc, ActivatedUtc, CurrentVersion, IsDeleted, QualityDimension
                           )
                           VALUES
                           (
                               @PolicyPackId, @TenantId, @WorkspaceId, @ProjectId,
                               @Name, @Description, @PackType, @DistributionScope, @Status,
                               @CreatedUtc, @ActivatedUtc, @CurrentVersion, @IsDeleted, @QualityDimension
                           );
                           """;

        (SqlConnection conn, bool ownsConnection) =
            await SqlExternalConnection.ResolveAsync(connectionFactory, connection, ct);

        try
        {
            await conn.ExecuteAsync(new CommandDefinition(sql, ToSqlParameters(pack), transaction, cancellationToken: ct));
        }
        finally
        {
            SqlExternalConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    /// <inheritdoc />
    public async Task UpdateAsync(PolicyPack pack, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(pack);

        PolicyPack? persisted = await GetByIdAsync(pack.PolicyPackId, ct);

        if (persisted is not null)
            PolicyPackDistributionScopeRules.EnsureDistributionScopeUnchanged(persisted, pack);

        const string sql = """
                           UPDATE dbo.PolicyPacks
                           SET
                               Name = @Name,
                               Description = @Description,
                               PackType = @PackType,
                               DistributionScope = @DistributionScope,
                               Status = @Status,
                               ActivatedUtc = @ActivatedUtc,
                               CurrentVersion = @CurrentVersion,
                               IsDeleted = @IsDeleted,
                               QualityDimension = @QualityDimension
                           WHERE PolicyPackId = @PolicyPackId;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, ToSqlParameters(pack), cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task<PolicyPack?> GetByIdAsync(Guid policyPackId, CancellationToken ct)
    {
        const string sql = """
                           SELECT
                               PolicyPackId, TenantId, WorkspaceId, ProjectId,
                               Name, Description, PackType, DistributionScope, Status,
                               CreatedUtc, ActivatedUtc, CurrentVersion, IsDeleted, QualityDimension
                           FROM dbo.PolicyPacks
                           WHERE PolicyPackId = @PolicyPackId
                             AND IsDeleted = 0;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        return await connection.QueryFirstOrDefaultAsync<PolicyPack>(
            new CommandDefinition(sql, new { PolicyPackId = policyPackId }, cancellationToken: ct));
    }

    /// <inheritdoc />
    [TenantScopeExempt(
        TenantScopeExemptReason.Operational,
        "Batch pack metadata lookup by PolicyPackId within the active tenant catalog; ids originate from scoped assignments.")]
    public async Task<IReadOnlyList<PolicyPack>> GetByIdsAsync(IReadOnlyCollection<Guid> policyPackIds, CancellationToken ct)
    {
        if (policyPackIds is null || policyPackIds.Count == 0)
            return Array.Empty<PolicyPack>();

        Guid[] ids = policyPackIds.Distinct().ToArray();

        const string sql = """
                           SELECT
                               PolicyPackId, TenantId, WorkspaceId, ProjectId,
                               Name, Description, PackType, DistributionScope, Status,
                               CreatedUtc, ActivatedUtc, CurrentVersion, IsDeleted, QualityDimension
                           FROM dbo.PolicyPacks
                           WHERE PolicyPackId IN @PolicyPackIds
                             AND IsDeleted = 0;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        IEnumerable<PolicyPack> rows = await connection.QueryAsync<PolicyPack>(
            new CommandDefinition(sql, new { PolicyPackIds = ids }, cancellationToken: ct));
        return rows.ToList();
    }

    /// <inheritdoc />
    /// <remarks>Authoring-scope list for the operator UI; not the same query as hierarchical assignment listing.</remarks>
    public async Task<IReadOnlyList<PolicyPack>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        const string sql = """
                           SELECT TOP 200
                               PolicyPackId, TenantId, WorkspaceId, ProjectId,
                               Name, Description, PackType, DistributionScope, Status,
                               CreatedUtc, ActivatedUtc, CurrentVersion, IsDeleted, QualityDimension
                           FROM dbo.PolicyPacks
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND IsDeleted = 0
                           ORDER BY CreatedUtc DESC;
                           """;

        await using SqlConnection connection =
            await governanceResolutionReadConnectionFactory.CreateOpenConnectionAsync(ct);
        IEnumerable<PolicyPack> rows = await connection.QueryAsync<PolicyPack>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId },
                cancellationToken: ct));
        return rows.ToList();
    }
    private static object ToSqlParameters(PolicyPack pack) => new
    {
        pack.PolicyPackId,
        pack.TenantId,
        pack.WorkspaceId,
        pack.ProjectId,
        pack.Name,
        pack.Description,
        pack.PackType,
        pack.DistributionScope,
        pack.Status,
        pack.CreatedUtc,
        pack.ActivatedUtc,
        pack.CurrentVersion,
        pack.IsDeleted,
        QualityDimension = pack.QualityDimension?.ToString(),
    };

}
