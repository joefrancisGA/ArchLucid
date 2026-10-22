using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Repositories;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Thread-safe in-memory implementation of <see cref="IComparisonRecordRepository" /> for tests and in-memory hosts.
/// </summary>
/// <remarks>Filter and sort semantics mirror <see cref="ComparisonRecordRepository" /> for contract tests.</remarks>
public sealed class InMemoryComparisonRecordRepository : IComparisonRecordRepository
{
    private const int MaxEntries = 5_000;
    private readonly Lock _gate = new();

    private readonly List<ComparisonRecord> _items = [];

    /// <inheritdoc />
    public Task CreateAsync(ComparisonRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            if (_items.Count >= MaxEntries)
                _items.RemoveAt(0);

            _items.Add(ComparisonRecordRepositoryCore.Clone(record));
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<ComparisonRecord?> GetByIdAsync(string comparisonRecordId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            ComparisonRecord? row = _items.FirstOrDefault(r =>
                string.Equals(r.ComparisonRecordId, comparisonRecordId, StringComparison.Ordinal));

            return Task.FromResult(row is null ? null : ComparisonRecordRepositoryCore.Clone(row));
        }
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<ComparisonRecord>> GetByRunIdAsync(string runId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            List<ComparisonRecord> list = _items
                .Where(r =>
                    string.Equals(r.LeftRunId, runId, StringComparison.Ordinal) ||
                    string.Equals(r.RightRunId, runId, StringComparison.Ordinal))
                .OrderByDescending(r => r.CreatedUtc)
                .Select(r => ComparisonRecordListProjection.WithoutPayloadJson(ComparisonRecordRepositoryCore.Clone(r)))
                .ToList();

            return Task.FromResult<IReadOnlyList<ComparisonRecord>>(list);
        }
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<ComparisonRecord>> GetByExportRecordIdAsync(
        string exportRecordId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            List<ComparisonRecord> list = _items
                .Where(r =>
                    string.Equals(r.LeftExportRecordId, exportRecordId, StringComparison.Ordinal) ||
                    string.Equals(r.RightExportRecordId, exportRecordId, StringComparison.Ordinal))
                .OrderByDescending(r => r.CreatedUtc)
                .Select(r => ComparisonRecordListProjection.WithoutPayloadJson(ComparisonRecordRepositoryCore.Clone(r)))
                .ToList();

            return Task.FromResult<IReadOnlyList<ComparisonRecord>>(list);
        }
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<ComparisonRecord>> SearchAsync(
        string? comparisonType,
        string? leftRunId,
        string? rightRunId,
        DateTime? createdFromUtc,
        DateTime? createdToUtc,
        string? leftExportRecordId,
        string? rightExportRecordId,
        string? label,
        IReadOnlyList<string>? tags,
        string? sortBy,
        string? sortDir,
        int skip,
        int limit,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        int safeLimit = ComparisonRecordRepositoryCore.ClampLimit(limit);
        int safeSkip = ComparisonRecordRepositoryCore.ClampSkip(skip);

        lock (_gate)
        {
            IEnumerable<ComparisonRecord> query = _items.Select(ComparisonRecordRepositoryCore.Clone);
            query = ComparisonRecordRepositoryCore.FilterInMemory(
                query,
                comparisonType,
                leftRunId,
                rightRunId,
                createdFromUtc,
                createdToUtc,
                leftExportRecordId,
                rightExportRecordId,
                label,
                tags);
            query = ComparisonRecordRepositoryCore.OrderInMemory(query, sortBy, sortDir);
            List<ComparisonRecord> page = query
                .Skip(safeSkip)
                .Take(safeLimit)
                .Select(ComparisonRecordListProjection.WithoutPayloadJson)
                .ToList();

            return Task.FromResult<IReadOnlyList<ComparisonRecord>>(page);
        }
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<ComparisonRecord>> SearchByCursorAsync(
        string? comparisonType,
        string? leftRunId,
        string? rightRunId,
        DateTime? createdFromUtc,
        DateTime? createdToUtc,
        string? leftExportRecordId,
        string? rightExportRecordId,
        string? label,
        IReadOnlyList<string>? tags,
        string? sortBy,
        string? sortDir,
        DateTime? cursorCreatedUtc,
        string? cursorComparisonRecordId,
        int limit,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        string orderColumn = ComparisonRecordRepositoryCore.ResolveOrderColumn(sortBy);
        ComparisonRecordRepositoryCore.EnsureCursorPagingSupportsOrderColumn(orderColumn);

        int safeLimit = ComparisonRecordRepositoryCore.ClampLimit(limit);
        bool sortDescending = ComparisonRecordRepositoryCore.IsSortDescending(sortDir);

        lock (_gate)
        {
            IEnumerable<ComparisonRecord> query = _items.Select(ComparisonRecordRepositoryCore.Clone);
            query = ComparisonRecordRepositoryCore.FilterInMemory(
                query,
                comparisonType,
                leftRunId,
                rightRunId,
                createdFromUtc,
                createdToUtc,
                leftExportRecordId,
                rightExportRecordId,
                label,
                tags);

            if (cursorCreatedUtc is not null && !string.IsNullOrWhiteSpace(cursorComparisonRecordId))
            {
                query = query.Where(r => ComparisonRecordRepositoryCore.MatchesCursor(
                    r,
                    cursorCreatedUtc.Value,
                    cursorComparisonRecordId,
                    sortDescending));
            }

            query = ComparisonRecordRepositoryCore.OrderInMemory(query, sortBy, sortDir);
            List<ComparisonRecord> page = query
                .Take(safeLimit)
                .Select(ComparisonRecordListProjection.WithoutPayloadJson)
                .ToList();

            return Task.FromResult<IReadOnlyList<ComparisonRecord>>(page);
        }
    }

    /// <inheritdoc />
    public Task<bool> UpdateLabelAndTagsAsync(
        string comparisonRecordId,
        string? label,
        IReadOnlyList<string>? tags,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(comparisonRecordId);
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            int i = _items.FindIndex(r =>
                string.Equals(r.ComparisonRecordId, comparisonRecordId, StringComparison.Ordinal));

            if (i < 0)
                return Task.FromResult(false);

            if (label is not null)
                _items[i].Label = label;

            if (tags is not null)
                _items[i].Tags = [.. tags];

            return Task.FromResult(true);
        }
    }

    /// <summary>
    ///     Integration test support: overwrites <see cref="ComparisonRecord.PayloadJson" /> for an existing record in this
    ///     in-memory store.
    /// </summary>
    internal void ReplacePayloadJsonForIntegrationTest(string comparisonRecordId, string payloadJson)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(comparisonRecordId);
        ArgumentNullException.ThrowIfNull(payloadJson);

        lock (_gate)
        {
            ComparisonRecord? row = _items.FirstOrDefault(r =>
                string.Equals(r.ComparisonRecordId, comparisonRecordId, StringComparison.Ordinal));

            if (row is null)
                throw new InvalidOperationException($"Comparison record '{comparisonRecordId}' was not found.");

            row.PayloadJson = payloadJson;
        }
    }
}
