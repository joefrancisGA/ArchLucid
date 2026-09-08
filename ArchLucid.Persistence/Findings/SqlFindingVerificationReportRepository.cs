using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Findings;

[ExcludeFromCodeCoverage(Justification = "SQL Server–dependent repository.")]
public sealed class SqlFindingVerificationReportRepository(ISqlConnectionFactory connectionFactory)
    : IAppendOnlyFindingVerificationReportRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<FindingVerificationReportRecord> AppendAsync(
        FindingVerificationReportAppend append,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(append);

        Guid reportId = Guid.NewGuid();
        string reportHash = FindingVerificationReportHashComputer.Compute(
            append.RunId,
            append.SourceManifestHash,
            append.SourceFindingsSnapshotId,
            append.VerificationFindingsSnapshotId,
            append.Results);

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await using SqlTransaction transaction = (SqlTransaction)await connection.BeginTransactionAsync(cancellationToken);

        const string insertReportSql = """
                                       INSERT INTO dbo.FindingVerificationReports (
                                           ReportId,
                                           TenantId,
                                           WorkspaceId,
                                           ScopeProjectId,
                                           RunId,
                                           SourceManifestHash,
                                           SourceFindingsSnapshotId,
                                           VerificationFindingsSnapshotId,
                                           ReportHash,
                                           TriggeredByUserId,
                                           CreatedUtc)
                                       VALUES (
                                           @ReportId,
                                           @TenantId,
                                           @WorkspaceId,
                                           @ScopeProjectId,
                                           @RunId,
                                           @SourceManifestHash,
                                           @SourceFindingsSnapshotId,
                                           @VerificationFindingsSnapshotId,
                                           @ReportHash,
                                           @TriggeredByUserId,
                                           SYSUTCDATETIME());
                                       """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                insertReportSql,
                new
                {
                    ReportId = reportId,
                    append.TenantId,
                    append.WorkspaceId,
                    ScopeProjectId = append.ScopeProjectId,
                    append.RunId,
                    append.SourceManifestHash,
                    append.SourceFindingsSnapshotId,
                    append.VerificationFindingsSnapshotId,
                    ReportHash = reportHash,
                    append.TriggeredByUserId,
                },
                transaction,
                cancellationToken: cancellationToken));

        const string insertResultSql = """
                                       INSERT INTO dbo.FindingVerificationResults (
                                           ResultId,
                                           ReportId,
                                           FindingId,
                                           Status,
                                           TraceText)
                                       VALUES (
                                           @ResultId,
                                           @ReportId,
                                           @FindingId,
                                           @Status,
                                           @TraceText);
                                       """;

        foreach (FindingVerificationResultAppend result in append.Results)
        {
            await connection.ExecuteAsync(
                new CommandDefinition(
                    insertResultSql,
                    new
                    {
                        ResultId = Guid.NewGuid(),
                        ReportId = reportId,
                        result.FindingId,
                        Status = (byte)result.Status,
                        result.TraceText,
                    },
                    transaction,
                    cancellationToken: cancellationToken));
        }

        await transaction.CommitAsync(cancellationToken);

        FindingVerificationReportRecord? record = await GetByIdInternalAsync(
            connection,
            append.TenantId,
            append.WorkspaceId,
            append.ScopeProjectId,
            reportId,
            cancellationToken);

        return record ?? throw new InvalidOperationException("Verification report insert did not persist.");
    }

    public async Task<FindingVerificationReportRecord?> GetByIdAsync(
        ScopeContext scope,
        Guid reportId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await GetByIdInternalAsync(
            connection,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            reportId,
            cancellationToken);
    }

    public async Task<FindingVerificationReportRecord?> TryGetLatestByPackagePairAsync(
        ScopeContext scope,
        Guid runId,
        Guid sourceFindingsSnapshotId,
        Guid? verificationFindingsSnapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string reportSql = """
                                 SELECT TOP (1)
                                     ReportId,
                                     TenantId,
                                     WorkspaceId,
                                     ScopeProjectId,
                                     RunId,
                                     SourceManifestHash,
                                     SourceFindingsSnapshotId,
                                     VerificationFindingsSnapshotId,
                                     ReportHash,
                                     TriggeredByUserId,
                                     CreatedUtc
                                 FROM dbo.FindingVerificationReports
                                 WHERE TenantId = @TenantId
                                   AND WorkspaceId = @WorkspaceId
                                   AND ScopeProjectId = @ScopeProjectId
                                   AND RunId = @RunId
                                   AND SourceFindingsSnapshotId = @SourceFindingsSnapshotId
                                   AND (
                                       (@VerificationFindingsSnapshotId IS NULL AND VerificationFindingsSnapshotId IS NULL)
                                       OR VerificationFindingsSnapshotId = @VerificationFindingsSnapshotId)
                                 ORDER BY CreatedUtc DESC;
                                 """;

        FindingVerificationReportSqlRow? header = await connection.QuerySingleOrDefaultAsync<FindingVerificationReportSqlRow>(
            new CommandDefinition(
                reportSql,
                new
                {
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    RunId = runId,
                    SourceFindingsSnapshotId = sourceFindingsSnapshotId,
                    VerificationFindingsSnapshotId = verificationFindingsSnapshotId,
                },
                cancellationToken: cancellationToken));

        if (header is null)
        {
            return null;
        }

        return await GetByIdInternalAsync(
            connection,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            header.ReportId,
            cancellationToken);
    }

    private static async Task<FindingVerificationReportRecord?> GetByIdInternalAsync(
        SqlConnection connection,
        Guid tenantId,
        Guid workspaceId,
        Guid scopeProjectId,
        Guid reportId,
        CancellationToken cancellationToken)
    {
        const string reportSql = """
                                 SELECT
                                     ReportId,
                                     TenantId,
                                     WorkspaceId,
                                     ScopeProjectId,
                                     RunId,
                                     SourceManifestHash,
                                     SourceFindingsSnapshotId,
                                     VerificationFindingsSnapshotId,
                                     ReportHash,
                                     TriggeredByUserId,
                                     CreatedUtc
                                 FROM dbo.FindingVerificationReports
                                 WHERE TenantId = @TenantId
                                   AND WorkspaceId = @WorkspaceId
                                   AND ScopeProjectId = @ScopeProjectId
                                   AND ReportId = @ReportId;
                                 """;

        FindingVerificationReportSqlRow? header = await connection.QuerySingleOrDefaultAsync<FindingVerificationReportSqlRow>(
            new CommandDefinition(
                reportSql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ScopeProjectId = scopeProjectId,
                    ReportId = reportId,
                },
                cancellationToken: cancellationToken));

        if (header is null)
        {
            return null;
        }

        const string resultsSql = """
                                  SELECT ResultId, ReportId, FindingId, Status, TraceText
                                  FROM dbo.FindingVerificationResults
                                  WHERE ReportId = @ReportId
                                  ORDER BY FindingId ASC;
                                  """;

        IEnumerable<FindingVerificationResultSqlRow> resultRows = await connection.QueryAsync<FindingVerificationResultSqlRow>(
            new CommandDefinition(
                resultsSql,
                new { ReportId = reportId },
                cancellationToken: cancellationToken));

        IReadOnlyList<FindingVerificationResultRecord> results = resultRows
            .Select(row => new FindingVerificationResultRecord
            {
                ResultId = row.ResultId,
                ReportId = row.ReportId,
                FindingId = row.FindingId,
                Status = (FindingVerificationStatus)row.Status,
                TraceText = row.TraceText,
            })
            .ToList();

        return new FindingVerificationReportRecord
        {
            ReportId = header.ReportId,
            TenantId = header.TenantId,
            WorkspaceId = header.WorkspaceId,
            ScopeProjectId = header.ScopeProjectId,
            RunId = header.RunId,
            SourceManifestHash = header.SourceManifestHash,
            SourceFindingsSnapshotId = header.SourceFindingsSnapshotId,
            VerificationFindingsSnapshotId = header.VerificationFindingsSnapshotId,
            ReportHash = header.ReportHash,
            TriggeredByUserId = header.TriggeredByUserId,
            CreatedUtc = header.CreatedUtc,
            Results = results,
        };
    }

    private sealed class FindingVerificationReportSqlRow
    {
        public Guid ReportId
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

        public Guid ScopeProjectId
        {
            get;
            init;
        }

        public Guid RunId
        {
            get;
            init;
        }

        public string SourceManifestHash
        {
            get;
            init;
        } = string.Empty;

        public Guid SourceFindingsSnapshotId
        {
            get;
            init;
        }

        public Guid? VerificationFindingsSnapshotId
        {
            get;
            init;
        }

        public string ReportHash
        {
            get;
            init;
        } = string.Empty;

        public string TriggeredByUserId
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

    private sealed class FindingVerificationResultSqlRow
    {
        public Guid ResultId
        {
            get;
            init;
        }

        public Guid ReportId
        {
            get;
            init;
        }

        public string FindingId
        {
            get;
            init;
        } = string.Empty;

        public byte Status
        {
            get;
            init;
        }

        public string TraceText
        {
            get;
            init;
        } = string.Empty;
    }
}
