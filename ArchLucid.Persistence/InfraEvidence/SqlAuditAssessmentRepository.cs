using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlAuditAssessmentRepository(ISqlConnectionFactory connectionFactory)
    : IAuditAssessmentRepository
{
    public async Task InsertAsync(AuditAssessmentRecord assessment, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(assessment);

        const string sql = """
                           INSERT INTO dbo.AuditAssessments
                           (
                               AssessmentId, TenantId, WorkspaceId, ProjectId, FrameworkId, FrameworkVersion,
                               ScopeJson, PeriodStartUtc, PeriodEndUtc, Status, RequestedBy, CreatedUtc
                           )
                           VALUES
                           (
                               @AssessmentId, @TenantId, @WorkspaceId, @ProjectId, @FrameworkId, @FrameworkVersion,
                               @ScopeJson, @PeriodStartUtc, @PeriodEndUtc, @Status, @RequestedBy, @CreatedUtc
                           );
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    assessment.AssessmentId,
                    assessment.TenantId,
                    assessment.WorkspaceId,
                    assessment.ProjectId,
                    assessment.FrameworkId,
                    assessment.FrameworkVersion,
                    assessment.ScopeJson,
                    assessment.PeriodStartUtc,
                    assessment.PeriodEndUtc,
                    Status = (int)assessment.Status,
                    assessment.RequestedBy,
                    assessment.CreatedUtc,
                },
                cancellationToken: cancellationToken));
    }

    public async Task InsertInScopeAsync(
        ProjectScopeKey scope,
        AuditAssessmentCreateMutation mutation,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           INSERT INTO dbo.AuditAssessments
                           (
                               AssessmentId, TenantId, WorkspaceId, ProjectId, FrameworkId, FrameworkVersion,
                               ScopeJson, PeriodStartUtc, PeriodEndUtc, Status, RequestedBy, CreatedUtc
                           )
                           VALUES
                           (
                               @AssessmentId, @TenantId, @WorkspaceId, @ProjectId, @FrameworkId, @FrameworkVersion,
                               @ScopeJson, @PeriodStartUtc, @PeriodEndUtc, @Status, @RequestedBy, @CreatedUtc
                           );
                           """;
        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await conn.ExecuteAsync(new CommandDefinition(sql, new
        {
            scope.TenantId, scope.WorkspaceId, scope.ProjectId,
            mutation.AssessmentId, mutation.FrameworkId, mutation.FrameworkVersion, mutation.ScopeJson,
            mutation.PeriodStartUtc, mutation.PeriodEndUtc, Status = (int)mutation.Status,
            mutation.RequestedBy, mutation.CreatedUtc,
        }, cancellationToken: cancellationToken));
    }

    public async Task<AuditAssessmentRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid assessmentId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT AssessmentId, TenantId, WorkspaceId, ProjectId, FrameworkId, FrameworkVersion,
                                  ScopeJson, PeriodStartUtc, PeriodEndUtc, Status, RequestedBy, CreatedUtc
                           FROM dbo.AuditAssessments
                           WHERE TenantId = @TenantId AND AssessmentId = @AssessmentId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        AssessmentRow? row = await conn.QuerySingleOrDefaultAsync<AssessmentRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, AssessmentId = assessmentId },
                cancellationToken: cancellationToken));

        return row is null ? null : Map(row);
    }

    public async Task<AuditAssessmentRecord?> TryGetByIdInScopeAsync(
        ProjectScopeKey scope,
        Guid assessmentId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT AssessmentId, TenantId, WorkspaceId, ProjectId, FrameworkId, FrameworkVersion,
                                  ScopeJson, PeriodStartUtc, PeriodEndUtc, Status, RequestedBy, CreatedUtc
                           FROM dbo.AuditAssessments
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND AssessmentId = @AssessmentId;
                           """;
        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        AssessmentRow? row = await conn.QuerySingleOrDefaultAsync<AssessmentRow>(
            new CommandDefinition(sql, new { scope.TenantId, scope.WorkspaceId, scope.ProjectId, AssessmentId = assessmentId }, cancellationToken: cancellationToken));
        return row is null ? null : Map(row);
    }

    public async Task<IReadOnlyList<AuditAssessmentRecord>> ListActiveByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT AssessmentId, TenantId, WorkspaceId, ProjectId, FrameworkId, FrameworkVersion,
                                  ScopeJson, PeriodStartUtc, PeriodEndUtc, Status, RequestedBy, CreatedUtc
                           FROM dbo.AuditAssessments
                           WHERE TenantId = @TenantId
                               AND Status <> @ArchivedStatus;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AssessmentRow> rows = await conn.QueryAsync<AssessmentRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, ArchivedStatus = (int)AuditAssessmentStatus.Archived },
                cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<AuditAssessmentRecord>> ListActiveByScopeAsync(
        ProjectScopeKey scope,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT AssessmentId, TenantId, WorkspaceId, ProjectId, FrameworkId, FrameworkVersion,
                                  ScopeJson, PeriodStartUtc, PeriodEndUtc, Status, RequestedBy, CreatedUtc
                           FROM dbo.AuditAssessments
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND Status <> @ArchivedStatus;
                           """;
        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<AssessmentRow> rows = await conn.QueryAsync<AssessmentRow>(
            new CommandDefinition(sql, new
            {
                scope.TenantId, scope.WorkspaceId, scope.ProjectId,
                ArchivedStatus = (int)AuditAssessmentStatus.Archived,
            }, cancellationToken: cancellationToken));
        return rows.Select(Map).ToList();
    }

    public async Task UpdateStatusAsync(
        Guid tenantId,
        Guid assessmentId,
        AuditAssessmentStatus status,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE dbo.AuditAssessments
                           SET Status = @Status
                           WHERE TenantId = @TenantId AND AssessmentId = @AssessmentId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, AssessmentId = assessmentId, Status = (int)status },
                cancellationToken: cancellationToken));
    }

    public async Task UpdateStatusInScopeAsync(
        ProjectScopeKey scope,
        AuditAssessmentStatusMutation mutation,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE dbo.AuditAssessments
                           SET Status = @Status
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND AssessmentId = @AssessmentId;
                           """;
        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        int affected = await conn.ExecuteAsync(new CommandDefinition(sql, new
        {
            scope.TenantId, scope.WorkspaceId, scope.ProjectId,
            mutation.AssessmentId, Status = (int)mutation.Status,
        }, cancellationToken: cancellationToken));
        if (affected != 1)
            throw new InvalidOperationException("Scoped audit assessment status mutation did not update exactly one record.");
    }

    private static AuditAssessmentRecord Map(AssessmentRow row) =>
        new()
        {
            AssessmentId = row.AssessmentId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            FrameworkId = row.FrameworkId,
            FrameworkVersion = row.FrameworkVersion,
            ScopeJson = row.ScopeJson,
            PeriodStartUtc = row.PeriodStartUtc,
            PeriodEndUtc = row.PeriodEndUtc,
            Status = (AuditAssessmentStatus)row.Status,
            RequestedBy = row.RequestedBy,
            CreatedUtc = row.CreatedUtc,
        };

    private sealed class AssessmentRow
    {
        public Guid AssessmentId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public Guid WorkspaceId
        {
            get;
            init;
        }

        public Guid ProjectId
        {
            get;
            init;
        }

        public Guid FrameworkId
        {
            get;
            init;
        }

        public string FrameworkVersion
        {
            get;
            init;
        } = string.Empty;

        public string ScopeJson
        {
            get;
            init;
        } = string.Empty;

        public DateTime? PeriodStartUtc
        {
            get;
            init;
        }

        public DateTime? PeriodEndUtc
        {
            get;
            init;
        }

        public int Status
        {
            get;
            init;
        }

        public string RequestedBy
        {
            get;
            init;
        } = string.Empty;

        public DateTime CreatedUtc
        {
            get;
            init;
        }
    }
}
