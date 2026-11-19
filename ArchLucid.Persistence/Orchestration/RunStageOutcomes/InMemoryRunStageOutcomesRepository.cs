using System.Collections.Concurrent;
using System.Data;

using ArchLucid.Core.Persistence.ApplicationPorts.Runs;

namespace ArchLucid.Persistence.Orchestration.RunStageOutcomes;

/// <summary>In-memory <see cref="IRunStageOutcomesRepository" /> for tests and StorageProvider=InMemory.</summary>
public sealed class InMemoryRunStageOutcomesRepository : IRunStageOutcomesRepository
{
    private readonly ConcurrentDictionary<(Guid RunId, string StageName), StoredRow> _rows = new();

    public Task RecordStageStartedAsync(
        Guid runId,
        string stageName,
        DateTime startedUtc,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        cancellationToken.ThrowIfCancellationRequested();
        _ = connection;
        _ = transaction;

        _rows[(runId, stageName)] = new StoredRow(stageName, startedUtc, null, "running");

        return Task.CompletedTask;
    }

    public Task RecordStageCompletedAsync(
        Guid runId,
        string stageName,
        string outcomeStatus,
        DateTime completedUtc,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        cancellationToken.ThrowIfCancellationRequested();
        _ = connection;
        _ = transaction;

        var key = (runId, stageName);
        while (_rows.TryGetValue(key, out StoredRow? existing))
        {
            StoredRow updated = existing with
            {
                CompletedUtc = completedUtc,
                OutcomeStatus = outcomeStatus,
            };

            if (_rows.TryUpdate(key, updated, existing))
                break;
        }

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<StageTimelineSummary>> ListByRunIdAsync(
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        IReadOnlyList<StageTimelineSummary> items = _rows
            .Where(kvp => kvp.Key.RunId == runId)
            .Select(static kvp => StageTimelineSummary.FromRow(
                kvp.Value.StageName,
                kvp.Value.StartedUtc,
                kvp.Value.CompletedUtc,
                kvp.Value.OutcomeStatus))
            .OrderBy(static summary => summary.StartedUtc)
            .ThenBy(static summary => summary.StageName, StringComparer.Ordinal)
            .ToList();

        return Task.FromResult(items);
    }

    private sealed record StoredRow(string StageName, DateTime StartedUtc, DateTime? CompletedUtc, string OutcomeStatus);
}
