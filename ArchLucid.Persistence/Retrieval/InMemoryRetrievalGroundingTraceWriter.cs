using ArchLucid.Core.Retrieval;

namespace ArchLucid.Persistence.Retrieval;

/// <summary>In-memory/no-op grounding trace writer for tests and in-memory storage mode.</summary>
public sealed class InMemoryRetrievalGroundingTraceWriter : IRetrievalGroundingTraceWriter
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
}
