using System.Text.Json;

using ArchLucid.Core.Retrieval;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Retrieval;

/// <summary>SQL read path for <see cref="IRetrievalGroundingTraceReader" />.</summary>
public sealed class DapperRetrievalGroundingTraceReader(ISqlConnectionFactory connectionFactory)
    : IRetrievalGroundingTraceReader
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<IReadOnlyList<RetrievalGroundingTraceRecord>> GetByRunIdAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid runId,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT
                               TraceId,
                               TenantId,
                               WorkspaceId,
                               ProjectId,
                               RunId,
                               AgentName,
                               RetrievedChunkIdsJson,
                               TokensIn,
                               TokensOut,
                               CitationCoverage,
                               QueryText,
                               TopK,
                               CorpusKind,
                               ScoresJson,
                               DocumentIdsJson,
                               AgentExecutionTraceId,
                               CreatedUtc
                           FROM dbo.RetrievalGroundingTrace
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND RunId = @RunId
                           ORDER BY CreatedUtc ASC;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<RetrievalGroundingTraceRow> rows = await connection.QueryAsync<RetrievalGroundingTraceRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId, RunId = runId },
                cancellationToken: cancellationToken));

        List<RetrievalGroundingTraceRecord> result = [];

        foreach (RetrievalGroundingTraceRow row in rows)
        {
            result.Add(MapRow(row));
        }

        return result;
    }

    private static RetrievalGroundingTraceRecord MapRow(RetrievalGroundingTraceRow row)
    {
        IReadOnlyList<string> chunkIds = [];

        if (!string.IsNullOrWhiteSpace(row.RetrievedChunkIdsJson))
        {
            try
            {
                chunkIds = JsonSerializer.Deserialize<List<string>>(row.RetrievedChunkIdsJson, JsonOptions) ?? [];
            }
            catch (JsonException)
            {
                chunkIds = [];
            }
        }

        return new RetrievalGroundingTraceRecord
        {
            TraceId = row.TraceId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            RunId = row.RunId,
            AgentName = row.AgentName,
            RetrievedChunkIds = chunkIds,
            TokensIn = row.TokensIn,
            TokensOut = row.TokensOut,
            CitationCoverage = row.CitationCoverage,
            QueryText = row.QueryText,
            TopK = row.TopK,
            CorpusKind = row.CorpusKind,
            ScoresJson = row.ScoresJson,
            DocumentIdsJson = row.DocumentIdsJson,
            AgentExecutionTraceId = row.AgentExecutionTraceId,
            CreatedUtc = row.CreatedUtc,
        };
    }

    private sealed class RetrievalGroundingTraceRow
    {
        public Guid TraceId { get; set; }

        public Guid TenantId { get; set; }

        public Guid WorkspaceId { get; set; }

        public Guid ProjectId { get; set; }

        public Guid RunId { get; set; }

        public string AgentName { get; set; } = null!;

        public string RetrievedChunkIdsJson { get; set; } = null!;

        public int? TokensIn { get; set; }

        public int? TokensOut { get; set; }

        public double CitationCoverage { get; set; }

        public string? QueryText { get; set; }

        public int? TopK { get; set; }

        public string? CorpusKind { get; set; }

        public string? ScoresJson { get; set; }

        public string? DocumentIdsJson { get; set; }

        public string? AgentExecutionTraceId { get; set; }

        public DateTime CreatedUtc { get; set; }
    }
}
