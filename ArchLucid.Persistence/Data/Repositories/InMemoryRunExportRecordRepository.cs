using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Thread-safe in-memory <see cref="IRunExportRecordRepository" /> (JSON clone-on-read).
/// </summary>
public sealed class InMemoryRunExportRecordRepository : IRunExportRecordRepository
{
    private readonly Dictionary<string, RunExportRecord> _byExportId = new(StringComparer.Ordinal);
    private readonly Dictionary<string, List<RunExportRecord>> _byRunId = new(StringComparer.Ordinal);
    private readonly Lock _gate = new();

    /// <inheritdoc />
    public Task CreateAsync(RunExportRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(record.ExportRecordId))
            throw new ArgumentException("ExportRecordId is required.", nameof(record));

        RunExportRecord stored = Clone(record);
        stored.ExportRecordId = ComparisonExportRecordIdLookup.NormalizeLookupKey(stored.ExportRecordId);
        RunExportRecordPersistNormalizer.NormalizeLoadedRecord(stored);

        lock (_gate)
        {
            _byExportId[stored.ExportRecordId] = stored;

            if (!TryGetRunExportList(stored.RunId, out List<RunExportRecord>? existingList))
            {
                existingList = [];
            }
            else
            {
                foreach (string key in _byRunId.Keys.ToArray())
                {
                    if (_byRunId[key] == existingList
                        && !string.Equals(key, stored.RunId, StringComparison.Ordinal))
                    {
                        _byRunId.Remove(key);
                    }
                }
            }

            _byRunId[stored.RunId] = existingList!;
            List<RunExportRecord> list = existingList!;

            int existingIndex = list.FindIndex(
                r => ComparisonExportRecordIdLookup.StoredValueMatchesLookup(r.ExportRecordId, stored.ExportRecordId));

            if (existingIndex >= 0)
                list[existingIndex] = stored;
            else
                list.Add(stored);
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<RunExportRecord>> GetByRunIdAsync(
        string runId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        IReadOnlyList<string> lookupKeys = RunExportRecordRunIdSql.LookupKeys(runId);
        HashSet<string> requestedRunIds = lookupKeys.ToHashSet(StringComparer.OrdinalIgnoreCase);

        lock (_gate)
        {
            List<RunExportRecord> merged = [];

            foreach (KeyValuePair<string, List<RunExportRecord>> entry in _byRunId)
            {
                IReadOnlyList<string> storedRunLookupKeys = RunExportRecordRunIdSql.LookupKeys(entry.Key.Trim());

                if (!storedRunLookupKeys.Any(key => requestedRunIds.Contains(key)))
                    continue;

                merged.AddRange(entry.Value);
            }

            if (merged.Count == 0)
                return Task.FromResult<IReadOnlyList<RunExportRecord>>([]);

            List<RunExportRecord> ordered = merged
                .GroupBy(r => r.ExportRecordId, StringComparer.Ordinal)
                .Select(g => g.First())
                .OrderByDescending(r => r.CreatedUtc)
                .Select(Clone)
                .ToList();

            return Task.FromResult<IReadOnlyList<RunExportRecord>>(ordered);
        }
    }

    /// <inheritdoc />
    public Task<RunExportRecord?> GetByIdAsync(
        string exportRecordId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        string normalizedExportRecordId = ComparisonExportRecordIdLookup.NormalizeLookupKey(exportRecordId);

        lock (_gate)
        {
            if (_byExportId.TryGetValue(normalizedExportRecordId, out RunExportRecord? direct))
                return Task.FromResult<RunExportRecord?>(Clone(direct));

            foreach (KeyValuePair<string, RunExportRecord> entry in _byExportId)
            {
                if (ComparisonExportRecordIdLookup.StoredValueMatchesLookup(entry.Key, normalizedExportRecordId))
                    return Task.FromResult<RunExportRecord?>(Clone(entry.Value));
            }

            return Task.FromResult<RunExportRecord?>(null);
        }
    }

    private bool TryGetRunExportList(string runId, out List<RunExportRecord>? list)
    {
        if (_byRunId.TryGetValue(runId, out list))
            return true;

        foreach (KeyValuePair<string, List<RunExportRecord>> entry in _byRunId)
        {
            if (string.Equals(entry.Key.Trim(), runId, StringComparison.Ordinal))
            {
                list = entry.Value;
                return true;
            }
        }

        list = null;
        return false;
    }

    private static RunExportRecord Clone(RunExportRecord source)
    {
        string json = JsonSerializer.Serialize(source, ContractJson.Default);
        RunExportRecord? copy = JsonSerializer.Deserialize<RunExportRecord>(json, ContractJson.Default);

        if (copy is null)
            throw new InvalidOperationException("Clone produced null RunExportRecord.");

        RunExportRecordPersistNormalizer.NormalizeLoadedRecord(copy);

        return copy;
    }
}
