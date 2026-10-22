using ArchLucid.Core.OperationalErrors;

namespace ArchLucid.Persistence.OperationalErrors;

/// <summary>No-op operational error repository for in-memory storage provider.</summary>
public sealed class NoOpOperationalErrorRepository : IOperationalErrorRepository
{
    public Task AppendAsync(OperationalErrorRecord record, CancellationToken cancellationToken) =>
        Task.CompletedTask;

    public Task<IReadOnlyList<OperationalErrorRecord>> SearchAsync(
        OperationalErrorSearchCriteria criteria,
        CancellationToken cancellationToken) =>
        Task.FromResult<IReadOnlyList<OperationalErrorRecord>>(Array.Empty<OperationalErrorRecord>());

    public Task<OperationalErrorRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        Task.FromResult<OperationalErrorRecord?>(null);

    public Task<int> DeleteOlderThanAsync(DateTime cutoffUtc, int maxRows, CancellationToken cancellationToken) =>
        Task.FromResult(0);
}
