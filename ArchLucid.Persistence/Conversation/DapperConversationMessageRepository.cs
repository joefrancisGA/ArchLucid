using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Conversation;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Conversation;

/// <summary>
///     SQL Server <see cref="IConversationMessageRepository" /> for <c>dbo.ConversationMessages</c>.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class DapperConversationMessageRepository(
    ISqlConnectionFactory connectionFactory,
    IScopeContextProvider scopeContextProvider)
    : IConversationMessageRepository
{
    /// <inheritdoc />
    [TenantScopeExempt(
        TenantScopeExemptReason.Operational,
        "Denormalized scope lookup on ConversationThreads by ThreadId before message insert.")]
    public async Task AddAsync(ConversationMessage message, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(message);
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        string scopeSql = $"""
                                SELECT TenantId, WorkspaceId, ProjectId
                                FROM dbo.ConversationThreads
                                WHERE ThreadId = @ThreadId
                                {PersistenceTenantScope.AndTripleWhere(scope)};
                                """;

        const string sql = """
                           INSERT INTO dbo.ConversationMessages
                           (
                               MessageId, ThreadId, Role, Content, CreatedUtc, MetadataJson,
                               TenantId, WorkspaceId, ProjectId
                           )
                           VALUES
                           (
                               @MessageId, @ThreadId, @Role, @Content, @CreatedUtc, @MetadataJson,
                               @TenantId, @WorkspaceId, @ProjectId
                           );
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        ConversationThreadDenormScopeRow? scopeHdr =
            await connection.QuerySingleOrDefaultAsync<ConversationThreadDenormScopeRow>(
                new CommandDefinition(
                    scopeSql,
                    new
                    {
                        message.ThreadId,
                        ScopeTenantId = scope.TenantId,
                        ScopeWorkspaceId = scope.WorkspaceId,
                        ScopeProjectId = scope.ProjectId
                    },
                    cancellationToken: ct));

        if (scopeHdr?.TenantId is null || scopeHdr.WorkspaceId is null || scopeHdr.ProjectId is null)
            throw new InvalidOperationException(
                "dbo.ConversationThreads row for ThreadId=" + message.ThreadId
                                                            + " lacks denormalized RLS scope; cannot persist ConversationMessages.");

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    message.MessageId,
                    message.ThreadId,
                    message.Role,
                    message.Content,
                    message.CreatedUtc,
                    message.MetadataJson,
                    TenantId = scopeHdr.TenantId!.Value,
                    WorkspaceId = scopeHdr.WorkspaceId!.Value,
                    ProjectId = scopeHdr.ProjectId!.Value
                },
                cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<ConversationMessage>> GetByThreadIdAsync(
        Guid threadId,
        int take,
        CancellationToken ct)
    {
        take = Math.Clamp(take, 1, 500);
        const string sql = """
                           SELECT MessageId, ThreadId, Role, Content, CreatedUtc, MetadataJson
                           FROM (
                               SELECT TOP (@Take)
                                   MessageId, ThreadId, Role, Content, CreatedUtc, MetadataJson
                               FROM dbo.ConversationMessages
                               WHERE ThreadId = @ThreadId
                               ORDER BY CreatedUtc DESC, MessageId DESC
                           ) AS recent
                           ORDER BY CreatedUtc ASC, MessageId ASC;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        IEnumerable<ConversationMessage> rows = await connection.QueryAsync<ConversationMessage>(
            new CommandDefinition(sql, new { ThreadId = threadId, Take = take }, cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<IReadOnlyList<ConversationProofRow>> GetRecentProofsAsync(
        ScopeContext scope, Guid threadId, int take, CancellationToken ct)
    {
        if (!HasScope(scope, threadId))
            return [];

        const string sql = """
                           SELECT MessageId, ThreadId, Role, CreatedUtc,
                               CASE WHEN Role = N'User' THEN JSON_VALUE(ProofMetadata, '$.conversationQuestionKeyV1') END AS QuestionKey,
                               CASE WHEN Role = N'Assistant' THEN JSON_QUERY(ProofMetadata, '$.askEvidenceScopeV1') END AS AnswerProofJson
                           FROM (
                               SELECT TOP (@Take) m.MessageId, m.ThreadId, m.Role, m.CreatedUtc,
                                   CASE WHEN ISJSON(m.MetadataJson) = 1 THEN m.MetadataJson ELSE N'{}' END AS ProofMetadata
                               FROM dbo.ConversationMessages m
                               JOIN dbo.ConversationThreads t ON t.ThreadId = m.ThreadId
                                   AND t.TenantId = m.TenantId AND t.WorkspaceId = m.WorkspaceId AND t.ProjectId = m.ProjectId
                               WHERE m.ThreadId = @ThreadId AND m.TenantId = @TenantId
                                   AND m.WorkspaceId = @WorkspaceId AND m.ProjectId = @ProjectId AND t.ArchivedUtc IS NULL
                               ORDER BY m.CreatedUtc DESC, m.MessageId DESC
                           ) AS recent
                           ORDER BY CreatedUtc ASC, MessageId ASC;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        var rows = await connection.QueryAsync<ConversationProofRow>(
            new CommandDefinition(sql, new { ThreadId = threadId, Take = Math.Clamp(take, 1, 500),
                scope.TenantId, scope.WorkspaceId, scope.ProjectId }, cancellationToken: ct));
        return rows.ToList();
    }

    public async Task<IReadOnlyList<ConversationMessage>> GetAuthorizedMessagesAsync(
        ScopeContext scope, Guid threadId, IReadOnlyCollection<Guid> messageIds, CancellationToken ct)
    {
        if (!HasScope(scope, threadId) || messageIds.Count == 0 || messageIds.Count > 500)
            return [];

        const string sql = """
                           SELECT m.MessageId, m.ThreadId, m.Role, m.Content, m.CreatedUtc, m.MetadataJson
                           FROM dbo.ConversationMessages m
                           JOIN dbo.ConversationThreads t ON t.ThreadId = m.ThreadId
                               AND t.TenantId = m.TenantId AND t.WorkspaceId = m.WorkspaceId AND t.ProjectId = m.ProjectId
                           WHERE m.ThreadId = @ThreadId AND m.TenantId = @TenantId
                               AND m.WorkspaceId = @WorkspaceId AND m.ProjectId = @ProjectId AND t.ArchivedUtc IS NULL
                               AND m.MessageId IN @MessageIds
                           ORDER BY m.CreatedUtc ASC, m.MessageId ASC;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        var rows = await connection.QueryAsync<ConversationMessage>(
            new CommandDefinition(sql, new { ThreadId = threadId, MessageIds = messageIds,
                scope.TenantId, scope.WorkspaceId, scope.ProjectId }, cancellationToken: ct));
        return rows.ToList();
    }

    private static bool HasScope(ScopeContext scope, Guid threadId) =>
        threadId != Guid.Empty && scope.TenantId != Guid.Empty &&
        scope.WorkspaceId != Guid.Empty && scope.ProjectId != Guid.Empty;
}
