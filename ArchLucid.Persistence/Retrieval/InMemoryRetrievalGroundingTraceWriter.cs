using ArchLucid.Core.Retrieval;

namespace ArchLucid.Persistence.Retrieval;

/// <summary>In-memory grounding trace store for tests and in-memory storage mode.</summary>
public sealed class InMemoryRetrievalGroundingTraceWriter : IRetrievalGroundingTraceWriter, IRetrievalGroundingTraceReader
{
    private readonly List<RetrievalGroundingTraceInsert> _rows = [];
    private readonly Lock _sync = new();

    public IReadOnlyList<RetrievalGroundingTraceInsert> Rows
    {
        get
        {
            lock (_sync)
                return _rows.ToList();
        }
    }

    /// <inheritdoc />
    public Task AppendAsync(RetrievalGroundingTraceInsert insert, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(insert);
        cancellationToken.ThrowIfCancellationRequested();

        lock (_sync)
            _rows.Add(insert);

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<RetrievalGroundingTraceRecord>> GetByRunIdAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid runId,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_sync)
        {
            List<RetrievalGroundingTraceRecord> matches = _rows
                .Where(r =>
                    r.TenantId == tenantId
                    && r.WorkspaceId == workspaceId
                    && r.ProjectId == projectId
                    && r.RunId == runId)
                .Select(MapInsert)
                .ToList();

            return Task.FromResult<IReadOnlyList<RetrievalGroundingTraceRecord>>(matches);
        }
    }

    private static RetrievalGroundingTraceRecord MapInsert(RetrievalGroundingTraceInsert insert)
    {
        return new RetrievalGroundingTraceRecord
        {
            TraceId = Guid.NewGuid(),
            TenantId = insert.TenantId,
            WorkspaceId = insert.WorkspaceId,
            ProjectId = insert.ProjectId,
            RunId = insert.RunId,
            AgentName = insert.AgentName,
            RetrievedChunkIds = insert.RetrievedChunkIds.ToList(),
            TokensIn = insert.TokensIn,
            TokensOut = insert.TokensOut,
            CitationCoverage = insert.CitationCoverage,
            QueryText = insert.QueryText,
            TopK = insert.TopK,
            CorpusKind = insert.CorpusKind,
            ScoresJson = insert.ScoresJson,
            DocumentIdsJson = insert.DocumentIdsJson,
            AgentExecutionTraceId = insert.AgentExecutionTraceId,
            CreatedUtc = insert.CreatedUtc,
        };
    }
}
