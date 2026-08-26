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
            // SQL datetime2 has no Kind; leave Unspecified and System.Text.Json omits Z, so browsers
            // treat UTC wall-clock as local and relative labels jump into the future by the offset.
            CreatedUtc = DateTime.SpecifyKind(row.CreatedUtc, DateTimeKind.Utc),
            UpdatedUtc = DateTime.SpecifyKind(row.UpdatedUtc, DateTimeKind.Utc),
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
