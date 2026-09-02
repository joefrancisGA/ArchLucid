using ArchLucid.Persistence.Coordination;
using ArchLucid.Persistence.Orchestration;

namespace ArchLucid.Persistence.Coordination.Export;

/// <summary>In-memory <see cref="IRunExportBlobPushOutboxRepository" /> for tests and <c>StorageProvider=InMemory</c>.</summary>
public sealed class InMemoryRunExportBlobPushOutboxRepository : IRunExportBlobPushOutboxRepository
{
    private readonly Func<DateTime> _utcNow;

    public InMemoryRunExportBlobPushOutboxRepository() : this(static () => TimeProvider.System.UtcNowDateTime())
    {
    }

    internal InMemoryRunExportBlobPushOutboxRepository(Func<DateTime> utcNow)
    {
        _utcNow = utcNow ?? throw new ArgumentNullException(nameof(utcNow));
    }

    private sealed class Stored
    {
        public required Guid OutboxId
        {
            get;
            init;
        }

        public required Guid RunId
        {
            get;
            init;
        }

        public required Guid TenantId
        {
            get;
            init;
        }

        public required Guid WorkspaceId
        {
            get;
            init;
        }

        public required Guid ProjectId
        {
            get;
            init;
        }

        public required string DestinationSasUrl
        {
            get;
            init;
        }

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public int AttemptCount
        {
            get;
            set;
        }

        public DateTime? LockedUntilUtc
        {
            get;
            set;
        }

        public DateTime? NextAttemptUtc
        {
            get;
            set;
        }

        public string? LastAttemptError
        {
            get;
            set;
        }

        public DateTime? DeadLetteredUtc
        {
            get;
            set;
        }

        public DateTime? ProcessedUtc
        {
            get;
            set;
        }
    }

    private readonly List<Stored> _rows = [];

    private readonly Lock _sync = new();

    /// <inheritdoc />
    public Task EnqueueAsync(
        Guid runId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string destinationSasUrl,
        CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(destinationSasUrl);
        ct.ThrowIfCancellationRequested();

        Stored entry = new()
        {
            OutboxId = Guid.NewGuid(),
            RunId = runId,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            DestinationSasUrl = destinationSasUrl,
            CreatedUtc = _utcNow()
        };

        lock (_sync)
            _rows.Add(entry);

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<RunExportBlobPushOutboxEntry>> DequeuePendingAsync(
        int maxBatch,
        int leaseDurationSeconds,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        int take = CoordinationOutboxRepositoryCore.ClampDequeueBatch(maxBatch);
        int lease = CoordinationOutboxRepositoryCore.ClampLeaseDurationSeconds(leaseDurationSeconds);
        DateTime now = _utcNow();
        TimeSpan leaseSpan = TimeSpan.FromSeconds(lease);

        lock (_sync)
        {
            List<Stored> batch = CoordinationOutboxRepositoryCore
                .OrderEligibleForDequeue(
                    _rows,
                    static row => row.ProcessedUtc,
                    static row => row.DeadLetteredUtc,
                    static row => row.NextAttemptUtc,
                    static row => row.LockedUntilUtc,
                    static row => row.CreatedUtc,
                    static row => row.OutboxId,
                    now)
                .Take(take)
                .ToList();

            foreach (Stored row in batch)
                row.LockedUntilUtc = now + leaseSpan;

            return Task.FromResult<IReadOnlyList<RunExportBlobPushOutboxEntry>>(batch.Select(ToEntry).ToList());
        }
    }

    /// <inheritdoc />
    public Task MarkProcessedAsync(Guid outboxId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        lock (_sync)
        {
            Stored? row = _rows.Find(x => x.OutboxId == outboxId);

            if (row is null || !CoordinationOutboxRepositoryCore.CanMarkProcessed(row.ProcessedUtc))
                return Task.CompletedTask;

            row.ProcessedUtc = _utcNow();
            row.LockedUntilUtc = null;
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task RecordBackoffAfterProcessingFailureAsync(
        Guid outboxId,
        DateTime nextAttemptUtc,
        string failedAttemptErrorSummaryTruncatedTo400,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        string err = AuthorityPipelineWorkErrorSummary.TruncateNullable(failedAttemptErrorSummaryTruncatedTo400);

        lock (_sync)
        {
            Stored? row = _rows.Find(x => x.OutboxId == outboxId);

            if (row is null
                || !CoordinationOutboxRepositoryCore.CanRecordBackoff(row.ProcessedUtc, row.DeadLetteredUtc))
                return Task.CompletedTask;

            row.LockedUntilUtc = null;
            row.AttemptCount++;
            row.NextAttemptUtc = CoordinationOutboxRepositoryCore.NormalizeUtc(nextAttemptUtc);
            row.LastAttemptError = err;
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task RecordDeadLetterAsync(
        Guid outboxId,
        string failedAttemptErrorSummaryTruncatedTo400,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        string err = AuthorityPipelineWorkErrorSummary.TruncateNullable(failedAttemptErrorSummaryTruncatedTo400);

        lock (_sync)
        {
            Stored? row = _rows.Find(x => x.OutboxId == outboxId);

            if (row is null || row.ProcessedUtc is not null || row.DeadLetteredUtc is not null)
                return Task.CompletedTask;

            row.LockedUntilUtc = null;
            row.AttemptCount++;
            row.DeadLetteredUtc = _utcNow();
            row.LastAttemptError = err;
            row.NextAttemptUtc = null;
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<long> CountPendingAsync(CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        lock (_sync)

            return Task.FromResult((long)_rows.Count(r =>
                CoordinationOutboxRepositoryCore.IsPendingCount(r.ProcessedUtc, r.DeadLetteredUtc)));
    }

    /// <inheritdoc />
    public Task<long> CountDeadLetteredAsync(CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        lock (_sync)

            return Task.FromResult((long)_rows.Count(r =>
                CoordinationOutboxRepositoryCore.IsDeadLetteredCount(r.ProcessedUtc, r.DeadLetteredUtc)));
    }


    private static RunExportBlobPushOutboxEntry ToEntry(Stored row)
    {
        return new RunExportBlobPushOutboxEntry
        {
            OutboxId = row.OutboxId,
            RunId = row.RunId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            DestinationSasUrl = row.DestinationSasUrl,
            CreatedUtc = row.CreatedUtc,
            AttemptCount = row.AttemptCount,
            LockedUntilUtc = row.LockedUntilUtc,
            NextAttemptUtc = row.NextAttemptUtc,
            LastAttemptError = row.LastAttemptError,
            DeadLetteredUtc = row.DeadLetteredUtc
        };
    }

}
