namespace ArchLucid.Persistence.Orchestration;

/// <summary>In-memory outbox for tests and <c>StorageProvider=InMemory</c>.</summary>
public sealed class InMemoryAuthorityPipelineWorkRepository : IAuthorityPipelineWorkRepository
{
    private readonly Func<DateTime> _utcNow;

    public InMemoryAuthorityPipelineWorkRepository() : this(static () => DateTime.UtcNow)
    {
    }

    internal InMemoryAuthorityPipelineWorkRepository(Func<DateTime> utcNow)
    {
        _utcNow = utcNow ?? throw new ArgumentNullException(nameof(utcNow));
    }

    private sealed class Stored
    {
        public required Guid OutboxId { get; init; }
        public required Guid RunId { get; init; }
        public required Guid TenantId { get; init; }
        public required Guid WorkspaceId { get; init; }
        public required Guid ProjectId { get; init; }
        public required string PayloadJson { get; init; }
        public DateTime CreatedUtc { get; init; }
        public int AttemptCount { get; set; }
        public DateTime? LockedUntilUtc { get; set; }
        public DateTime? NextAttemptUtc { get; set; }
        public string? LastAttemptError { get; set; }
        public DateTime? DeadLetteredUtc { get; set; }
        public DateTime? ProcessedUtc { get; set; }
    }

    private readonly List<Stored> _rows = [];

    private readonly Lock _sync = new();

    /// <inheritdoc />
    public Task EnqueueAsync(
        Guid runId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string payloadJson,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(payloadJson);

        Stored entry = new()
        {
            OutboxId = Guid.NewGuid(),
            RunId = runId,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            PayloadJson = payloadJson,
            CreatedUtc = _utcNow()
        };

        lock (_sync)

            _rows.Add(entry);


        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<AuthorityPipelineWorkOutboxEntry>> DequeuePendingAsync(
        int maxBatch,
        int leaseDurationSeconds,
        CancellationToken cancellationToken = default)
    {
        int take = Math.Clamp(maxBatch, 1, 100);
        int lease = Math.Clamp(leaseDurationSeconds, 60, 7200);
        DateTime now = _utcNow();
        TimeSpan leaseSpan = TimeSpan.FromSeconds(lease);

        lock (_sync)
        {
            List<Stored> batch = EligibleRows(now).OrderBy(x => x.CreatedUtc).Take(take).ToList();

            foreach (Stored row in batch)
                row.LockedUntilUtc = now + leaseSpan;

            return Task.FromResult<IReadOnlyList<AuthorityPipelineWorkOutboxEntry>>(batch.Select(ToEntry).ToList());
        }
    }

    /// <inheritdoc />
    public Task MarkProcessedAsync(Guid outboxId, CancellationToken cancellationToken = default)
    {
        lock (_sync)
        {
            Stored? row = _rows.Find(x => x.OutboxId == outboxId);
            if (row is null || row.ProcessedUtc is not null)
                return Task.CompletedTask;

            row.ProcessedUtc = _utcNow();
            row.LockedUntilUtc = null;
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task RecordBackoffAfterProcessingFailureAsync(Guid outboxId, DateTime nextAttemptUtc,
        string failedAttemptErrorSummaryTruncatedTo400, CancellationToken cancellationToken = default)
    {
        string err = AuthorityPipelineWorkErrorSummary.TruncateNullable(failedAttemptErrorSummaryTruncatedTo400);

        lock (_sync)
        {
            Stored? row = _rows.Find(x => x.OutboxId == outboxId);

            if (row is null || row.ProcessedUtc is not null || row.DeadLetteredUtc is not null)
                return Task.CompletedTask;

            row.LockedUntilUtc = null;
            row.AttemptCount++;
            row.NextAttemptUtc = NormalizeUtc(nextAttemptUtc);
            row.LastAttemptError = err;
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task RecordDeadLetterAsync(Guid outboxId, string failedAttemptErrorSummaryTruncatedTo400,
        CancellationToken cancellationToken = default)
    {
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
    public Task<long> CountPendingAsync(CancellationToken cancellationToken = default)
    {
        lock (_sync)

            return Task.FromResult((long)_rows.Count(r => r.ProcessedUtc is null && r.DeadLetteredUtc is null));
    }

    /// <inheritdoc />
    public Task<long> CountActionablePendingAsync(CancellationToken cancellationToken = default)
    {
        DateTime now = _utcNow();

        lock (_sync)

            return Task.FromResult((long)EligibleRows(now).Count());
    }

    /// <inheritdoc />
    public Task<long> CountDeadLetteredAsync(CancellationToken cancellationToken = default)
    {
        lock (_sync)

            return Task.FromResult((long)_rows.Count(r => r.DeadLetteredUtc is not null && r.ProcessedUtc is null));
    }

    private IEnumerable<Stored> EligibleRows(DateTime nowUtc)
    {
        foreach (Stored row in _rows)

            if (row.ProcessedUtc is null
                && row.DeadLetteredUtc is null
                && (row.NextAttemptUtc is null || row.NextAttemptUtc <= nowUtc)
                && (row.LockedUntilUtc is null || row.LockedUntilUtc <= nowUtc))
                yield return row;
    }

    private static AuthorityPipelineWorkOutboxEntry ToEntry(Stored row)
    {
        return new AuthorityPipelineWorkOutboxEntry
        {
            OutboxId = row.OutboxId,
            RunId = row.RunId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            PayloadJson = row.PayloadJson,
            CreatedUtc = row.CreatedUtc,
            AttemptCount = row.AttemptCount,
            LockedUntilUtc = row.LockedUntilUtc,
            NextAttemptUtc = row.NextAttemptUtc,
            LastAttemptError = row.LastAttemptError,
            DeadLetteredUtc = row.DeadLetteredUtc
        };
    }

    private static DateTime NormalizeUtc(DateTime value)
    {
        return value.Kind is DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
            : value.ToUniversalTime();
    }
}
