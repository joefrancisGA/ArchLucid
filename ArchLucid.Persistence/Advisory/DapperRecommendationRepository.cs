using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Advisory;

/// <inheritdoc cref="IRecommendationRepository" />
/// <remarks>Uses a single <c>MERGE</c> statement keyed on <see cref="RecommendationRecord.RecommendationId"/>.</remarks>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class DapperRecommendationRepository(ISqlConnectionFactory connectionFactory) : IRecommendationRepository
{
    /// <inheritdoc />
    public async Task UpsertAsync(RecommendationRecord recommendation, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(recommendation);

        const string sql = """
            MERGE dbo.RecommendationRecords AS target
            USING (SELECT @RecommendationId AS RecommendationId, @TenantId AS TenantId) AS source
            ON target.RecommendationId = source.RecommendationId AND target.TenantId = source.TenantId
            WHEN MATCHED THEN
                UPDATE SET
                    TenantId = @TenantId,
                    WorkspaceId = @WorkspaceId,
                    ProjectId = @ProjectId,
                    RunId = @RunId,
                    ComparedToRunId = @ComparedToRunId,
                    Title = @Title,
                    Category = @Category,
                    Rationale = @Rationale,
                    SuggestedAction = @SuggestedAction,
                    Urgency = @Urgency,
                    ExpectedImpact = @ExpectedImpact,
                    PriorityScore = @PriorityScore,
                    Status = @Status,
                    LastUpdatedUtc = @LastUpdatedUtc,
                    ReviewedByUserId = @ReviewedByUserId,
                    ReviewedByUserName = @ReviewedByUserName,
                    ReviewComment = @ReviewComment,
                    ResolutionRationale = @ResolutionRationale,
                    SupportingFindingIdsJson = @SupportingFindingIdsJson,
                    SupportingDecisionIdsJson = @SupportingDecisionIdsJson,
                    SupportingArtifactIdsJson = @SupportingArtifactIdsJson,
                    SourceEvidenceLinksJson = @SourceEvidenceLinksJson
            WHEN NOT MATCHED THEN
                INSERT
                (
                    RecommendationId,
                    TenantId, WorkspaceId, ProjectId,
                    RunId, ComparedToRunId,
                    Title, Category, Rationale, SuggestedAction, Urgency, ExpectedImpact,
                    PriorityScore, Status, CreatedUtc, LastUpdatedUtc,
                    ReviewedByUserId, ReviewedByUserName, ReviewComment, ResolutionRationale,
                    SupportingFindingIdsJson, SupportingDecisionIdsJson, SupportingArtifactIdsJson,
                    SourceEvidenceLinksJson
                )
                VALUES
                (
                    @RecommendationId,
                    @TenantId, @WorkspaceId, @ProjectId,
                    @RunId, @ComparedToRunId,
                    @Title, @Category, @Rationale, @SuggestedAction, @Urgency, @ExpectedImpact,
                    @PriorityScore, @Status, @CreatedUtc, @LastUpdatedUtc,
                    @ReviewedByUserId, @ReviewedByUserName, @ReviewComment, @ResolutionRationale,
                    @SupportingFindingIdsJson, @SupportingDecisionIdsJson, @SupportingArtifactIdsJson,
                    @SourceEvidenceLinksJson
                );
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await connection.ExecuteAsync(new CommandDefinition(sql, recommendation, cancellationToken: ct));
    }

    public async Task<RecommendationRecord?> GetByIdAsync(ScopeContext scope, Guid recommendationId, CancellationToken ct)
    {
        PersistenceTenantScope.RequireScopedTenant(scope);
        const string sql = """
            SELECT RecommendationId,
                   TenantId, WorkspaceId, ProjectId,
                   RunId, ComparedToRunId,
                   Title, Category, Rationale, SuggestedAction, Urgency, ExpectedImpact,
                   PriorityScore, Status, CreatedUtc, LastUpdatedUtc,
                   ReviewedByUserId, ReviewedByUserName, ReviewComment, ResolutionRationale,
                   SupportingFindingIdsJson, SupportingDecisionIdsJson, SupportingArtifactIdsJson,
                   SourceEvidenceLinksJson
            FROM dbo.RecommendationRecords
            WHERE RecommendationId = @RecommendationId
              AND TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        return await connection.QueryFirstOrDefaultAsync<RecommendationRecord>(
            new CommandDefinition(sql, new
            {
                RecommendationId = recommendationId,
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId
            }, cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<RecommendationRecord>> ListByRunAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid runId,
        CancellationToken ct)
    {
        const string sql = """
            SELECT TOP 500 RecommendationId,
                   TenantId, WorkspaceId, ProjectId,
                   RunId, ComparedToRunId,
                   Title, Category, Rationale, SuggestedAction, Urgency, ExpectedImpact,
                   PriorityScore, Status, CreatedUtc, LastUpdatedUtc,
                   ReviewedByUserId, ReviewedByUserName, ReviewComment, ResolutionRationale,
                   SupportingFindingIdsJson, SupportingDecisionIdsJson, SupportingArtifactIdsJson,
                   SourceEvidenceLinksJson
            FROM dbo.RecommendationRecords WITH (NOLOCK)
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
              AND RunId = @RunId
            ORDER BY PriorityScore DESC, CreatedUtc DESC;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        IEnumerable<RecommendationRecord> result = await connection.QueryAsync<RecommendationRecord>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    RunId = runId
                },
                cancellationToken: ct));

        return result.ToList();
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<RecommendationRecord>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string? status,
        int take,
        CancellationToken ct)
    {
        const string sql = """
            SELECT TOP (@Take) RecommendationId,
                   TenantId, WorkspaceId, ProjectId,
                   RunId, ComparedToRunId,
                   Title, Category, Rationale, SuggestedAction, Urgency, ExpectedImpact,
                   PriorityScore, Status, CreatedUtc, LastUpdatedUtc,
                   ReviewedByUserId, ReviewedByUserName, ReviewComment, ResolutionRationale,
                   SupportingFindingIdsJson, SupportingDecisionIdsJson, SupportingArtifactIdsJson,
                   SourceEvidenceLinksJson
            FROM dbo.RecommendationRecords WITH (NOLOCK)
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
              AND (@Status IS NULL OR Status = @Status)
            ORDER BY LastUpdatedUtc DESC;
            """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        IEnumerable<RecommendationRecord> result = await connection.QueryAsync<RecommendationRecord>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    Status = status,
                    Take = Math.Clamp(take <= 0 ? 50 : take, 1, 500)
                },
                cancellationToken: ct));

        return result.ToList();
    }
}
