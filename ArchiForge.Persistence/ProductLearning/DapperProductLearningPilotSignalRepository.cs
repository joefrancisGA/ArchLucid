using ArchiForge.Contracts.ProductLearning;
using ArchiForge.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchiForge.Persistence.ProductLearning;

/// <summary>Dapper access to <c>dbo.ProductLearningPilotSignals</c>.</summary>
public sealed class DapperProductLearningPilotSignalRepository(ISqlConnectionFactory connectionFactory)
    : IProductLearningPilotSignalRepository
{
    private const int MaxTake = 500;

    public async Task InsertAsync(ProductLearningPilotSignalRecord record, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);

        if (string.IsNullOrWhiteSpace(record.SubjectType))
        {
            throw new ArgumentException("SubjectType is required.", nameof(record));
        }

        if (string.IsNullOrWhiteSpace(record.Disposition))
        {
            throw new ArgumentException("Disposition is required.", nameof(record));
        }

        Guid signalId = record.SignalId == Guid.Empty ? Guid.NewGuid() : record.SignalId;
        DateTime recordedUtc = record.RecordedUtc == default ? DateTime.UtcNow : record.RecordedUtc;
        string triage = string.IsNullOrWhiteSpace(record.TriageStatus)
            ? ProductLearningTriageStatusValues.Open
            : record.TriageStatus;

        const string sql = """
            INSERT INTO dbo.ProductLearningPilotSignals
            (
                SignalId,
                TenantId,
                WorkspaceId,
                ProjectId,
                ArchitectureRunId,
                AuthorityRunId,
                ManifestVersion,
                SubjectType,
                Disposition,
                PatternKey,
                ArtifactHint,
                CommentShort,
                DetailJson,
                RecordedByUserId,
                RecordedByDisplayName,
                RecordedUtc,
                TriageStatus
            )
            VALUES
            (
                @SignalId,
                @TenantId,
                @WorkspaceId,
                @ProjectId,
                @ArchitectureRunId,
                @AuthorityRunId,
                @ManifestVersion,
                @SubjectType,
                @Disposition,
                @PatternKey,
                @ArtifactHint,
                @CommentShort,
                @DetailJson,
                @RecordedByUserId,
                @RecordedByDisplayName,
                @RecordedUtc,
                @TriageStatus
            );
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    SignalId = signalId,
                    record.TenantId,
                    record.WorkspaceId,
                    record.ProjectId,
                    ArchitectureRunId = record.ArchitectureRunId,
                    AuthorityRunId = record.AuthorityRunId,
                    ManifestVersion = record.ManifestVersion,
                    record.SubjectType,
                    record.Disposition,
                    PatternKey = record.PatternKey,
                    ArtifactHint = record.ArtifactHint,
                    CommentShort = record.CommentShort,
                    DetailJson = record.DetailJson,
                    RecordedByUserId = record.RecordedByUserId,
                    RecordedByDisplayName = record.RecordedByDisplayName,
                    RecordedUtc = recordedUtc,
                    TriageStatus = triage,
                },
                cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<ProductLearningPilotSignalRecord>> ListRecentForScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        int take,
        CancellationToken cancellationToken)
    {
        int capped = take < 1 ? 1 : Math.Min(take, MaxTake);

        const string sql = """
            SELECT TOP (@Take)
                SignalId,
                TenantId,
                WorkspaceId,
                ProjectId,
                ArchitectureRunId,
                AuthorityRunId,
                ManifestVersion,
                SubjectType,
                Disposition,
                PatternKey,
                ArtifactHint,
                CommentShort,
                DetailJson,
                RecordedByUserId,
                RecordedByDisplayName,
                RecordedUtc,
                TriageStatus
            FROM dbo.ProductLearningPilotSignals
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
            ORDER BY RecordedUtc DESC;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<ProductLearningPilotSignalRecord> rows = await connection.QueryAsync<ProductLearningPilotSignalRecord>(
            new CommandDefinition(
                sql,
                new { Take = capped, TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId },
                cancellationToken: cancellationToken));

        return rows.ToList();
    }
}
