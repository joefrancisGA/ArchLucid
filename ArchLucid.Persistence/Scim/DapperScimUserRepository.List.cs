using ArchLucid.Core.Scim.Filtering;
using ArchLucid.Core.Scim.Models;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Scim;

public sealed partial class DapperScimUserRepository
{
    /// <inheritdoc />
    public async Task<(IReadOnlyList<ScimUserRecord> items, int totalCount)> ListAsync(
        Guid tenantId,
        ScimFilterNode? filter,
        int startIndex1Based,
        int count,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        DynamicParameters parameters = new();
        parameters.Add("TenantId", tenantId);
        int p = 0;
        string whereExtra = SqlScimUserFilterTranslator.BuildWhere(filter, parameters, ref p);

        string countSql = $"""
                           SELECT COUNT(1)
                           FROM dbo.ScimUsers u
                           WHERE u.TenantId = @TenantId AND u.DirectoryRemovedUtc IS NULL AND ({whereExtra});
                           """;

        if (count <= 0)
        {
            int totalOnly = await connection.ExecuteScalarAsync<int>(
                new CommandDefinition(countSql, parameters, cancellationToken: cancellationToken));

            return ([], totalOnly);
        }

        int offset = Math.Max(0, startIndex1Based - 1);
        parameters.Add("Offset", offset);
        parameters.Add("PageSize", count);

        string listSql = $"""
                          SELECT u.Id, u.TenantId, u.ExternalId, u.UserName, u.DisplayName, u.Active, u.ResolvedRole,
                                 u.ResolvedRoleOrigin, u.DirectoryRemovedUtc, u.CreatedUtc, u.UpdatedUtc
                          FROM dbo.ScimUsers u
                          WHERE u.TenantId = @TenantId AND u.DirectoryRemovedUtc IS NULL AND ({whereExtra})
                          ORDER BY u.CreatedUtc
                          OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
                          """;

        string batchSql = countSql + "\n" + listSql;

        await using SqlMapper.GridReader multi = await connection.QueryMultipleAsync(
            new CommandDefinition(batchSql, parameters, cancellationToken: cancellationToken));

        int total = await multi.ReadSingleAsync<int>();
        IEnumerable<UserRow> rows = await multi.ReadAsync<UserRow>();

        return (rows.Select(static r => r.ToRecord()).ToList(), total);
    }

    /// <inheritdoc />
    public async Task<ScimUserRecord?> GetByIdAsync(Guid tenantId, Guid id, CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           SELECT u.Id, u.TenantId, u.ExternalId, u.UserName, u.DisplayName, u.Active, u.ResolvedRole,
                                  u.ResolvedRoleOrigin, u.DirectoryRemovedUtc, u.CreatedUtc, u.UpdatedUtc
                           FROM dbo.ScimUsers u
                           WHERE u.TenantId = @TenantId AND u.Id = @Id;
                           """;

        UserRow? row = await connection.QuerySingleOrDefaultAsync<UserRow>(
            new CommandDefinition(sql, new { TenantId = tenantId, Id = id }, cancellationToken: cancellationToken));

        return row?.ToRecord();
    }

    /// <inheritdoc />
    public async Task<ScimUserRecord?> GetByExternalIdAsync(
        Guid tenantId,
        string externalId,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           SELECT u.Id, u.TenantId, u.ExternalId, u.UserName, u.DisplayName, u.Active, u.ResolvedRole,
                                  u.ResolvedRoleOrigin, u.DirectoryRemovedUtc, u.CreatedUtc, u.UpdatedUtc
                           FROM dbo.ScimUsers u
                           WHERE u.TenantId = @TenantId AND u.ExternalId = @ExternalId;
                           """;

        UserRow? row = await connection.QuerySingleOrDefaultAsync<UserRow>(
            new CommandDefinition(sql, new { TenantId = tenantId, ExternalId = externalId }, cancellationToken: cancellationToken));

        return row?.ToRecord();
    }
}
