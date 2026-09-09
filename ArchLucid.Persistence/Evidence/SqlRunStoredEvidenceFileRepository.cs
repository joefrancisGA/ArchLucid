using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Evidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Evidence;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via integration tests.")]
public sealed class SqlRunStoredEvidenceFileRepository(ISqlConnectionFactory connectionFactory)
    : IRunStoredEvidenceFileRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task InsertAsync(RunStoredEvidenceFileRecord record, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
                           INSERT INTO dbo.RunStoredEvidenceFiles
                               (EvidenceItemId, TenantId, WorkspaceId, ScopeProjectId, RunId, OriginalFileName,
                                ContentType, ByteLength, BlobUri, CreatedUtc, ActorUserId)
                           VALUES
                               (@EvidenceItemId, @TenantId, @WorkspaceId, @ScopeProjectId, @RunId, @OriginalFileName,
                                @ContentType, @ByteLength, @BlobUri, @CreatedUtc, @ActorUserId);
                           """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(sql, record, cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<RunStoredEvidenceFileRecord>> ListByRunAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT EvidenceItemId, TenantId, WorkspaceId, ScopeProjectId, RunId, OriginalFileName,
                                  ContentType, ByteLength, BlobUri, CreatedUtc, ActorUserId
                           FROM dbo.RunStoredEvidenceFiles
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ScopeProjectId
                             AND RunId = @RunId
                           ORDER BY CreatedUtc, OriginalFileName;
                           """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<RunStoredEvidenceFileRecord> rows = await connection.QueryAsync<RunStoredEvidenceFileRecord>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    RunId = runId,
                },
                cancellationToken: cancellationToken));

        return rows.ToList();
    }

    public async Task<RunStoredEvidenceFileRecord?> TryGetByEvidenceItemIdAsync(
        ScopeContext scope,
        Guid runId,
        string evidenceItemId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(evidenceItemId))
        {
            return null;
        }

        const string sql = """
                           SELECT EvidenceItemId, TenantId, WorkspaceId, ScopeProjectId, RunId, OriginalFileName,
                                  ContentType, ByteLength, BlobUri, CreatedUtc, ActorUserId
                           FROM dbo.RunStoredEvidenceFiles
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ScopeProjectId
                             AND RunId = @RunId
                             AND EvidenceItemId = @EvidenceItemId;
                           """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<RunStoredEvidenceFileRecord>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    RunId = runId,
                    EvidenceItemId = evidenceItemId.Trim(),
                },
                cancellationToken: cancellationToken));
    }
}
