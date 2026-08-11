using System.Diagnostics;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Integration-event delivery and outbox telemetry recording.
/// </summary>
/// <remarks>
///     Instrument field declarations remain in <c>ArchLucidInstrumentation.cs</c>.
/// </remarks>
public static partial class ArchLucidInstrumentation
{
    /// <summary>Increments <see cref="IntegrationEventDeliverySuccessTotal" />.</summary>
    public static void RecordIntegrationEventDeliverySuccess(string eventType)
    {
        string e = string.IsNullOrWhiteSpace(eventType) ? "unknown" : eventType.Trim();
        IntegrationEventDeliverySuccessTotal.Add(1, new TagList { { "event_type", e } });
    }

    /// <summary>Increments <see cref="IntegrationEventDeliveryFailedTotal" />.</summary>
    public static void RecordIntegrationEventDeliveryFailure(string eventType)
    {
        string e = string.IsNullOrWhiteSpace(eventType) ? "unknown" : eventType.Trim();
        IntegrationEventDeliveryFailedTotal.Add(1, new TagList { { "event_type", e } });
    }

    /// <summary>Increments <see cref="RunExportBlobPushOutboxProcessedSuccessTotal" />.</summary>
    public static void RecordRunExportBlobPushOutboxProcessedSuccess()
    {
        RunExportBlobPushOutboxProcessedSuccessTotal.Add(1);
    }

    /// <summary>Increments <see cref="RunExportBlobPushOutboxRetryScheduledTotal" />.</summary>
    public static void RecordRunExportBlobPushOutboxRetryScheduled()
    {
        RunExportBlobPushOutboxRetryScheduledTotal.Add(1);
    }

    /// <summary>Increments <see cref="RunExportBlobPushOutboxDeadLetteredTotal" />.</summary>
    public static void RecordRunExportBlobPushOutboxDeadLettered()
    {
        RunExportBlobPushOutboxDeadLetteredTotal.Add(1);
    }

    /// <summary>Increments <see cref="PostCommitProjectionOutboxProcessedSuccessTotal" />.</summary>
    public static void RecordPostCommitProjectionOutboxProcessedSuccess()
    {
        PostCommitProjectionOutboxProcessedSuccessTotal.Add(1);
    }

    /// <summary>Increments <see cref="PostCommitProjectionOutboxRetryScheduledTotal" />.</summary>
    public static void RecordPostCommitProjectionOutboxRetryScheduled()
    {
        PostCommitProjectionOutboxRetryScheduledTotal.Add(1);
    }

    /// <summary>Increments <see cref="PostCommitProjectionOutboxDeadLetteredTotal" />.</summary>
    public static void RecordPostCommitProjectionOutboxDeadLettered()
    {
        PostCommitProjectionOutboxDeadLetteredTotal.Add(1);
    }

    /// <summary>Records permanently failed integration outbox DLQ rows observed in one auto-retry pass.</summary>
    public static void RecordIntegrationEventDlqPermanentFailures(long count)
    {
        if (count <= 0)
            return;

        IntegrationEventDlqPermanentFailureTotal.Add(count);
    }
}
