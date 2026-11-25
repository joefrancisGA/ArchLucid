using System.Data;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Drafts;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

/// <inheritdoc cref="IDraftRequestRepository" />
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via DbUp integration tests.")]
public sealed partial class DapperDraftRequestRepository(ISqlConnectionFactory connectionFactory) : IDraftRequestRepository
{
    private static readonly JsonSerializerOptions JsonOptions = ContractJson.CamelCaseIgnoreNullCompact;

    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private const int InteractiveDraftCommandTimeoutSeconds = 5;

    /// <inheritdoc />
    public async Task<DraftRequestResponse> CreateAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string createdByUserId,
        DraftRequestDocument document,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(document);
        ArgumentException.ThrowIfNullOrWhiteSpace(createdByUserId);
        PersistenceTenantScope.RequireEntityTenant(tenantId);

        Guid draftId = Guid.NewGuid();
        DateTime now = TimeProvider.System.GetUtcNow().UtcDateTime;
        string documentJson = JsonSerializer.Serialize(document, JsonOptions);
        byte[] documentContentHashSha256 = DraftDocumentContentFingerprint.Compute(document);
        DraftRequestResponse response = new()
        {
            DraftId = draftId,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            Status = DraftRequestStatus.Drafting,
            Document = document,
            DocumentContentHashSha256 = documentContentHashSha256,
            CreatedByUserId = createdByUserId,
            CreatedUtc = now,
            UpdatedUtc = now,
        };
        string readModelJson = DraftRequestSnapshotSerializer.Serialize(response);

