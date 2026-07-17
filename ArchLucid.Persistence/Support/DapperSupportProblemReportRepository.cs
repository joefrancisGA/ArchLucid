using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Support;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Support;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via integration tests.")]
public sealed class DapperSupportProblemReportRepository(ISqlConnectionFactory connectionFactory)
    : ISupportProblemReportRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<SupportProblemReportRecord> InsertAsync(
        SupportProblemReportInsert insert,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(insert);

        Guid id = insert.Id != Guid.Empty ? insert.Id : Guid.NewGuid();

        const string sql = """
                           INSERT INTO dbo.SupportProblemReports
                               (Id, TenantId, WorkspaceId, ProjectId, SubmittedByActorId, ContextJson,
                                OperatorNote, CorrelationId, ClientRequestId, SupportBundleBlobPath, Status)
                           OUTPUT INSERTED.Id,
                                  INSERTED.TenantId,
                                  INSERTED.WorkspaceId,
                                  INSERTED.ProjectId,
                                  INSERTED.SubmittedByActorId,
                                  INSERTED.ContextJson,
                                  INSERTED.OperatorNote,
                                  INSERTED.CorrelationId,
                                  INSERTED.ClientRequestId,
                                  INSERTED.SupportBundleBlobPath,
                                  INSERTED.Status,
                                  INSERTED.CreatedUtc
                           VALUES
                               (@Id, @TenantId, @WorkspaceId, @ProjectId, @SubmittedByActorId, @ContextJson,
                                @OperatorNote, @CorrelationId, @ClientRequestId, @SupportBundleBlobPath, @Status);
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        SupportProblemReportRecord row = await connection.QuerySingleAsync<SupportProblemReportRecord>(
            new CommandDefinition(
                sql,
                new
                {
                    Id = id,
                    insert.TenantId,
                    insert.WorkspaceId,
                    insert.ProjectId,
                    insert.SubmittedByActorId,
                    insert.ContextJson,
                    insert.OperatorNote,
                    insert.CorrelationId,
                    insert.ClientRequestId,
                    insert.SupportBundleBlobPath,
                    Status = SupportProblemReportStatus.Open
                },
                cancellationToken: cancellationToken));

        return row;
    }

    public async Task<SupportProblemReportRecord?> GetByIdAsync(
        Guid tenantId,
        Guid reportId,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT Id, TenantId, WorkspaceId, ProjectId, SubmittedByActorId, ContextJson,
                                  OperatorNote, CorrelationId, ClientRequestId, SupportBundleBlobPath, Status, CreatedUtc
                           FROM dbo.SupportProblemReports
                           WHERE TenantId = @TenantId
                             AND Id = @Id;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<SupportProblemReportRecord>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, Id = reportId },
                cancellationToken: cancellationToken));
    }

    public async Task<SupportProblemReportRecord?> UpdateSupportBundleBlobPathAsync(
        Guid tenantId,
        Guid reportId,
        string supportBundleBlobPath,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(supportBundleBlobPath);

        const string sql = """
                           UPDATE dbo.SupportProblemReports
                           SET SupportBundleBlobPath = @SupportBundleBlobPath
                           OUTPUT INSERTED.Id,
                                  INSERTED.TenantId,
                                  INSERTED.WorkspaceId,
                                  INSERTED.ProjectId,
                                  INSERTED.SubmittedByActorId,
                                  INSERTED.ContextJson,
                                  INSERTED.OperatorNote,
                                  INSERTED.CorrelationId,
                                  INSERTED.ClientRequestId,
                                  INSERTED.SupportBundleBlobPath,
                                  INSERTED.Status,
                                  INSERTED.CreatedUtc
                           WHERE TenantId = @TenantId
                             AND Id = @Id;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<SupportProblemReportRecord>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, Id = reportId, SupportBundleBlobPath = supportBundleBlobPath },
                cancellationToken: cancellationToken));
    }
}
