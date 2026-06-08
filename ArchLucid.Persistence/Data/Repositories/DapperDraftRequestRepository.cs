using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

/// <inheritdoc cref="IDraftRequestRepository" />
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via DbUp integration tests.")]
public sealed class DapperDraftRequestRepository(ISqlConnectionFactory connectionFactory) : IDraftRequestRepository
{
    private static readonly JsonSerializerOptions JsonOptions = ContractJson.CamelCaseIgnoreNullCompact;

    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<DraftRequestResponse?> GetAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid draftId,
        CancellationToken cancellationToken)
    {
        ScopedRepositoryScopeValidation.RequireEntityTenant(tenantId);

        const string sql = """
                           SELECT
                               DraftId,
                               TenantId,
                               WorkspaceId,
                               ProjectId,
                               Status,
                               DocumentJson,
                               RedirectReason,
                               SpawnedRunId,
                               CreatedUtc,
                               UpdatedUtc
                           FROM dbo.DraftRequests
                           WHERE DraftId = @DraftId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        DraftRequestRow? row = await connection.QuerySingleOrDefaultAsync<DraftRequestRow>(
            new CommandDefinition(
                sql,
                new { DraftId = draftId, TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId },
                cancellationToken: cancellationToken));

        return row is null ? null : MapRow(row);
    }

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
        ScopedRepositoryScopeValidation.RequireEntityTenant(tenantId);

        Guid draftId = Guid.NewGuid();
        DateTime now = TimeProvider.System.GetUtcNow().UtcDateTime;
        string documentJson = JsonSerializer.Serialize(document, JsonOptions);

        const string sql = """
                           INSERT INTO dbo.DraftRequests (
                               DraftId,
                               TenantId,
                               WorkspaceId,
                               ProjectId,
                               CreatedByUserId,
                               Status,
                               DocumentJson,
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
                    CreatedUtc = now,
                    UpdatedUtc = now,
                },
                cancellationToken: cancellationToken));

        return new DraftRequestResponse
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
        ScopedRepositoryScopeValidation.RequireEntityTenant(tenantId);

        DateTime now = TimeProvider.System.GetUtcNow().UtcDateTime;
        string documentJson = JsonSerializer.Serialize(document, JsonOptions);

        const string sql = """
                           UPDATE dbo.DraftRequests
                           SET
                               Status = @Status,
                               DocumentJson = @DocumentJson,
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
                cancellationToken: cancellationToken));

        if (rows == 0)
            return null;

        DraftRequestResponse? refreshed = await GetAsync(tenantId, workspaceId, projectId, draftId, cancellationToken);

        return refreshed;
    }

    private static DraftRequestResponse MapRow(DraftRequestRow row)
    {
        DraftRequestDocument? document =
            JsonSerializer.Deserialize<DraftRequestDocument>(row.DocumentJson, JsonOptions);

        if (document is null)
            throw new InvalidOperationException($"Draft '{row.DraftId}' has invalid DocumentJson.");

        if (!Enum.TryParse(row.Status, ignoreCase: true, out DraftRequestStatus status))
            throw new InvalidOperationException($"Draft '{row.DraftId}' has unknown status '{row.Status}'.");

        return new DraftRequestResponse
        {
            DraftId = row.DraftId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            Status = status,
            Document = document,
            RedirectReason = row.RedirectReason,
            SpawnedRunId = row.SpawnedRunId,
            CreatedUtc = row.CreatedUtc,
            UpdatedUtc = row.UpdatedUtc,
        };
    }

    private sealed class DraftRequestRow
    {
        public Guid DraftId
        {
            get;
            set;
        }

        public Guid TenantId
        {
            get;
            set;
        }

        public Guid WorkspaceId
        {
            get;
            set;
        }

        public Guid ProjectId
        {
            get;
            set;
        }

        public string Status
        {
            get;
            set;
        } = string.Empty;

        public string DocumentJson
        {
            get;
            set;
        } = string.Empty;

        public string? RedirectReason
        {
            get;
            set;
        }

        public string? SpawnedRunId
        {
            get;
            set;
        }

        public DateTime CreatedUtc
        {
            get;
            set;
        }

        public DateTime UpdatedUtc
        {
            get;
            set;
        }
    }
}
