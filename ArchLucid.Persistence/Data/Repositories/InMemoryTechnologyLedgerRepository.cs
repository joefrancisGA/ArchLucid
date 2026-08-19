using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Thread-safe in-memory <see cref="ITechnologyLedgerRepository" /> for tests and no-SQL local runs.
/// </summary>
public sealed class InMemoryTechnologyLedgerRepository : ITechnologyLedgerRepository
{
    private readonly Lock _gate = new();
    private readonly List<TechnologyLedgerEntry> _items = [];

    /// <inheritdoc />
    public Task AddAsync(TechnologyLedgerEntry entry, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(entry);
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            _items.Add(Clone(entry));
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<TechnologyLedgerEntry>> GetByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        _ = scope;
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            List<TechnologyLedgerEntry> list = _items
                .Where(e => string.Equals(e.RunId, runId, StringComparison.Ordinal))
                .OrderBy(e => e.CreatedUtc)
                .Select(Clone)
                .ToList();

            return Task.FromResult<IReadOnlyList<TechnologyLedgerEntry>>(list);
        }
    }

    /// <inheritdoc />
    public Task UpdateAsync(TechnologyLedgerEntry entry, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(entry);
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            int i = _items.FindIndex(e => string.Equals(e.EntryId, entry.EntryId, StringComparison.Ordinal));

            if (i < 0)
                return Task.CompletedTask;

            _items[i] = Clone(entry);
        }

        return Task.CompletedTask;
    }

    private static TechnologyLedgerEntry Clone(TechnologyLedgerEntry source) => new()
    {
        EntryId = source.EntryId,
        RunId = source.RunId,
        Role = source.Role,
        TechnologyName = source.TechnologyName,
        ProviderFamily = source.ProviderFamily,
        Status = source.Status,
        Source = source.Source,
        EvidenceRef = source.EvidenceRef,
        Rationale = source.Rationale,
        IsLocked = source.IsLocked,
        CreatedUtc = source.CreatedUtc,
        UpdatedUtc = source.UpdatedUtc,
    };
}
