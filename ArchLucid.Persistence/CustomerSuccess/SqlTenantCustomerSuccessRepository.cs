using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Core.Audit;
using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.CustomerSuccess;

/// <summary>
///     SQL-backed health scores and feedback. Maintenance path uses <see cref="SqlRowLevelSecurityBypassAmbient" />
///     together with <see cref="dbo.sp_TenantHealthScores_Upsert" />.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL Server–dependent repository.")]
public sealed class SqlTenantCustomerSuccessRepository(
    ISqlConnectionFactory connectionFactory,
    IRlsSessionContextApplicator rlsSessionContextApplicator,
    ITenantRepository tenantRepository) : ITenantCustomerSuccessRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly IRlsSessionContextApplicator _rlsSessionContextApplicator =
        rlsSessionContextApplicator ?? throw new ArgumentNullException(nameof(rlsSessionContextApplicator));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    /// <inheritdoc />
    public async Task<TenantHealthScoreRecord?> GetHealthScoreAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        await _rlsSessionContextApplicator.ApplyAsync(connection, ct);

        const string sql = """
                           SELECT TenantId,
                                  EngagementScore,
                                  BreadthScore,
                                  QualityScore,
                                  GovernanceScore,
                                  SupportScore,
                                  CompositeScore,
                                  UpdatedUtc
                           FROM dbo.TenantHealthScores
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId;
                           """;

        TenantHealthScoreSqlRow? row = await connection.QuerySingleOrDefaultAsync<TenantHealthScoreSqlRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId },
                cancellationToken: ct));

        if (row is null)
            return null;

        return new TenantHealthScoreRecord(
            row.TenantId,
            row.EngagementScore,
            row.BreadthScore,
            row.QualityScore,
            row.GovernanceScore,
            row.SupportScore,
            row.CompositeScore,
            new DateTimeOffset(row.UpdatedUtc, TimeSpan.Zero));
    }

    /// <inheritdoc />
    public async Task InsertProductFeedbackAsync(ProductFeedbackSubmission submission, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(submission);

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        await _rlsSessionContextApplicator.ApplyAsync(connection, ct);

        const string sql = """
                           INSERT INTO dbo.ProductFeedback (
                               FeedbackId,
                               TenantId, WorkspaceId, ProjectId,
                               FindingRef, RunId, Score, CommentText, CreatedUtc)
                           VALUES (
                               @FeedbackId,
                               @TenantId, @WorkspaceId, @ProjectId,
                               @FindingRef, @RunId, @Score, @CommentText, SYSUTCDATETIME());
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    FeedbackId = Guid.NewGuid(),
                    submission.TenantId,
                    submission.WorkspaceId,
                    submission.ProjectId,
                    submission.FindingRef,
                    submission.RunId,
                    submission.Score,
                    CommentText = submission.Comment
                },
                cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task RefreshAllTenantHealthScoresAsync(CancellationToken ct)
    {
        using IDisposable _ = SqlRowLevelSecurityBypassAmbient.Enter();

        IReadOnlyList<TenantRecord> tenants = await _tenantRepository.ListAsync(ct);

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        await _rlsSessionContextApplicator.ApplyAsync(connection, ct);

        foreach (TenantRecord tenant in tenants)
        {
            TenantWorkspaceLink? link = await _tenantRepository.GetFirstWorkspaceAsync(tenant.Id, ct);

            if (link is null)
                continue;

            int runs7d = await CountRunsLastSevenDaysAsync(
                    connection,
                    tenant.Id,
                    link.WorkspaceId,
                    link.DefaultProjectId,
                    ct)
                .ConfigureAwait(false);

            int commits7d = await CountGoldenManifestsLastSevenDaysAsync(
                    connection,
                    tenant.Id,
                    link.WorkspaceId,
                    link.DefaultProjectId,
                    ct)
                .ConfigureAwait(false);

            int actors7d = await CountDistinctAuditActorsLastSevenDaysAsync(
                    connection,
                    tenant.Id,
                    link.WorkspaceId,
                    link.DefaultProjectId,
                    ct)
                .ConfigureAwait(false);

            int breadth30d = await CountBreadthSignalsLastThirtyDaysAsync(
                    connection,
                    tenant.Id,
                    link.WorkspaceId,
                    link.DefaultProjectId,
                    ct)
                .ConfigureAwait(false);

            (int totalSignals90d, int trusted90d) = await CountProductLearningSignalsAsync(
                    connection,
                    tenant.Id,
                    link.WorkspaceId,
                    link.DefaultProjectId,
                    ct)
                .ConfigureAwait(false);

            int govApproved30d = await CountGovernanceApprovalsLastThirtyDaysAsync(
                    connection,
                    tenant.Id,
                    link.WorkspaceId,
                    link.DefaultProjectId,
                    ct)
                .ConfigureAwait(false);

            decimal engagement = TenantHealthScoringCalculator.EngagementScore(runs7d, commits7d, actors7d);
            decimal breadth = TenantHealthScoringCalculator.BreadthScore(breadth30d);
            decimal quality = TenantHealthScoringCalculator.QualityScore(totalSignals90d, trusted90d);
            decimal governance = TenantHealthScoringCalculator.GovernanceScore(govApproved30d);
            decimal support = TenantHealthScoringCalculator.NeutralSupportScore();

            decimal composite = TenantHealthScoringCalculator.CompositeScore(
                engagement,
                breadth,
                quality,
                governance,
                support);

            await connection.ExecuteAsync(
                new CommandDefinition(
                    "dbo.sp_TenantHealthScores_Upsert",
                    new
                    {
                        TenantId = tenant.Id,
                        link.WorkspaceId,
                        ProjectId = link.DefaultProjectId,
                        EngagementScore = engagement,
                        BreadthScore = breadth,
                        QualityScore = quality,
                        GovernanceScore = governance,
                        SupportScore = support,
                        CompositeScore = composite
                    },
                    commandType: CommandType.StoredProcedure,
                    cancellationToken: ct));
        }
    }

    private static async Task<int> CountRunsLastSevenDaysAsync(
        SqlConnection connection,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        const string sql = """
                           SELECT COUNT_BIG(1)
                           FROM dbo.Runs
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ProjectId
                             AND ArchivedUtc IS NULL
                             AND CreatedUtc >= DATEADD(DAY, -7, SYSUTCDATETIME());
                           """;

        long count = await connection.ExecuteScalarAsync<long>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId },
                cancellationToken: ct));

        return (int)Math.Min(int.MaxValue, count);
    }

    private static async Task<int> CountGoldenManifestsLastSevenDaysAsync(
        SqlConnection connection,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        const string sql = """
                             SELECT COUNT_BIG(1)
                             FROM dbo.GoldenManifests gm
                             INNER JOIN dbo.Runs r ON r.RunId = gm.RunId
                             WHERE r.TenantId = @TenantId
                               AND r.WorkspaceId = @WorkspaceId
                               AND r.ScopeProjectId = @ProjectId
                               AND r.ArchivedUtc IS NULL
                               AND gm.CreatedUtc >= DATEADD(DAY, -7, SYSUTCDATETIME());
                             """;

        long n = await connection.ExecuteScalarAsync<long>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId },
                cancellationToken: ct));

        return (int)Math.Min(int.MaxValue, n);
    }

    private static async Task<int> CountDistinctAuditActorsLastSevenDaysAsync(
        SqlConnection connection,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        const string sql = """
                             SELECT COUNT_BIG(DISTINCT ActorUserId)
                             FROM dbo.AuditEvents
                             WHERE TenantId = @TenantId
                               AND WorkspaceId = @WorkspaceId
                               AND ProjectId = @ProjectId
                               AND OccurredUtc >= DATEADD(DAY, -7, SYSUTCDATETIME());
                             """;

        long n = await connection.ExecuteScalarAsync<long>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId },
                cancellationToken: ct));

        return (int)Math.Min(int.MaxValue, n);
    }

    private static async Task<int> CountBreadthSignalsLastThirtyDaysAsync(
        SqlConnection connection,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        const string sql = """
                             SELECT COUNT_BIG(1)
                             FROM dbo.AuditEvents
                             WHERE TenantId = @TenantId
                               AND WorkspaceId = @WorkspaceId
                               AND ProjectId = @ProjectId
                               AND OccurredUtc >= DATEADD(DAY, -30, SYSUTCDATETIME())
                               AND EventType IN (
                                   @Comparison,
                                   @Replay,
                                   @Provenance,
                                   @ArtifactDl,
                                   @BundleDl,
                                   @RunExported,
                                   @DocxExport,
                                   @ReviewTrail,
                                   @FindingsList);
                             """;

        long n = await connection.ExecuteScalarAsync<long>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    Comparison = AuditEventTypes.ComparisonSummaryPersisted,
                    Replay = AuditEventTypes.ReplayExecuted,
                    Provenance = AuditEventTypes.ProvenanceAccessed,
                    ArtifactDl = AuditEventTypes.ArtifactDownloaded,
                    BundleDl = AuditEventTypes.BundleDownloaded,
                    RunExported = AuditEventTypes.RunExported,
                    DocxExport = AuditEventTypes.ArchitectureDocxExportGenerated,
                    ReviewTrail = AuditEventTypes.ReviewTrailAccessed,
                    FindingsList = AuditEventTypes.FindingsListAccessed
                },
                cancellationToken: ct));

        return (int)Math.Min(int.MaxValue, n);
    }

    private static async Task<(int Total, int Trusted)> CountProductLearningSignalsAsync(
        SqlConnection connection,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        const string sql = """
                             SELECT
                                 COUNT_BIG(1) AS TotalCt,
                                 SUM(CASE WHEN Disposition = @Trusted THEN 1 ELSE 0 END) AS TrustedCt
                             FROM dbo.ProductLearningPilotSignals
                             WHERE TenantId = @TenantId
                               AND WorkspaceId = @WorkspaceId
                               AND ProjectId = @ProjectId
                               AND RecordedUtc >= DATEADD(DAY, -90, SYSUTCDATETIME());
                             """;

        SignalAggRow? row = await connection.QuerySingleOrDefaultAsync<SignalAggRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    Trusted = ProductLearningDispositionValues.Trusted
                },
                cancellationToken: ct));

        if (row is null)
            return (0, 0);

        int total = (int)Math.Min(int.MaxValue, row.TotalCt);
        int trusted = (int)Math.Min(int.MaxValue, row.TrustedCt ?? 0L);

        return (total, trusted);
    }

    private static async Task<int> CountGovernanceApprovalsLastThirtyDaysAsync(
        SqlConnection connection,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        const string sql = """
                             SELECT COUNT_BIG(1)
                             FROM dbo.GovernanceApprovalRequests g
                             WHERE g.TenantId = @TenantId
                               AND g.WorkspaceId = @WorkspaceId
                               AND g.ProjectId = @ProjectId
                               AND g.Status = N'Approved'
                               AND g.ReviewedUtc >= DATEADD(DAY, -30, SYSUTCDATETIME());
                             """;

        long n = await connection.ExecuteScalarAsync<long>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId },
                cancellationToken: ct));

        return (int)Math.Min(int.MaxValue, n);
    }

    private sealed record TenantHealthScoreSqlRow(
        Guid TenantId,
        decimal EngagementScore,
        decimal BreadthScore,
        decimal QualityScore,
        decimal GovernanceScore,
        decimal SupportScore,
        decimal CompositeScore,
        DateTime UpdatedUtc);

    private sealed record SignalAggRow(long TotalCt, long? TrustedCt);
}
