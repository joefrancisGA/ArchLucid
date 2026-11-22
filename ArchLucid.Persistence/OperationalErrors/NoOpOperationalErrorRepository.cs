using ArchLucid.Core.OperationalErrors;

namespace ArchLucid.Persistence.OperationalErrors;

/// <summary>No-op operational error repository for in-memory storage provider.</summary>
public sealed class NoOpOperationalErrorRepository : IOperationalErrorRepository
{
    public Task AppendAsync(OperationalErrorRecord record, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<OperationalErrorRecord>> SearchAsync(
        OperationalErrorSearchCriteria criteria,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult<IReadOnlyList<OperationalErrorRecord>>(Array.Empty<OperationalErrorRecord>());
    }

    public Task<OperationalErrorRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult<OperationalErrorRecord?>(null);
    }

    public Task<int> DeleteOlderThanAsync(DateTime cutoffUtc, int maxRows, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(0);
    }
}
