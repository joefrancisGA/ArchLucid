using System.Data;

namespace ArchLucid.Persistence.IntegrationOutbox;

/// <summary>In-memory outbox for tests and <c>StorageProvider=InMemory</c>.</summary>
public sealed class InMemoryIntegrationEventOutboxRepository : IIntegrationEventOutboxRepository
{
    private readonly List<IntegrationEventOutboxEntry> _rows = [];
    private readonly Lock _gate = new();

    /// <inheritdoc />
    public Task EnqueueAsync(
        Guid? runId,
        string eventType,
        string? messageId,
        ReadOnlyMemory<byte> payloadUtf8,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        return EnqueueCoreAsync(runId, eventType, messageId, payloadUtf8, tenantId, workspaceId, projectId);
    }

    /// <inheritdoc />
    public Task EnqueueAsync(
        Guid? runId,
        string eventType,
        string? messageId,
        ReadOnlyMemory<byte> payloadUtf8,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        IDbConnection connection,
        IDbTransaction transaction,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(transaction);

        return EnqueueCoreAsync(runId, eventType, messageId, payloadUtf8, tenantId, workspaceId, projectId);
    }

    private Task EnqueueCoreAsync(
        Guid? runId,
        string eventType,
        string? messageId,
        ReadOnlyMemory<byte> payloadUtf8,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId)
    {
        IntegrationEventOutboxEntry entry = IntegrationEventOutboxRepositoryCore.CreateEnqueueEntry(
            runId,
            eventType,
            messageId,
            payloadUtf8,
            tenantId,
            workspaceId,
            projectId,
            TimeProvider.System.UtcNowDateTime());

        lock (_gate)
            _rows.Add(entry);

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<IntegrationEventOutboxEntry>> DequeuePendingAsync(int maxBatch, CancellationToken ct)
    {
        int take = IntegrationEventOutboxRepositoryCore.ClampDequeueBatch(maxBatch);
        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        lock (_gate)
        {
            List<IntegrationEventOutboxEntry> batch = IntegrationEventOutboxRepositoryCore
                .OrderPendingForDequeue(_rows, utcNow)
                .Take(take)
                .ToList();

            return Task.FromResult<IReadOnlyList<IntegrationEventOutboxEntry>>(batch);
        }
    }

    /// <inheritdoc />
    public Task MarkProcessedAsync(Guid outboxId, CancellationToken ct)
    {
        lock (_gate)
            _rows.RemoveAll(entry => entry.OutboxId == outboxId);

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task RecordPublishFailureAsync(
        Guid outboxId,
        int newRetryCount,
        DateTime? nextRetryUtc,
        DateTime? deadLetteredUtc,
        string? lastErrorMessage,
        CancellationToken ct)
    {
        lock (_gate)
        {
            int idx = _rows.FindIndex(entry => entry.OutboxId == outboxId);

            if (idx < 0)
                return Task.CompletedTask;

            _rows[idx] = IntegrationEventOutboxRepositoryCore.WithPublishFailure(
                _rows[idx],
                newRetryCount,
                nextRetryUtc,
                deadLetteredUtc,
                lastErrorMessage);
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<long> CountIntegrationOutboxPublishPendingAsync(CancellationToken ct)
    {
        lock (_gate)
        {
            long count = _rows.LongCount(IntegrationEventOutboxRepositoryCore.IsPublishPending);
            return Task.FromResult(count);
        }
    }

    /// <inheritdoc />
    public Task<long> CountIntegrationOutboxDeadLetterAsync(CancellationToken ct)
    {
        lock (_gate)
        {
            long count = _rows.LongCount(IntegrationEventOutboxRepositoryCore.IsDeadLetter);
            return Task.FromResult(count);
        }
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<IntegrationEventOutboxDeadLetterRow>> ListDeadLettersAsync(
        int maxRows,
        Guid? tenantId,
        int skip,
        CancellationToken ct)
    {
        int take = IntegrationEventOutboxRepositoryCore.ClampDeadLetterRows(maxRows);
        int offset = IntegrationEventOutboxRepositoryCore.ClampDeadLetterSkip(skip);

        lock (_gate)
        {
            List<IntegrationEventOutboxDeadLetterRow> list = IntegrationEventOutboxRepositoryCore
                .OrderDeadLettersForList(_rows)
                .Where(entry => IntegrationEventOutboxRepositoryCore.MatchesDeadLetterScope(entry, tenantId))
                .Skip(offset)
                .Take(take)
                .Select(IntegrationEventOutboxRepositoryCore.MapDeadLetterRow)
                .ToList();

            return Task.FromResult<IReadOnlyList<IntegrationEventOutboxDeadLetterRow>>(list);
        }
    }

    /// <inheritdoc />
    public Task<bool> ResetDeadLetterForRetryAsync(Guid outboxId, Guid? tenantId, CancellationToken ct)
    {
        lock (_gate)
        {
            int idx = _rows.FindIndex(
                entry => entry.OutboxId == outboxId
                         && IntegrationEventOutboxRepositoryCore.IsDeadLetter(entry)
                         && IntegrationEventOutboxRepositoryCore.MatchesDeadLetterScope(entry, tenantId));

            if (idx < 0)
                return Task.FromResult(false);

            _rows[idx] = IntegrationEventOutboxRepositoryCore.ResetDeadLetterForRetry(_rows[idx]);
            return Task.FromResult(true);
        }
    }

    /// <inheritdoc />
    public Task<bool> AcknowledgeDeadLetterAsync(Guid outboxId, Guid? tenantId, CancellationToken ct)
    {
        lock (_gate)
        {
            int idx = _rows.FindIndex(
                entry => entry.OutboxId == outboxId
                         && IntegrationEventOutboxRepositoryCore.IsDeadLetter(entry)
                         && IntegrationEventOutboxRepositoryCore.MatchesDeadLetterScope(entry, tenantId));

            if (idx < 0)
                return Task.FromResult(false);

            _rows.RemoveAt(idx);
            return Task.FromResult(true);
        }
    }

    /// <inheritdoc />
    public Task<IntegrationOutboxDeadLetterBulkRetryResult> RetryMatchingDeadLettersAsync(
        Guid? tenantId,
        string? eventType,
        int maxRows,
        CancellationToken ct)
    {
        int take = IntegrationEventOutboxRepositoryCore.ClampDeadLetterRows(maxRows);
        string? normalizedEventType = IntegrationEventOutboxRepositoryCore.NormalizeEventTypeFilter(eventType);

        lock (_gate)
        {
            List<Guid> retried = [];

            foreach (IntegrationEventOutboxEntry candidate in IntegrationEventOutboxRepositoryCore
                         .OrderDeadLettersForList(_rows)
                         .Where(entry => IntegrationEventOutboxRepositoryCore.MatchesDeadLetterForBulkRetry(
                             entry,
                             tenantId,
                             normalizedEventType))
                         .Take(take))
            {
                int idx = _rows.FindIndex(
                    entry => entry.OutboxId == candidate.OutboxId
                             && IntegrationEventOutboxRepositoryCore.IsDeadLetter(entry));

                if (idx < 0)
                    continue;

                _rows[idx] = IntegrationEventOutboxRepositoryCore.ResetDeadLetterForRetry(_rows[idx]);
                retried.Add(candidate.OutboxId);
            }

            return Task.FromResult(new IntegrationOutboxDeadLetterBulkRetryResult
            {
                RetriedCount = retried.Count,
                RetriedOutboxIds = retried,
            });
        }
    }

    /// <inheritdoc />
    public Task<IntegrationEventOutboxEntry?> TryGetDeadLetterEntryAsync(
        Guid outboxId,
        Guid? tenantId,
        CancellationToken ct)
    {
        lock (_gate)
        {
            IntegrationEventOutboxEntry? entry = _rows.FirstOrDefault(
                candidate => candidate.OutboxId == outboxId
                             && IntegrationEventOutboxRepositoryCore.IsDeadLetter(candidate)
                             && IntegrationEventOutboxRepositoryCore.MatchesDeadLetterScope(candidate, tenantId));

            return Task.FromResult(entry);
        }
    }
}