        const string sql = """
                           INSERT INTO dbo.DraftRequests (
                               DraftId,
                               TenantId,
                               WorkspaceId,
                               ProjectId,
                               CreatedByUserId,
                               Status,
                               DocumentJson,
                               DocumentContentHashSha256,
                               ReadModelJson,
                               ReadModelSchemaVersion,
                               CreatedUtc,
                               UpdatedUtc)
                           VALUES (
                               @DraftId,
                               @TenantId,
                               @WorkspaceId,
                               @ProjectId,
                               @CreatedByUserId,
                               @Status,
                               @DocumentJson,
                               @DocumentContentHashSha256,
                               @ReadModelJson,
                               @ReadModelSchemaVersion,
                               @CreatedUtc,
                               @UpdatedUtc);
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    DraftId = draftId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    CreatedByUserId = createdByUserId,
                    Status = DraftRequestStatus.Drafting.ToString(),
                    DocumentJson = documentJson,
                    DocumentContentHashSha256 = documentContentHashSha256,
                    ReadModelJson = readModelJson,
                    ReadModelSchemaVersion = DraftRequestReadModelSchema.CurrentVersion,
                    CreatedUtc = now,
                    UpdatedUtc = now,
                },
                cancellationToken: cancellationToken,
                commandTimeout: InteractiveDraftCommandTimeoutSeconds));

        return response;
    }

    /// <inheritdoc />
    public async Task<DraftRequestResponse?> TryBindConversationThreadAsync(
        DraftRequestResponse expected, Guid threadId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(expected);
        PersistenceTenantScope.RequireEntityTenant(expected.TenantId);
        if (threadId == Guid.Empty || expected.DocumentContentHashSha256 is null ||
            !DraftDocumentContentFingerprint.SequenceEqual(expected.DocumentContentHashSha256,
                DraftDocumentContentFingerprint.Compute(expected.Document)) ||
            expected.Status is not (DraftRequestStatus.Drafting or DraftRequestStatus.Admitted))
            return null;

        DraftRequestDocument document = DraftRequestRepositoryCore.CloneDocument(expected.Document, JsonOptions);
        document.ConversationThreadId = threadId;
        const string sql = """
            UPDATE dbo.DraftRequests
            SET DocumentJson = @DocumentJson,
                DocumentContentHashSha256 = @NewHash,
                ReadModelJson = NULL,
                ReadModelSchemaVersion = 0,
                UpdatedUtc = @Now
            WHERE DraftId = @DraftId
              AND TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
              AND Status = @Status
              AND UpdatedUtc = @UpdatedUtc
              AND ((ArchitectureId IS NULL AND @ArchitectureId IS NULL) OR ArchitectureId = @ArchitectureId)
              AND DocumentContentHashSha256 = @ExpectedHash;
            SELECT @@ROWCOUNT;
            """;
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
        DynamicParameters parameters = new(new
        {
            expected.DraftId, expected.TenantId, expected.WorkspaceId, expected.ProjectId,
            Status = expected.Status.ToString(), expected.ArchitectureId,
            ExpectedHash = expected.DocumentContentHashSha256,
            DocumentJson = JsonSerializer.Serialize(document, JsonOptions),
            NewHash = DraftDocumentContentFingerprint.Compute(document),
        });
        parameters.Add("UpdatedUtc", expected.UpdatedUtc, DbType.DateTime2);
        DateTime now = TimeProvider.System.GetUtcNow().UtcDateTime;
        parameters.Add("Now", now <= expected.UpdatedUtc ? expected.UpdatedUtc.AddTicks(1) : now, DbType.DateTime2);
        int rows = await connection.ExecuteScalarAsync<int>(new CommandDefinition(sql, parameters,
            cancellationToken: ct, commandTimeout: InteractiveDraftCommandTimeoutSeconds));

        return rows == 1
            ? await GetAsync(expected.TenantId, expected.WorkspaceId, expected.ProjectId, expected.DraftId, ct)
            : null;
    }

    /// <inheritdoc />
    public Task<DraftRequestResponse?> UpdateAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid draftId,
        DraftRequestStatus status,
        DraftRequestDocument document,
        string? redirectReason,
        string? spawnedRunId,
        CancellationToken cancellationToken,
        Guid? spawnedArchitectureVersionId = null,
        byte[]? spawnedDocumentContentHashSha256 = null) =>
        UpdateCoreAsync(tenantId, workspaceId, projectId, draftId, status, document, redirectReason,
            spawnedRunId, spawnedArchitectureVersionId, spawnedDocumentContentHashSha256,
            authorizedDraft: null, cancellationToken);

    public Task<DraftRequestResponse?> UpdateAtAccessRevisionAsync(
        DraftRequestResponse draft, CancellationToken cancellationToken) =>
        UpdateCoreAsync(draft.TenantId, draft.WorkspaceId, draft.ProjectId, draft.DraftId, draft.Status,
            draft.Document, draft.RedirectReason, draft.SpawnedRunId, draft.SpawnedArchitectureVersionId,
            draft.SpawnedDocumentContentHashSha256, draft, cancellationToken);

    private async Task<DraftRequestResponse?> UpdateCoreAsync(
        Guid tenantId, Guid workspaceId, Guid projectId, Guid draftId, DraftRequestStatus status,
        DraftRequestDocument document, string? redirectReason, string? spawnedRunId,
        Guid? spawnedArchitectureVersionId, byte[]? spawnedDocumentContentHashSha256,
        DraftRequestResponse? authorizedDraft, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(document);
        PersistenceTenantScope.RequireEntityTenant(tenantId);

        DateTime? expectedUpdatedUtc = authorizedDraft?.UpdatedUtc;
        DateTime now = TimeProvider.System.GetUtcNow().UtcDateTime;
        if (expectedUpdatedUtc is DateTime previous && now <= previous)
            now = previous.AddTicks(1);

        string documentJson = JsonSerializer.Serialize(document, JsonOptions);
        byte[] documentContentHashSha256 = DraftDocumentContentFingerprint.Compute(document);

        const string sql = """
                           UPDATE dbo.DraftRequests
                           SET
                               Status = @Status,
                               DocumentJson = @DocumentJson,
                               DocumentContentHashSha256 = @DocumentContentHashSha256,
                               SpawnedDocumentContentHashSha256 = COALESCE(@SpawnedDocumentContentHashSha256, SpawnedDocumentContentHashSha256),
                               ReadModelJson = NULL,
                               ReadModelSchemaVersion = 0,
                               RedirectReason = @RedirectReason,
                               SpawnedRunId = @SpawnedRunId,
                               SpawnedArchitectureVersionId = @SpawnedArchitectureVersionId,
                               UpdatedUtc = CASE WHEN @UpdatedUtc <= UpdatedUtc
                                   THEN DATEADD(nanosecond, 100, UpdatedUtc) ELSE @UpdatedUtc END
                           WHERE DraftId = @DraftId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND (@ExpectedUpdatedUtc IS NULL OR UpdatedUtc = @ExpectedUpdatedUtc);

