using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlOperatorInferredConnectionRepository(ISqlConnectionFactory connectionFactory)
    : IOperatorInferredConnectionRepository
{
    public async Task UpsertProposalsAsync(
        IReadOnlyList<OperatorInferredConnectionRecord> records,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(records);

        if (records.Count == 0)
        {
            return;
        }

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        foreach (OperatorInferredConnectionRecord record in records)
        {
            const string sql = """
                               MERGE dbo.OperatorInferredConnections AS target
                               USING (SELECT @ConnectionId AS ConnectionId) AS source
                                   ON target.ConnectionId = source.ConnectionId
                               WHEN NOT MATCHED THEN
                                   INSERT (
                                       ConnectionId, TenantId, WorkspaceId, ProjectId, SnapshotId,
                                       Status, Source, RuleName, QuestionText,
                                       FromArmId, FromLabel, FromCloudResourceId,
                                       ToHost, ToCatalog, ToArmId, ToCloudResourceId,
                                       SettingName, SourceFileFormat, ActorKey,
                                       ProposalPayloadHashSha256, CreatedUtc, UpdatedUtc)
                                   VALUES (
                                       @ConnectionId, @TenantId, @WorkspaceId, @ProjectId, @SnapshotId,
                                       @Status, @Source, @RuleName, @QuestionText,
                                       @FromArmId, @FromLabel, @FromCloudResourceId,
                                       @ToHost, @ToCatalog, @ToArmId, @ToCloudResourceId,
                                       @SettingName, @SourceFileFormat, @ActorKey,
                                       @ProposalPayloadHashSha256, @CreatedUtc, @UpdatedUtc);
                               """;

            await connection.ExecuteAsync(
                new CommandDefinition(sql, MapParameters(record), cancellationToken: cancellationToken));
        }
    }

    public async Task<OperatorInferredConnectionRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid connectionId,
        CancellationToken cancellationToken = default)
    {
        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           SELECT *
                           FROM dbo.OperatorInferredConnections
                           WHERE TenantId = @TenantId
                             AND ConnectionId = @ConnectionId;
                           """;

        ConnectionRow? row = await connection.QuerySingleOrDefaultAsync<ConnectionRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, ConnectionId = connectionId },
                cancellationToken: cancellationToken));

        return row is null ? null : Map(row);
    }

    public async Task<OperatorInferredConnectionRecord?> TryGetByIdInScopeAsync(
        ProjectScopeKey scope,
        Guid connectionId,
        CancellationToken cancellationToken = default)
    {
        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           SELECT *
                           FROM dbo.OperatorInferredConnections
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND ConnectionId = @ConnectionId;
                           """;

        ConnectionRow? row = await connection.QuerySingleOrDefaultAsync<ConnectionRow>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    ConnectionId = connectionId,
                },
                cancellationToken: cancellationToken));

        return row is null ? null : Map(row);
    }

    public async Task<IReadOnlyList<OperatorInferredConnectionRecord>> ListBySnapshotAsync(
        Guid tenantId,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           SELECT *
                           FROM dbo.OperatorInferredConnections
                           WHERE TenantId = @TenantId
                             AND SnapshotId = @SnapshotId
                           ORDER BY CreatedUtc, ConnectionId;
                           """;

        IEnumerable<ConnectionRow> rows = await connection.QueryAsync<ConnectionRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, SnapshotId = snapshotId },
                cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    public async Task UpdateStatusAsync(
        OperatorInferredConnectionRecord record,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           UPDATE dbo.OperatorInferredConnections
                           SET Status = @Status,
                               FromCloudResourceId = @FromCloudResourceId,
                               ToArmId = @ToArmId,
                               ToCloudResourceId = @ToCloudResourceId,
                               ToCatalog = @ToCatalog,
                               ActorKey = @ActorKey,
                               UpdatedUtc = @UpdatedUtc
                           WHERE TenantId = @TenantId
                             AND ConnectionId = @ConnectionId;
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(sql, MapParameters(record), cancellationToken: cancellationToken));
    }

    private static object MapParameters(OperatorInferredConnectionRecord record) =>
        new
        {
            record.ConnectionId,
            record.TenantId,
            record.WorkspaceId,
            record.ProjectId,
            record.SnapshotId,
            Status = (int)record.Status,
            Source = (int)record.Source,
            record.RuleName,
            record.QuestionText,
            record.FromArmId,
            record.FromLabel,
            record.FromCloudResourceId,
            record.ToHost,
            record.ToCatalog,
            record.ToArmId,
            record.ToCloudResourceId,
            record.SettingName,
            record.SourceFileFormat,
            record.ActorKey,
            record.ProposalPayloadHashSha256,
            record.CreatedUtc,
            record.UpdatedUtc,
        };

    private static OperatorInferredConnectionRecord Map(ConnectionRow row) =>
        new()
        {
            ConnectionId = row.ConnectionId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            SnapshotId = row.SnapshotId,
            Status = (OperatorInferredConnectionStatus)row.Status,
            Source = (OperatorInferredConnectionSource)row.Source,
            RuleName = row.RuleName,
            QuestionText = row.QuestionText,
            FromArmId = row.FromArmId,
            FromLabel = row.FromLabel,
            FromCloudResourceId = row.FromCloudResourceId,
            ToHost = row.ToHost,
            ToCatalog = row.ToCatalog,
            ToArmId = row.ToArmId,
            ToCloudResourceId = row.ToCloudResourceId,
            SettingName = row.SettingName,
            SourceFileFormat = row.SourceFileFormat,
            ActorKey = row.ActorKey,
            ProposalPayloadHashSha256 = row.ProposalPayloadHashSha256,
            CreatedUtc = row.CreatedUtc,
            UpdatedUtc = row.UpdatedUtc,
        };

    private sealed class ConnectionRow
    {
        public Guid ConnectionId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public Guid WorkspaceId
        {
            get;
            init;
        }

        public Guid ProjectId
        {
            get;
            init;
        }

        public Guid SnapshotId
        {
            get;
            init;
        }

        public int Status
        {
            get;
            init;
        }

        public int Source
        {
            get;
            init;
        }

        public string? RuleName
        {
            get;
            init;
        }

        public string? QuestionText
        {
            get;
            init;
        }

        public string? FromArmId
        {
            get;
            init;
        }

        public string? FromLabel
        {
            get;
            init;
        }

        public Guid? FromCloudResourceId
        {
            get;
            init;
        }

        public string? ToHost
        {
            get;
            init;
        }

        public string? ToCatalog
        {
            get;
            init;
        }

        public string? ToArmId
        {
            get;
            init;
        }

        public Guid? ToCloudResourceId
        {
            get;
            init;
        }

        public string? SettingName
        {
            get;
            init;
        }

        public string? SourceFileFormat
        {
            get;
            init;
        }

        public string? ActorKey
        {
            get;
            init;
        }

        public byte[] ProposalPayloadHashSha256
        {
            get;
            init;
        } = [];

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public DateTime UpdatedUtc
        {
            get;
            init;
        }
    }
}
