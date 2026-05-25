using System.Text.Json;

using ArchLucid.Core.Retrieval;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Retrieval;

/// <summary>SQL persistence for <see cref="IRetrievalGroundingTraceWriter" />.</summary>
public sealed class DapperRetrievalGroundingTraceWriter(ISqlConnectionFactory connectionFactory)
    : IRetrievalGroundingTraceWriter
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task AppendAsync(RetrievalGroundingTraceInsert insert, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(insert);

        if (insert.TenantId == Guid.Empty)
            throw new ArgumentException("TenantId is required.", nameof(insert));

        if (string.IsNullOrWhiteSpace(insert.AgentName))
            throw new ArgumentException("AgentName is required.", nameof(insert));

        string chunkIdsJson = JsonSerializer.Serialize(insert.RetrievedChunkIds ?? [], JsonOptions);

        const string sql = """
                           INSERT INTO dbo.RetrievalGroundingTrace
                           (
                               TenantId, WorkspaceId, ProjectId, RunId, AgentName,
                               RetrievedChunkIdsJson, TokensIn, TokensOut, CitationCoverage, CreatedUtc
                           )
                           VALUES
                           (
                               @TenantId, @WorkspaceId, @ProjectId, @RunId, @AgentName,
                               @RetrievedChunkIdsJson, @TokensIn, @TokensOut, @CitationCoverage, @CreatedUtc
                           );
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    insert.TenantId,
                    insert.WorkspaceId,
                    insert.ProjectId,
                    insert.RunId,
                    AgentName = insert.AgentName.Trim(),
                    RetrievedChunkIdsJson = chunkIdsJson,
                    insert.TokensIn,
                    insert.TokensOut,
                    insert.CitationCoverage,
                    insert.CreatedUtc,
                },
                cancellationToken: cancellationToken));
    }
}