                           SELECT @@ROWCOUNT;
                           """;

        DynamicParameters parameters = new(new
        {
            DraftId = draftId,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            Status = status.ToString(),
            DocumentJson = documentJson,
            DocumentContentHashSha256 = documentContentHashSha256,
            SpawnedDocumentContentHashSha256 = spawnedDocumentContentHashSha256,
            RedirectReason = redirectReason,
            SpawnedRunId = spawnedRunId,
            SpawnedArchitectureVersionId = spawnedArchitectureVersionId,
        });
        parameters.Add("UpdatedUtc", now, DbType.DateTime2);
        parameters.Add("ExpectedUpdatedUtc", expectedUpdatedUtc, DbType.DateTime2);

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        int rows = await connection.ExecuteScalarAsync<int>(new CommandDefinition(
            sql, parameters, cancellationToken: cancellationToken,
            commandTimeout: InteractiveDraftCommandTimeoutSeconds));

        if (rows == 0)
            return null;

        if (authorizedDraft is not null)
        {
            // The guarded write has committed this private snapshot. Do not re-read a
            // potentially newer, unauthorized revision or lose the audit of this write.
            authorizedDraft.UpdatedUtc = now;
            authorizedDraft.DocumentContentHashSha256 = documentContentHashSha256;
            return authorizedDraft;
        }

        return await GetAsync(tenantId, workspaceId, projectId, draftId, cancellationToken);
    }

    /// <inheritdoc />
    [TenantScopeExempt(
        TenantScopeExemptReason.Operational,
        "Cross-tenant draft intake reaper hard-deletes terminal Redirected/Abandoned rows by UpdatedUtc cutoff.")]
    public async Task<DraftIntakeReaperBatchResult> HardDeleteTerminalDraftsBatchAsync(
        DateTimeOffset updatedBeforeUtc,
        int batchSize,
        CancellationToken cancellationToken)
    {
        int effectiveBatchSize = DraftRequestRepositoryCore.ClampReaperBatchSize(batchSize);
        DateTime cutoff = updatedBeforeUtc.UtcDateTime;

        const string sql = """
                           DELETE TOP (@BatchSize) dr
                           OUTPUT DELETED.DraftId, DELETED.TenantId, DELETED.WorkspaceId, DELETED.ProjectId
                           FROM dbo.DraftRequests dr
                           WHERE dr.Status IN (N'Redirected', N'Abandoned')
                             AND dr.UpdatedUtc < @UpdatedBeforeUtc;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<DraftIntakeReapedDraft> deleted = await connection.QueryAsync<DraftIntakeReapedDraft>(
            new CommandDefinition(
                sql,
                new { BatchSize = effectiveBatchSize, UpdatedBeforeUtc = cutoff },
                cancellationToken: cancellationToken));

        List<DraftIntakeReapedDraft> deletedDrafts = deleted.AsList();
        return new DraftIntakeReaperBatchResult
        {
            DeletedDraftIds = deletedDrafts.Select(draft => draft.DraftId).ToList(),
            DeletedDrafts = deletedDrafts,
        };
    }
}
