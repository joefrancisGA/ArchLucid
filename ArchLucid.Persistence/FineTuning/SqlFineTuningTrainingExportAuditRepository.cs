using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Persistence.ApplicationPorts.FineTuning;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.FineTuning;

[ExcludeFromCodeCoverage(Justification = "SQL integration; covered via API integration tests.")]
public sealed class SqlFineTuningTrainingExportAuditRepository(
    IBackgroundWorkerSqlConnectionFactory connectionFactory,
    SqlResilientOperationExecutor sqlOperations) : IFineTuningTrainingExportAuditRepository
{
    private readonly IBackgroundWorkerSqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly SqlResilientOperationExecutor _sqlOperations =
        sqlOperations ?? throw new ArgumentNullException(nameof(sqlOperations));

    /// <inheritdoc />
    public Task InsertAsync(FineTuningTrainingExportAuditRecord record, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => InsertCoreAsync(record, ct), cancellationToken);

    private async Task InsertCoreAsync(FineTuningTrainingExportAuditRecord record, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);

        if (record.TenantId == Guid.Empty)
            throw new ArgumentException("TenantId is required.", nameof(record));

        const string sql = """
                             INSERT INTO dbo.FineTuningTrainingExportAudits
                                 (ExportAuditId, TenantId, WorkspaceId, ProjectId,
                                  ManifestCount, RecordCount, BundleContentHash, ConsentSnapshot, CreatedUtc)
                             VALUES
                                 (@ExportAuditId, @TenantId, @WorkspaceId, @ProjectId,
                                  @ManifestCount, @RecordCount, @BundleContentHash, @ConsentSnapshot, @CreatedUtc);
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    record.ExportAuditId,
                    record.TenantId,
                    record.WorkspaceId,
                    record.ProjectId,
                    record.ManifestCount,
                    record.RecordCount,
                    record.BundleContentHash,
                    record.ConsentSnapshot,
                    CreatedUtc = record.CreatedUtc == default ? TimeProvider.System.UtcNowDateTime() : record.CreatedUtc,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);
    }
}
