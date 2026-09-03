using ArchLucid.Core.Integration;

namespace ArchLucid.Persistence.IntegrationOutbox;

/// <summary>
///     Shared integration-event outbox repository rules for SQL and in-memory implementations.
/// </summary>
internal static class IntegrationEventOutboxRepositoryCore
{
    public const int MaxDequeueBatch = 100;
    public const int MaxDeadLetterRows = 500;
    public const int MaxErrorMessageLength = 2048;

    public static int ClampDequeueBatch(int maxBatch) => Math.Clamp(maxBatch, 1, MaxDequeueBatch);

    public static int ClampDeadLetterRows(int maxRows) => Math.Clamp(maxRows, 1, MaxDeadLetterRows);

    public static int ClampDeadLetterSkip(int skip) => Math.Max(0, skip);

    public static int DrainSortPriority(int? priority) => priority ?? 1;

    public static bool IsDeadLetter(IntegrationEventOutboxEntry entry)
    {
        ArgumentNullException.ThrowIfNull(entry);
        return entry.DeadLetteredUtc is not null;
    }

    public static bool IsPublishPending(IntegrationEventOutboxEntry entry)
    {
        ArgumentNullException.ThrowIfNull(entry);
        return entry.DeadLetteredUtc is null;
    }

    public static bool IsPendingDequeue(IntegrationEventOutboxEntry entry, DateTime utcNow)
    {
        ArgumentNullException.ThrowIfNull(entry);

        return IsPublishPending(entry)
               && (entry.NextRetryUtc is null || entry.NextRetryUtc <= utcNow);
    }

    public static IEnumerable<IntegrationEventOutboxEntry> OrderPendingForDequeue(
        IEnumerable<IntegrationEventOutboxEntry> entries,
        DateTime utcNow)
    {
        ArgumentNullException.ThrowIfNull(entries);

        return entries
            .Where(entry => IsPendingDequeue(entry, utcNow))
            .OrderBy(entry => DrainSortPriority(entry.Priority))
            .ThenBy(entry => entry.CreatedUtc);
    }

    public static string? NormalizeEventTypeFilter(string? eventType) =>
        string.IsNullOrWhiteSpace(eventType) ? null : eventType.Trim();

    public static string? TruncateErrorMessage(string? message) =>
        message is null ? null : message.Length <= MaxErrorMessageLength ? message : message[..MaxErrorMessageLength];

    public static bool MatchesDeadLetterScope(IntegrationEventOutboxEntry entry, Guid? tenantId)
    {
        ArgumentNullException.ThrowIfNull(entry);
        return tenantId is null || entry.TenantId == tenantId;
    }

    public static bool MatchesDeadLetterForBulkRetry(
        IntegrationEventOutboxEntry entry,
        Guid? tenantId,
        string? normalizedEventType)
    {
        ArgumentNullException.ThrowIfNull(entry);

        return IsDeadLetter(entry)
               && MatchesDeadLetterScope(entry, tenantId)
               && (normalizedEventType is null
                   || string.Equals(entry.EventType, normalizedEventType, StringComparison.Ordinal));
    }

    public static IEnumerable<IntegrationEventOutboxEntry> OrderDeadLettersForList(
        IEnumerable<IntegrationEventOutboxEntry> entries)
    {
        ArgumentNullException.ThrowIfNull(entries);

        return entries
            .Where(IsDeadLetter)
            .OrderByDescending(entry => entry.DeadLetteredUtc);
    }

    public static IntegrationEventOutboxEntry CreateEnqueueEntry(
        Guid? runId,
        string eventType,
        string? messageId,
        ReadOnlyMemory<byte> payloadUtf8,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DateTime createdUtc)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(eventType);

        return new IntegrationEventOutboxEntry
        {
            OutboxId = Guid.NewGuid(),
            RunId = runId,
            EventType = eventType,
            MessageId = messageId,
            PayloadUtf8 = payloadUtf8.ToArray(),
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            CreatedUtc = createdUtc,
            Priority = IntegrationEventOutboxPriority.ForEventType(eventType),
            RetryCount = 0,
            NextRetryUtc = null,
            LastErrorMessage = null,
            DeadLetteredUtc = null,
        };
    }

    public static IntegrationEventOutboxEntry WithPublishFailure(
        IntegrationEventOutboxEntry entry,
        int newRetryCount,
        DateTime? nextRetryUtc,
        DateTime? deadLetteredUtc,
        string? lastErrorMessage)
    {
        ArgumentNullException.ThrowIfNull(entry);

        return new IntegrationEventOutboxEntry
        {
            OutboxId = entry.OutboxId,
            RunId = entry.RunId,
            EventType = entry.EventType,
            MessageId = entry.MessageId,
            PayloadUtf8 = entry.PayloadUtf8,
            TenantId = entry.TenantId,
            WorkspaceId = entry.WorkspaceId,
            ProjectId = entry.ProjectId,
            CreatedUtc = entry.CreatedUtc,
            Priority = entry.Priority,
            RetryCount = newRetryCount,
            NextRetryUtc = nextRetryUtc,
            DeadLetteredUtc = deadLetteredUtc,
            LastErrorMessage = TruncateErrorMessage(lastErrorMessage),
        };
    }

    public static IntegrationEventOutboxEntry ResetDeadLetterForRetry(IntegrationEventOutboxEntry entry)
    {
        ArgumentNullException.ThrowIfNull(entry);

        return new IntegrationEventOutboxEntry
        {
            OutboxId = entry.OutboxId,
            RunId = entry.RunId,
            EventType = entry.EventType,
            MessageId = entry.MessageId,
            PayloadUtf8 = entry.PayloadUtf8,
            TenantId = entry.TenantId,
            WorkspaceId = entry.WorkspaceId,
            ProjectId = entry.ProjectId,
            CreatedUtc = entry.CreatedUtc,
            Priority = entry.Priority,
            RetryCount = 0,
            NextRetryUtc = null,
            DeadLetteredUtc = null,
            LastErrorMessage = null,
        };
    }

    public static IntegrationEventOutboxDeadLetterRow MapDeadLetterRow(IntegrationEventOutboxEntry entry)
    {
        ArgumentNullException.ThrowIfNull(entry);

        return new IntegrationEventOutboxDeadLetterRow
        {
            OutboxId = entry.OutboxId,
            RunId = entry.RunId,
            TenantId = entry.TenantId,
            EventType = entry.EventType,
            DeadLetteredUtc = entry.DeadLetteredUtc!.Value,
            RetryCount = entry.RetryCount,
            LastErrorMessage = entry.LastErrorMessage,
        };
    }
}
