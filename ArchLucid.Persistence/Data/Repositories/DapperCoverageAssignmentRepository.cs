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
        RunChildRunScopeSql.RequireScope(scope);
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
                     {RunChildRunScopeSql.InnerJoinRuns("c")}
                     WHERE c.RunId = @RunId
                       AND {RunChildRunScopeSql.ScopeWhereClause}
                     ORDER BY c.CreatedUtc;
                     """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<CoverageAssignmentRow> rows = await connection.QueryAsync<CoverageAssignmentRow>(
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

        return rows.Select(ToAssignment).ToList();
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

        IEnumerable<CoverageAssignmentRow> rows = await connection.QueryAsync<CoverageAssignmentRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId },
                cancellationToken: cancellationToken));

        return rows.Select(ToAssignment).ToList();
    }

    private static CoverageAssignment ToAssignment(CoverageAssignmentRow row) => new()
    {
        CoverageAssignmentId = row.CoverageAssignmentId,
        TenantId = row.TenantId,
        WorkspaceId = row.WorkspaceId,
        ProjectId = row.ProjectId,
        RunId = row.RunId is null ? null : SqlRunIdMapping.ToContractRunId(row.RunId.Value),
        PolicyPackId = row.PolicyPackId,
        PolicyPackVersion = row.PolicyPackVersion,
        CoverageType = Enum.Parse<CoverageType>(row.CoverageType),
        SelectionState = Enum.Parse<CoverageSelectionState>(row.SelectionState),
        RecommendationConfidence = row.RecommendationConfidence is null
            ? null
            : Enum.Parse<RecommendationConfidence>(row.RecommendationConfidence),
        RecommendationTrigger = row.RecommendationTrigger,
        RecommendationRationale = row.RecommendationRationale,
        TriggeringEvidenceRef = row.TriggeringEvidenceRef,
        ExclusionReason = row.ExclusionReason,
        ActorUserId = row.ActorUserId,
        CreatedUtc = row.CreatedUtc,
        EvaluationVersion = row.EvaluationVersion,
    };

    private sealed class CoverageAssignmentRow
    {
        public Guid CoverageAssignmentId
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

        public Guid? RunId
        {
            get;
            set;
        }

        public Guid PolicyPackId
        {
            get;
            set;
        }

        public string PolicyPackVersion
        {
            get;
            set;
        } = string.Empty;

        public string CoverageType
        {
            get;
            set;
        } = string.Empty;

        public string SelectionState
        {
            get;
            set;
        } = string.Empty;

        public string? RecommendationConfidence
        {
            get;
            set;
        }

        public string? RecommendationTrigger
        {
            get;
            set;
        }

        public string? RecommendationRationale
        {
            get;
            set;
        }

        public string? TriggeringEvidenceRef
        {
            get;
            set;
        }

        public string? ExclusionReason
        {
            get;
            set;
        }

        public string ActorUserId
        {
            get;
            set;
        } = string.Empty;

        public DateTime CreatedUtc
        {
            get;
            set;
        }

        public string EvaluationVersion
        {
            get;
            set;
        } = string.Empty;
    }
}
