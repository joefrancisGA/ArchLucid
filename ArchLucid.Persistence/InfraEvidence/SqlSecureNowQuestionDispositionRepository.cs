using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Serialization;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlSecureNowQuestionDispositionRepository(ISqlConnectionFactory connectionFactory)
    : ISecureNowQuestionDispositionRepository
{
    public async Task<IReadOnlyList<SecureNowQuestionDispositionRecord>> ListByTenantAndSubscriptionAsync(
        Guid tenantId,
        string subscriptionId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT *
                           FROM dbo.SecureNowQuestionDispositions
                           WHERE TenantId = @TenantId
                             AND SubscriptionId = @SubscriptionId
                           ORDER BY UpdatedUtc DESC, DispositionId;
                           """;

        using System.Data.IDbConnection connection =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<DispositionRow> rows = await connection.QueryAsync<DispositionRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, SubscriptionId = subscriptionId.Trim().ToLowerInvariant() },
                cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    public async Task<SecureNowQuestionDispositionRecord?> TryGetByIdentityAsync(
        Guid tenantId,
        string subscriptionId,
        string resourceId,
        string questionKey,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT *
                           FROM dbo.SecureNowQuestionDispositions
                           WHERE TenantId = @TenantId
                             AND SubscriptionId = @SubscriptionId
                             AND ResourceId = @ResourceId
                             AND QuestionKey = @QuestionKey;
                           """;

        using System.Data.IDbConnection connection =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        DispositionRow? row = await connection.QuerySingleOrDefaultAsync<DispositionRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    SubscriptionId = subscriptionId.Trim().ToLowerInvariant(),
                    ResourceId = resourceId.Trim().ToLowerInvariant(),
                    QuestionKey = questionKey.Trim(),
                    IdentityHashSha256 = ComputeIdentityHash(subscriptionId, resourceId, questionKey),
                },
                cancellationToken: cancellationToken));

        return row is null ? null : Map(row);
    }

    public async Task UpsertAsync(
        SecureNowQuestionDispositionRecord record,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           MERGE dbo.SecureNowQuestionDispositions AS target
                           USING (SELECT
                                      @TenantId AS TenantId,
                                      @SubscriptionId AS SubscriptionId,
                                      @ResourceId AS ResourceId,
                                      @QuestionKey AS QuestionKey,
                                      @IdentityHashSha256 AS IdentityHashSha256) AS source
                           ON target.TenantId = source.TenantId
                              AND target.IdentityHashSha256 = source.IdentityHashSha256
                              AND target.SubscriptionId = source.SubscriptionId
                              AND target.ResourceId = source.ResourceId
                              AND target.QuestionKey = source.QuestionKey
                           WHEN MATCHED THEN UPDATE SET
                               WorkspaceId = @WorkspaceId,
                               ProjectId = @ProjectId,
                               SnapshotId = @SnapshotId,
                               Source = @Source,
                               ScopeKind = @ScopeKind,
                               Status = @Status,
                               AnswerCode = @AnswerCode,
                               AnswerText = @AnswerText,
                               Reason = @Reason,
                               ExpirationUtc = @ExpirationUtc,
                               EvidenceFingerprint = @EvidenceFingerprint,
                               ActorKey = @ActorKey,
                               UpdatedUtc = @UpdatedUtc,
                               AuditEntriesJson = @AuditEntriesJson
                           WHEN NOT MATCHED THEN INSERT (
                               DispositionId, TenantId, WorkspaceId, ProjectId, SnapshotId,
                               SubscriptionId, ResourceId, QuestionKey, IdentityHashSha256, Source, ScopeKind,
                               Status, AnswerCode, AnswerText, Reason, ExpirationUtc,
                               EvidenceFingerprint, ActorKey, UpdatedUtc, AuditEntriesJson)
                           VALUES (
                               @DispositionId, @TenantId, @WorkspaceId, @ProjectId, @SnapshotId,
                               @SubscriptionId, @ResourceId, @QuestionKey, @IdentityHashSha256, @Source, @ScopeKind,
                               @Status, @AnswerCode, @AnswerText, @Reason, @ExpirationUtc,
                               @EvidenceFingerprint, @ActorKey, @UpdatedUtc, @AuditEntriesJson);
                           """;

        using System.Data.IDbConnection connection =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(
            new CommandDefinition(sql, MapParameters(record), cancellationToken: cancellationToken));
    }

    private static object MapParameters(SecureNowQuestionDispositionRecord record) =>
        new
        {
            record.DispositionId,
            record.TenantId,
            record.WorkspaceId,
            record.ProjectId,
            record.SnapshotId,
            SubscriptionId = record.SubscriptionId.Trim().ToLowerInvariant(),
            ResourceId = record.ResourceId.Trim().ToLowerInvariant(),
            QuestionKey = record.QuestionKey.Trim(),
            IdentityHashSha256 = ComputeIdentityHash(record.SubscriptionId, record.ResourceId, record.QuestionKey),
            Source = (int)record.Source,
            ScopeKind = (int)record.ScopeKind,
            Status = (int)record.Status,
            record.AnswerCode,
            record.AnswerText,
            record.Reason,
            record.ExpirationUtc,
            record.EvidenceFingerprint,
            record.ActorKey,
            record.UpdatedUtc,
            AuditEntriesJson = JsonSerializer.Serialize(
                record.AuditEntries,
                AuditJsonSerializationOptions.Instance),
        };

    private static SecureNowQuestionDispositionRecord Map(DispositionRow row) =>
        new()
        {
            DispositionId = row.DispositionId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            SnapshotId = row.SnapshotId,
            SubscriptionId = row.SubscriptionId,
            ResourceId = row.ResourceId,
            QuestionKey = row.QuestionKey,
            Source = (SecureNowQuestionSource)row.Source,
            ScopeKind = (SecureNowQuestionScopeKind)row.ScopeKind,
            Status = (SecureNowQuestionDispositionStatus)row.Status,
            AnswerCode = row.AnswerCode,
            AnswerText = row.AnswerText,
            Reason = row.Reason,
            ExpirationUtc = row.ExpirationUtc,
            EvidenceFingerprint = row.EvidenceFingerprint,
            ActorKey = row.ActorKey,
            UpdatedUtc = row.UpdatedUtc,
            AuditEntries = JsonSerializer.Deserialize<IReadOnlyList<SecureNowQuestionDispositionAuditEntry>>(
                row.AuditEntriesJson,
                AuditJsonSerializationOptions.Instance) ?? [],
        };

    private static byte[] ComputeIdentityHash(
        string subscriptionId,
        string resourceId,
        string questionKey) =>
        SHA256.HashData(Encoding.UTF8.GetBytes(
            $"{subscriptionId.Trim().ToLowerInvariant()}\n{resourceId.Trim().ToLowerInvariant()}\n{questionKey.Trim()}"));

    private sealed class DispositionRow
    {
        public Guid DispositionId { get; init; }
        public Guid TenantId { get; init; }
        public Guid WorkspaceId { get; init; }
        public Guid ProjectId { get; init; }
        public Guid SnapshotId { get; init; }
        public string SubscriptionId { get; init; } = string.Empty;
        public string ResourceId { get; init; } = string.Empty;
        public string QuestionKey { get; init; } = string.Empty;
        public byte[] IdentityHashSha256 { get; init; } = [];
        public int Source { get; init; }
        public int ScopeKind { get; init; }
        public int Status { get; init; }
        public string? AnswerCode { get; init; }
        public string? AnswerText { get; init; }
        public string Reason { get; init; } = string.Empty;
        public DateTime ExpirationUtc { get; init; }
        public string EvidenceFingerprint { get; init; } = string.Empty;
        public string ActorKey { get; init; } = string.Empty;
        public DateTime UpdatedUtc { get; init; }
        public string AuditEntriesJson { get; init; } = "[]";
    }
}
