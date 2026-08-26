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
        DraftRequestResponse response = new()
        {
            DraftId = draftId,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            Status = DraftRequestStatus.Drafting,
            Document = document,
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
    public async Task<DraftRequestResponse?> UpdateAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid draftId,
        DraftRequestStatus status,
        DraftRequestDocument document,
        string? redirectReason,
        string? spawnedRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(document);
        PersistenceTenantScope.RequireEntityTenant(tenantId);

        DateTime now = TimeProvider.System.GetUtcNow().UtcDateTime;
        string documentJson = JsonSerializer.Serialize(document, JsonOptions);

        const string sql = """
                           UPDATE dbo.DraftRequests
                           SET
                               Status = @Status,
                               DocumentJson = @DocumentJson,
                               ReadModelJson = NULL,
                               ReadModelSchemaVersion = 0,
                               RedirectReason = @RedirectReason,
                               SpawnedRunId = @SpawnedRunId,
                               UpdatedUtc = @UpdatedUtc
                           WHERE DraftId = @DraftId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId;

                           SELECT @@ROWCOUNT;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        int rows = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                sql,
                new
                {
                    DraftId = draftId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    Status = status.ToString(),
                    DocumentJson = documentJson,
                    RedirectReason = redirectReason,
                    SpawnedRunId = spawnedRunId,
                    UpdatedUtc = now,
                },
                cancellationToken: cancellationToken,
                commandTimeout: InteractiveDraftCommandTimeoutSeconds));

        if (rows == 0)
            return null;

        DraftRequestResponse? refreshed = await GetAsync(tenantId, workspaceId, projectId, draftId, cancellationToken);

        return refreshed;
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
        int effectiveBatchSize = Math.Clamp(batchSize, 1, 10_000);
        DateTime cutoff = updatedBeforeUtc.UtcDateTime;

        const string sql = """
                           DELETE TOP (@BatchSize) dr
                           OUTPUT DELETED.DraftId
                           FROM dbo.DraftRequests dr
                           WHERE dr.Status IN (N'Redirected', N'Abandoned')
                             AND dr.UpdatedUtc < @UpdatedBeforeUtc;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<Guid> deleted = await connection.QueryAsync<Guid>(
            new CommandDefinition(
                sql,
                new { BatchSize = effectiveBatchSize, UpdatedBeforeUtc = cutoff },
                cancellationToken: cancellationToken));

        List<Guid> deletedDraftIds = deleted.ToList();

        return new DraftIntakeReaperBatchResult { DeletedDraftIds = deletedDraftIds };
    }
}
