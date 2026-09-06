using System.Text.Json;

using ArchLucid.Contracts.Drafts;
using ArchLucid.Persistence.Drafts;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class DapperDraftRequestRepository
{
    private static bool TryDeserializeReadModel(DraftRequestRow row, out DraftRequestResponse? response)
    {
        response = null;

        if (string.IsNullOrWhiteSpace(row.ReadModelJson))
            return false;

        if (row.ReadModelSchemaVersion != DraftRequestReadModelSchema.CurrentVersion)
            return false;

        try
        {
            response = DraftRequestSnapshotSerializer.Deserialize(row.ReadModelJson);

            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static async Task TryHealReadModelAsync(
        SqlConnection connection,
        Guid draftId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DraftRequestResponse mapped,
        CancellationToken cancellationToken)
    {
        string readModelJson = DraftRequestSnapshotSerializer.Serialize(mapped);

        const string sql = """
                           UPDATE dbo.DraftRequests
                           SET
                               ReadModelJson = @ReadModelJson,
                               ReadModelSchemaVersion = @ReadModelSchemaVersion
                           WHERE DraftId = @DraftId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId;
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    DraftId = draftId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    ReadModelJson = readModelJson,
                    ReadModelSchemaVersion = DraftRequestReadModelSchema.CurrentVersion,
                },
                cancellationToken: cancellationToken,
                commandTimeout: InteractiveDraftCommandTimeoutSeconds));
    }

    private static DraftRequestResponse MapRow(DraftRequestRow row)
    {
        DraftRequestDocument document =
            DraftRequestRepositoryCore.DeserializeDocument(row.DocumentJson, row.DraftId, JsonOptions);
        DraftRequestStatus status = DraftRequestRepositoryCore.ParseStatus(row.Status, row.DraftId);
        DraftRequestResponse response = DraftRequestRepositoryCore.MapToResponse(
            row.DraftId,
            row.TenantId,
            row.WorkspaceId,
            row.ProjectId,
            status,
            document,
            row.RedirectReason,
            row.SpawnedRunId,
            row.CreatedByUserId,
            DateTime.SpecifyKind(row.CreatedUtc, DateTimeKind.Utc),
            DateTime.SpecifyKind(row.UpdatedUtc, DateTimeKind.Utc),
            row.ArchitectureId);
        response.SpawnedArchitectureVersionId = row.SpawnedArchitectureVersionId;
        response.DocumentContentHashSha256 = row.DocumentContentHashSha256;
        response.SpawnedDocumentContentHashSha256 = row.SpawnedDocumentContentHashSha256;
        return response;
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

        public Guid? ArchitectureId
        {
            get;
            set;
        }

        public string CreatedByUserId
        {
            get;
            set;
        } = string.Empty;

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

        public string? ReadModelJson
        {
            get;
            set;
        }

        public int ReadModelSchemaVersion
        {
            get;
            set;
        }

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

        public Guid? SpawnedArchitectureVersionId
        {
            get;
            set;
        }

        public byte[]? DocumentContentHashSha256
        {
            get;
            set;
        }

        public byte[]? SpawnedDocumentContentHashSha256
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
