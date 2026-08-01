using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Models;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Sql;

using Dapper;

using Microsoft.Data.SqlClient;
using System.Text;

namespace ArchLucid.Persistence.Scim;

public sealed class DapperScimGroupRepository(ISqlConnectionFactory connectionFactory) : IScimGroupRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<(IReadOnlyList<ScimGroupRecord> items, int totalCount)> ListAsync(
        Guid tenantId,
        int startIndex1Based,
        int count,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string countSql = """
                                SELECT COUNT(1)
                                FROM dbo.ScimGroups g
                                WHERE g.TenantId = @TenantId;
                                """;

        const string listSql = """
                               SELECT g.Id, g.TenantId, g.ExternalId, g.DisplayName, g.CreatedUtc, g.UpdatedUtc
                               FROM dbo.ScimGroups g
                               WHERE g.TenantId = @TenantId
                               ORDER BY g.CreatedUtc
                               OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
                               """;

        if (count <= 0)
        {
            int totalOnly = await connection.ExecuteScalarAsync<int>(
                new CommandDefinition(countSql, new { TenantId = tenantId }, cancellationToken: cancellationToken));

            return ([], totalOnly);
        }

        int offset = Math.Max(0, startIndex1Based - 1);

        const string batchSql = countSql + "\n" + listSql;

        await using SqlMapper.GridReader multi = await connection.QueryMultipleAsync(
            new CommandDefinition(
                batchSql,
                new { TenantId = tenantId, Offset = offset, PageSize = count },
                cancellationToken: cancellationToken));

        int total = await multi.ReadSingleAsync<int>();
        IEnumerable<GroupRow> rows = await multi.ReadAsync<GroupRow>();

        return (rows.Select(static r => r.ToRecord()).ToList(), total);
    }

    /// <inheritdoc />
    public async Task<ScimGroupRecord?> GetByIdAsync(Guid tenantId, Guid id, CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           SELECT g.Id, g.TenantId, g.ExternalId, g.DisplayName, g.CreatedUtc, g.UpdatedUtc
                           FROM dbo.ScimGroups g
                           WHERE g.TenantId = @TenantId AND g.Id = @Id;
                           """;

        GroupRow? row = await connection.QuerySingleOrDefaultAsync<GroupRow>(
            new CommandDefinition(sql, new { TenantId = tenantId, Id = id }, cancellationToken: cancellationToken));

        return row?.ToRecord();
    }

    /// <inheritdoc />
    public async Task<ScimGroupRecord> InsertAsync(
        Guid tenantId,
        string externalId,
        string displayName,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           INSERT INTO dbo.ScimGroups (TenantId, ExternalId, DisplayName)
                           OUTPUT INSERTED.Id, INSERTED.TenantId, INSERTED.ExternalId, INSERTED.DisplayName, INSERTED.CreatedUtc, INSERTED.UpdatedUtc
                           VALUES (@TenantId, @ExternalId, @DisplayName);
                           """;

        GroupRow row = await connection.QuerySingleAsync<GroupRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, ExternalId = externalId, DisplayName = displayName },
                cancellationToken: cancellationToken));

        return row.ToRecord();
    }

    /// <inheritdoc />
    public async Task ReplaceAsync(
        Guid tenantId,
        Guid id,
        string externalId,
        string displayName,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           UPDATE dbo.ScimGroups
                           SET ExternalId = @ExternalId,
                               DisplayName = @DisplayName,
                               UpdatedUtc = SYSUTCDATETIME()
                           WHERE Id = @Id AND TenantId = @TenantId;
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, Id = id, ExternalId = externalId, DisplayName = displayName },
                cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task SetMembersAsync(
        Guid tenantId,
        Guid groupId,
        IReadOnlyList<Guid> userIds,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await using SqlTransaction tran = (SqlTransaction)await connection.BeginTransactionAsync(cancellationToken);

        const string del = """
                           DELETE FROM dbo.ScimGroupMembers
                           WHERE GroupId = @GroupId AND TenantId = @TenantId;
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(del, new { GroupId = groupId, TenantId = tenantId }, tran, cancellationToken: cancellationToken));

        if (userIds.Count == 0)
        {
            await tran.CommitAsync(cancellationToken);
            return;
        }

        const string insertHeader = """
                                    INSERT INTO dbo.ScimGroupMembers (TenantId, GroupId, UserId)
                                    VALUES
                                    """;

        await SqlChunkedDapperBatch.ExecuteChunksAsync(
            connection,
            tran,
            userIds.Count,
            SqlChunkedDapperBatch.DefaultMaxRowsPerCommand,
            (offset, rowCount) => BuildScimGroupMemberInsertChunk(insertHeader, tenantId, groupId, userIds, offset, rowCount),
            cancellationToken).ConfigureAwait(false);

        await tran.CommitAsync(cancellationToken);
    }

    private static SqlChunkedBatchCommand BuildScimGroupMemberInsertChunk(
        string insertHeader,
        Guid tenantId,
        Guid groupId,
        IReadOnlyList<Guid> userIds,
        int offset,
        int rowCount)
    {
        StringBuilder commandText = new(insertHeader.Length + rowCount * 40);
        commandText.Append(insertHeader);
        DynamicParameters parameters = new();
        parameters.Add("TenantId", tenantId);
        parameters.Add("GroupId", groupId);

        for (int i = 0; i < rowCount; i++)
        {
            if (i > 0)
                commandText.Append(',');

            commandText.Append($"(@TenantId,@GroupId,@UserId{i})");
            parameters.Add($"UserId{i}", userIds[offset + i]);
        }

        commandText.Append(';');
        return new SqlChunkedBatchCommand(commandText.ToString(), parameters);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<Guid>> ListMemberUserIdsAsync(
        Guid tenantId,
        Guid groupId,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           SELECT m.UserId
                           FROM dbo.ScimGroupMembers m
                           WHERE m.TenantId = @TenantId AND m.GroupId = @GroupId
                           ORDER BY m.UserId;
                           """;

        IEnumerable<Guid> rows = await connection.QueryAsync<Guid>(
            new CommandDefinition(sql, new { TenantId = tenantId, GroupId = groupId }, cancellationToken: cancellationToken));

        return rows.ToList();
    }

    private sealed class GroupRow
    {
        public Guid Id
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public string ExternalId
        {
            get;
            init;
        } = string.Empty;

        public string DisplayName
        {
            get;
            init;
        } = string.Empty;

        public DateTimeOffset CreatedUtc
        {
            get;
            init;
        }

        public DateTimeOffset UpdatedUtc
        {
            get;
            init;
        }

        internal ScimGroupRecord ToRecord()
        {
            return new ScimGroupRecord
            {
                Id = Id,
                TenantId = TenantId,
                ExternalId = ExternalId,
                DisplayName = DisplayName,
                CreatedUtc = CreatedUtc,
                UpdatedUtc = UpdatedUtc
            };
        }
    }
}
