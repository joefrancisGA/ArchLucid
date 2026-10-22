using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class DapperCoverageAssignmentRepository(IDbConnectionFactory connectionFactory)
    : ICoverageAssignmentRepository
{
    public async Task AddAsync(CoverageAssignment assignment, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(assignment);

        const string sql = """
                           INSERT INTO dbo.CoverageAssignments
                           (
                               CoverageAssignmentId,
                               TenantId,
                               WorkspaceId,
                               ProjectId,
                               RunId,
                               PolicyPackId,
                               PolicyPackVersion,
                               CoverageType,
                               SelectionState,
                               RecommendationConfidence,
                               RecommendationTrigger,
                               RecommendationRationale,
                               TriggeringEvidenceRef,
                               ExclusionReason,
                               ActorUserId,
                               CreatedUtc,
                               EvaluationVersion
                           )
                           VALUES
                           (
                               @CoverageAssignmentId,
                               @TenantId,
                               @WorkspaceId,
                               @ProjectId,
                               @RunId,
                               @PolicyPackId,
                               @PolicyPackVersion,
                               @CoverageType,
                               @SelectionState,
                               @RecommendationConfidence,
                               @RecommendationTrigger,
                               @RecommendationRationale,
                               @TriggeringEvidenceRef,
                               @ExclusionReason,
                               @ActorUserId,
                               @CreatedUtc,
                               @EvaluationVersion
                           );
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(new CommandDefinition(
            sql,
            new
            {
                assignment.CoverageAssignmentId,
                assignment.TenantId,
                assignment.WorkspaceId,
                assignment.ProjectId,
                RunId = assignment.RunId is null ? (Guid?)null : SqlRunIdMapping.ToSqlRunId(assignment.RunId),
                assignment.PolicyPackId,
                assignment.PolicyPackVersion,
                CoverageType = assignment.CoverageType.ToString(),
                SelectionState = assignment.SelectionState.ToString(),
                RecommendationConfidence = assignment.RecommendationConfidence?.ToString(),
                assignment.RecommendationTrigger,
                assignment.RecommendationRationale,
                assignment.TriggeringEvidenceRef,
                assignment.ExclusionReason,
                assignment.ActorUserId,
                assignment.CreatedUtc,
                assignment.EvaluationVersion,
            },
            cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<CoverageAssignment>> ListByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        PersistenceTenantScope.RequireRunChildScope(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        string sql = $"""
                     SELECT
                         c.CoverageAssignmentId,
                         c.TenantId,
                         c.WorkspaceId,
                         c.ProjectId,
                         c.RunId,
                         c.PolicyPackId,
                         c.PolicyPackVersion,
                         c.CoverageType,
                         c.SelectionState,
                         c.RecommendationConfidence,
                         c.RecommendationTrigger,
                         c.RecommendationRationale,
                         c.TriggeringEvidenceRef,
                         c.ExclusionReason,
                         c.ActorUserId,
                         c.CreatedUtc,
                         c.EvaluationVersion
                     FROM dbo.CoverageAssignments c
                     {PersistenceTenantScope.InnerJoinRuns("c")}
                     WHERE c.RunId = @RunId
                       AND {PersistenceTenantScope.RunChildScopeWhereClause}
                     ORDER BY c.CreatedUtc;
                     """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<CoverageAssignmentRepositoryCore.CoverageAssignmentRow> rows =
            await connection.QueryAsync<CoverageAssignmentRepositoryCore.CoverageAssignmentRow>(
            new CommandDefinition(
                sql,
                new
                {
                    RunId = SqlRunIdMapping.ToSqlRunId(runId),
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                },
                cancellationToken: cancellationToken));

        return rows.Select(CoverageAssignmentRepositoryCore.ToAssignment).ToList();
    }

    public async Task<IReadOnlyList<CoverageAssignment>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT
                               CoverageAssignmentId,
                               TenantId,
                               WorkspaceId,
                               ProjectId,
                               RunId,
                               PolicyPackId,
                               PolicyPackVersion,
                               CoverageType,
                               SelectionState,
                               RecommendationConfidence,
                               RecommendationTrigger,
                               RecommendationRationale,
                               TriggeringEvidenceRef,
                               ExclusionReason,
                               ActorUserId,
                               CreatedUtc,
                               EvaluationVersion
                           FROM dbo.CoverageAssignments
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND RunId IS NULL
                           ORDER BY CreatedUtc;
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<CoverageAssignmentRepositoryCore.CoverageAssignmentRow> rows =
            await connection.QueryAsync<CoverageAssignmentRepositoryCore.CoverageAssignmentRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId },
                cancellationToken: cancellationToken));

        return rows.Select(CoverageAssignmentRepositoryCore.ToAssignment).ToList();
    }

}
