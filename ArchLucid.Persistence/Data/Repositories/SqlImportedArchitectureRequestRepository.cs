using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Models;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed class SqlImportedArchitectureRequestRepository(ISqlConnectionFactory connectionFactory)
    : IImportedArchitectureRequestRepository
{
    public async Task InsertAsync(ImportedArchitectureRequestRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
            INSERT INTO dbo.ImportedArchitectureRequests
            (ImportId, TenantId, WorkspaceId, ProjectId, CreatedUtc, SourceFileName, Format, Status, RequestJson)
            VALUES
            (@ImportId, @TenantId, @WorkspaceId, @ProjectId, @CreatedUtc, @SourceFileName, @Format, @Status, @RequestJson);
            """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    record.ImportId,
                    record.TenantId,
                    record.WorkspaceId,
                    record.ProjectId,
                    record.CreatedUtc,
                    record.SourceFileName,
                    record.Format,
                    record.Status,
                    record.RequestJson,
                },
                cancellationToken: cancellationToken));
    }
}
