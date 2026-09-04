using ArchLucid.Contracts.ProductLearning;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Coordination.ProductLearning;

public sealed partial class DapperProductLearningPilotSignalRepository
{
    public async Task InsertAsync(ProductLearningPilotSignalRecord record, CancellationToken cancellationToken)
    {
        ProductLearningPilotSignalRecord normalized = ProductLearningPilotSignalRepositoryCore.NormalizeInsert(
            record,
            static () => TimeProvider.System.UtcNowDateTime());

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(
            new CommandDefinition(
                ProductLearningPilotSignalSql.Insert,
                new
                {
                    SignalId = normalized.SignalId,
                    normalized.TenantId,
                    normalized.WorkspaceId,
                    normalized.ProjectId,
                    normalized.ArchitectureRunId,
                    normalized.AuthorityRunId,
                    normalized.ManifestVersion,
                    normalized.SubjectType,
                    normalized.Disposition,
                    normalized.PatternKey,
                    normalized.ArtifactHint,
                    normalized.CommentShort,
                    normalized.DetailJson,
                    normalized.RecordedByUserId,
                    normalized.RecordedByDisplayName,
                    RecordedUtc = normalized.RecordedUtc,
                    TriageStatus = normalized.TriageStatus
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
        int capped = ProductLearningPilotSignalRepositoryCore.ClampListTake(take);

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<ProductLearningPilotSignalRecord> rows =
            await connection.QueryAsync<ProductLearningPilotSignalRecord>(
                new CommandDefinition(
                    ProductLearningPilotSignalSql.ListRecentForScope,
                    new
                    {
                        Take = capped,
                        TenantId = tenantId,
                        WorkspaceId = workspaceId,
                        ProjectId = projectId
                    },
                    cancellationToken: cancellationToken));

        return rows.ToList();
    }
}
