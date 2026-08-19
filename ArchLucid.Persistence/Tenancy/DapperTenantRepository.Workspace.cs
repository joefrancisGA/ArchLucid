using System.Data;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class DapperTenantRepository
{

    public async Task InsertWorkspaceAsync(
        Guid workspaceId,
        Guid tenantId,
        string name,
        Guid defaultProjectId,
        CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           INSERT INTO dbo.TenantWorkspaces (Id, TenantId, Name, DefaultProjectId)
                           VALUES (@Id, @TenantId, @Name, @DefaultProjectId);
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    Id = workspaceId,
                    TenantId = tenantId,
                    Name = name,
                    DefaultProjectId = defaultProjectId
                },
                cancellationToken: ct)).ConfigureAwait(false);
    }


    public async Task<TenantWorkspaceLink?> GetFirstWorkspaceAsync(Guid tenantId, CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           SELECT TOP (1) Id AS WorkspaceId, DefaultProjectId
                           FROM dbo.TenantWorkspaces
                           WHERE TenantId = @TenantId
                           ORDER BY CreatedUtc ASC;
                           """;

        WorkspaceRow? row = await connection.QuerySingleOrDefaultAsync<WorkspaceRow>(
            new CommandDefinition(sql, new
            {
                TenantId = tenantId
            }, cancellationToken: ct)).ConfigureAwait(false);

        return row is null ? null : new TenantWorkspaceLink { WorkspaceId = row.WorkspaceId, DefaultProjectId = row.DefaultProjectId };
    }


    /// <inheritdoc />
    public async Task<IReadOnlyList<TenantWorkspaceListItem>> ListWorkspacesAsync(Guid tenantId, CancellationToken ct)
    {
        await using SqlConnection connection = await _tenantPlaneConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        const string sql = """
                           SELECT Id AS WorkspaceId, TenantId, Name, DefaultProjectId, CreatedUtc
                           FROM dbo.TenantWorkspaces
                           WHERE TenantId = @TenantId
                           ORDER BY CreatedUtc ASC;
                           """;

        IEnumerable<WorkspaceListRow> rows =
            await connection.QueryAsync<WorkspaceListRow>(
                new CommandDefinition(sql, new
                {
                    TenantId = tenantId
                }, cancellationToken: ct)).ConfigureAwait(false);

        return rows.Select(static r => new TenantWorkspaceListItem
            {
                WorkspaceId = r.WorkspaceId,
                TenantId = r.TenantId,
                Name = r.Name,
                DefaultProjectId = r.DefaultProjectId,
                CreatedUtc = r.CreatedUtc
            })
            .ToList();
    }
}
